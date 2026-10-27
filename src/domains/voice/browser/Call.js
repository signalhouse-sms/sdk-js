/**
 * @typedef {"inbound"|"outbound"} CallDirection
 * @typedef {"initial"|"ringing"|"in_progress"|"ended"|"failed"} CallStatus
 */

/**
 * Wraps a single SIP session — outbound or inbound — and exposes a
 * Twilio-shape Call API on top of the underlying JsSIP RTCSession.
 *
 * Lifecycle (outbound):
 *   new (status="initial") → ringing → in_progress → ended | failed
 *
 * Lifecycle (inbound, before .accept()):
 *   new (status="ringing") → in_progress (on accept) → ended | failed
 *
 * Custom SIP headers from inbound INVITEs are exposed on the instance
 * (notably `initiatorId` from `X-SignalHouse-Initiator`) so the host app
 * can correlate a server-initiated callback to its triggering REST call.
 *
 * Methods reject when the session is no longer in a state that supports
 * them (e.g., `.accept()` on an already-accepted call).
 */
export class Call {
	/**
	 * @param {Object} init - Initializer.
	 * @param {Object} init.session - The JsSIP RTCSession.
	 * @param {CallDirection} init.direction
	 * @param {Object} [init.request] - Inbound INVITE request, when direction === "inbound".
	 */
	constructor({ session, direction, request }) {
		this._session = session;
		this._listeners = new Map();
		this._remoteAudio = null;
		/** @type {boolean} Set true before accept/connect to route remote audio yourself instead of the hidden <audio>. */
		this.disableDefaultAudioOutput = false;

		this.direction = direction;
		this.id = session.id || session._request?.call_id || null;
		this.status = direction === "inbound" ? "ringing" : "initial";

		// From / To URIs. For inbound the session._request carries them; for
		// outbound JsSIP populates from session.remote_identity / local_identity
		// once the dialog is established.
		this.from = session.remote_identity?.uri?.toString?.() ?? request?.from?.uri?.toString?.() ?? null;
		this.to   = session.local_identity?.uri?.toString?.()  ?? request?.to?.uri?.toString?.()   ?? null;

		// Surface useful inbound headers. Most important: X-SignalHouse-Initiator,
		// which carries the call_id of the REST POST /v1/calls that triggered a
		// server-side two-leg-with-bridge ring. Host app can compare against its
		// pending dial set to decide whether to auto-accept.
		this.headers = {};
		if (request && typeof request.getHeader === "function") {
			for (const name of [
				"X-SignalHouse-Initiator",
				"X-Call-UUID",
				"X-Call-Type",
				"X-Route-Type",
				"X-Dest",
			]) {
				const v = request.getHeader(name);
				if (v) this.headers[name] = v;
			}
		}
		this.initiatorId = this.headers["X-SignalHouse-Initiator"] || null;
		this.callUuid   = this.headers["X-Call-UUID"] || null;

		this._wireSessionEvents();
	}

	// ─── Public API ─────────────────────────────────────────────────────────

	/**
	 * Accept an inbound call. No-op (warning) if outbound or already accepted.
	 * @param {Object} [opts]
	 * @param {MediaStream} [opts.mediaStream] - Pre-acquired stream from getUserMedia.
	 *   If omitted, the SDK calls getUserMedia({audio: true}) and uses the result.
	 * @param {RTCConfiguration} [opts.pcConfig] - WebRTC peer-connection config.
	 *   Falls back to {iceServers: [{urls: "stun:stun.l.google.com:19302"}]}.
	 * @returns {Promise<void>}
	 */
	async accept({ mediaStream, pcConfig } = {}) {
		if (this.direction !== "inbound") {
			console.warn("[Call.accept] no-op: only inbound calls can be accepted");
			return;
		}
		if (this.status !== "ringing") {
			console.warn(`[Call.accept] no-op: call is not ringing (status=${this.status})`);
			return;
		}
		const stream = mediaStream || (await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
		this._session.answer({
			mediaConstraints: { audio: true, video: false },
			mediaStream: stream,
			// Default: no STUN (rtpengine trust-address handles NAT). Override via pcConfig.
			pcConfig: pcConfig || { iceServers: [] },
		});
	}

	/**
	 * Reject an inbound call with 486 Busy (or supplied SIP code).
	 * @param {Object} [opts]
	 * @param {number} [opts.statusCode=486]
	 * @param {string} [opts.reason="Busy Here"]
	 */
	reject({ statusCode = 486, reason = "Busy Here" } = {}) {
		if (this.direction !== "inbound" || this.status !== "ringing") {
			console.warn("[Call.reject] no-op: only ringing inbound calls can be rejected");
			return;
		}
		try {
			this._session.terminate({ status_code: statusCode, reason_phrase: reason });
		} catch (err) {
			// JsSIP throws if the session is already gone — non-fatal here
			console.warn(`[Call.reject] terminate threw: ${err?.message || err}`);
		}
	}

	/**
	 * Hang up an in-progress or ringing outbound call. Idempotent.
	 */
	hangup() {
		if (this.status === "ended" || this.status === "failed") return;
		try {
			this._session.terminate();
		} catch (err) {
			console.warn(`[Call.hangup] terminate threw: ${err?.message || err}`);
		}
	}

	/**
	 * Send DTMF digits during an in-progress call. Accepts 0-9, *, #, w (wait).
	 * @param {string} digits
	 */
	sendDigits(digits) {
		if (this.status !== "in_progress") {
			console.warn(`[Call.sendDigits] no-op: call is not in_progress (status=${this.status})`);
			return;
		}
		try {
			this._session.sendDTMF(String(digits));
		} catch (err) {
			console.warn(`[Call.sendDigits] sendDTMF threw: ${err?.message || err}`);
		}
	}

	/**
	 * Mute or unmute the local microphone. Twilio-shape: pass `true` to mute,
	 * `false` to unmute. Stops/resumes sending audio RTP at the media layer —
	 * no SIP signaling, so it works regardless of server support.
	 * @param {boolean} [shouldMute=true]
	 */
	mute(shouldMute = true) {
		if (this.status !== "in_progress") {
			console.warn(`[Call.mute] no-op: call is not in_progress (status=${this.status})`);
			return;
		}
		try {
			if (shouldMute) this._session.mute({ audio: true });
			else this._session.unmute({ audio: true });
		} catch (err) {
			console.warn(`[Call.mute] threw: ${err?.message || err}`);
		}
	}

	/** Unmute the local microphone. Convenience for `mute(false)`. */
	unmute() {
		this.mute(false);
	}

	/**
	 * @returns {boolean} whether the local microphone is currently muted.
	 */
	isMuted() {
		try {
			return Boolean(this._session.isMuted?.()?.audio);
		} catch {
			return false;
		}
	}

	/**
	 * Put the call on hold, or resume it. Sends a re-INVITE with the audio
	 * direction set to sendonly (hold) / sendrecv (resume); the media server
	 * (rtpengine) handles it. Pass `false` to resume.
	 * @param {boolean} [shouldHold=true]
	 * @returns {boolean} whether the (un)hold was initiated.
	 */
	hold(shouldHold = true) {
		if (this.status !== "in_progress") {
			console.warn(`[Call.hold] no-op: call is not in_progress (status=${this.status})`);
			return false;
		}
		try {
			return shouldHold ? this._session.hold() : this._session.unhold();
		} catch (err) {
			console.warn(`[Call.hold] threw: ${err?.message || err}`);
			return false;
		}
	}

	/** Resume a held call. Convenience for `hold(false)`. */
	unhold() {
		return this.hold(false);
	}

	/**
	 * @returns {boolean} whether this leg is locally on hold.
	 */
	isOnHold() {
		try {
			return Boolean(this._session.isOnHold?.()?.local);
		} catch {
			return false;
		}
	}

	/**
	 * Blind-transfer (cold transfer) the call to another destination via SIP
	 * REFER. The far end is re-routed to `target` and this leg ends once the
	 * transfer is accepted. `target` may be a phone number (E.164 or bare
	 * digits) or a full SIP URI — bare numbers are normalized against the
	 * registered SIP domain by the underlying stack.
	 *
	 * NOTE: completing the transfer requires the SIP server to honor the REFER
	 * (route the new leg / bridge the parties). The client only initiates it.
	 * @param {string} target - Destination number or SIP URI.
	 */
	transfer(target) {
		if (this.status !== "in_progress") {
			console.warn(`[Call.transfer] no-op: call is not in_progress (status=${this.status})`);
			return;
		}
		if (!target) {
			console.warn("[Call.transfer] no-op: a transfer target is required");
			return;
		}
		try {
			this._session.refer(target);
		} catch (err) {
			console.warn(`[Call.transfer] refer threw: ${err?.message || err}`);
		}
	}

	/**
	 * Attach an event listener. Events:
	 *   "accepted"  — 200 OK received (outbound) or sent (inbound after accept)
	 *   "confirmed" — ACK exchanged, media flowing
	 *   "ended"     — normal hangup; payload: {cause}
	 *   "failed"    — error before/during; payload: {cause, status_code, reason}
	 *   "track"     — remote MediaStreamTrack added; payload: {track, streams}
	 * @param {string} event
	 * @param {Function} handler
	 */
	on(event, handler) {
		if (!this._listeners.has(event)) this._listeners.set(event, new Set());
		this._listeners.get(event).add(handler);
	}

	/**
	 * Remove a previously-registered listener.
	 */
	off(event, handler) {
		this._listeners.get(event)?.delete(handler);
	}

	// ─── Internal: wire JsSIP RTCSession events to Call events ───────────────

	_emit(event, payload) {
		for (const fn of this._listeners.get(event) || []) {
			try { fn(payload); }
			catch (err) { console.error(`[Call.${event} handler]`, err); }
		}
	}

	_wireSessionEvents() {
		const s = this._session;

		// Attach the RTCPeerConnection "track" listener as soon as the PC
		// exists. The browser can fire `track` when the remote SDP is applied,
		// which happens BEFORE JsSIP emits "confirmed" — waiting until then
		// can drop the event entirely (call connects, no audio).
		//
		// For outbound calls JsSIP creates the PC inside `ua.call()`, so
		// session.connection may already exist by the time our Call is
		// constructed — handle that synchronously. For inbound calls the PC
		// is created inside session.answer(); JsSIP emits "peerconnection"
		// when it's ready — attach there.
		if (s.connection) this._attachTrackListener(s.connection);
		s.on("peerconnection", (e) => {
			const pc = e?.peerconnection || s.connection;
			if (pc) this._attachTrackListener(pc);
		});

		s.on("progress", (e) => {
			this.status = "ringing";
			this._emit("progress", { response: e.response });
		});

		s.on("accepted", () => {
			this.status = "in_progress";
			this._emit("accepted");
		});

		s.on("confirmed", () => {
			this.status = "in_progress";
			// Defensive: in case "peerconnection" never fired but a PC exists by now.
			if (this._session.connection) this._attachTrackListener(this._session.connection);
			this._emit("confirmed");
		});

		s.on("ended", (e) => {
			this.status = "ended";
			this._cleanupRemoteAudio();
			this._emit("ended", { cause: e?.cause });
		});

		s.on("failed", (e) => {
			this.status = "failed";
			this._cleanupRemoteAudio();
			this._emit("failed", {
				cause: e?.cause,
				statusCode: e?.message?.status_code,
				reason: e?.message?.reason_phrase,
			});
		});
	}

	/**
	 * Idempotent — wires the RTCPeerConnection "track" handler. Uses
	 * addEventListener (not pc.ontrack) so host apps can attach their own
	 * track listener without clobbering ours, and vice versa.
	 *
	 * When a remote track arrives:
	 *   - Emit "track" so the host app can route audio anywhere it wants.
	 *   - If `call.disableDefaultAudioOutput` is falsy, attach the stream to
	 *     a hidden <audio> element so the user just hears the call. Host
	 *     apps that want custom audio routing should set
	 *     `call.disableDefaultAudioOutput = true` before accepting/connecting.
	 */
	_attachTrackListener(pc) {
		if (this._trackListenerAttached) return;
		this._trackListenerAttached = true;

		pc.addEventListener("track", (evt) => {
			this._emit("track", { track: evt.track, streams: evt.streams });
			if (this.disableDefaultAudioOutput) return;
			if (!this._remoteAudio) {
				this._remoteAudio = document.createElement("audio");
				this._remoteAudio.autoplay = true;
				this._remoteAudio.setAttribute("data-signalhouse-call", this.id || "");
				document.body.appendChild(this._remoteAudio);
			}
			this._remoteAudio.srcObject = evt.streams[0];
		});
	}

	_cleanupRemoteAudio() {
		if (this._remoteAudio) {
			try {
				this._remoteAudio.srcObject = null;
				this._remoteAudio.remove();
			} catch {}
			this._remoteAudio = null;
		}
	}
}
