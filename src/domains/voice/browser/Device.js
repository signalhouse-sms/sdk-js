import JsSIP from "jssip";
import { Call } from "./Call.js";

/**
 * @typedef {Object} SipCredentials
 * @property {string} username - SIP username (e.g. "wrtc_<hex>"); from /voice/tokens response.
 * @property {string} password - Plaintext SIP password.
 * @property {string} domain - SIP domain (e.g. "webrtc.signalhouse.io").
 * @property {string} wss_url - WebSocket Secure URL to OpenSIPS.
 */

/**
 * @typedef {Object} VoiceTokenResponse
 * @property {string} token - JWT (informational). Tokens are ephemeral: refresh
 *   before `expires_at` (see updateToken()) so the softphone keeps a valid
 *   registration.
 * @property {string} identity - The wrtc_<hex> SIP username. The refresh
 *   endpoint (POST /voice/tokens/refresh) keeps this identity stable; a fresh
 *   mint (POST /voice/tokens) returns a new one.
 * @property {string} expires_at - ISO timestamp. The Device schedules a
 *   `tokenWillExpire` event at this minus `tokenRefreshMs`.
 * @property {SipCredentials} sip_credentials
 */

/**
 * @typedef {Object} ConnectParams
 * @property {string} to - Destination — E.164 ("+15551234") or full SIP URI.
 * @property {string} [from] - Caller ID to present (must be an account-owned DID).
 *   Sent as a P-Preferred-Identity header per RFC 3325; OpenSIPS validates
 *   ownership and uses it as the carrier-bound From. If omitted, OpenSIPS
 *   falls back to the account's default outbound DID.
 * @property {MediaStream} [mediaStream] - Pre-acquired stream from getUserMedia.
 *   When absent the SDK calls getUserMedia({audio: true}) itself.
 * @property {RTCConfiguration} [pcConfig] - WebRTC peer-connection config.
 * @property {string[]} [extraHeaders] - Additional SIP headers to attach to
 *   the outbound INVITE (advanced).
 */

/**
 * Browser-side SignalHouse voice client. Wraps JsSIP behind a Twilio-shape
 * Device + Call API.
 *
 *   const device = new Device(tokenResponse);
 *   await device.register();
 *   const call = await device.connect({ to: "+15551234", from: "+15559999" });
 *   device.on("incoming", call => call.accept());
 *
 * Token refresh (REQUIRED for long-lived sessions): voice tokens are short-
 * lived — a token's SIP credential authenticates only until `expires_at`. If
 * you let it lapse, the softphone can no longer re-register and inbound calls
 * stop arriving (they go to voicemail). The Device raises a `tokenWillExpire`
 * event shortly before expiry so you can keep it alive. Mirrors Twilio's
 * Device.updateToken() model:
 *
 *   // Manual — fetch a fresh token from your backend and hand it back:
 *   device.on("tokenWillExpire", async () => {
 *     const fresh = await fetch("/my/backend/voice-token").then((r) => r.json());
 *     await device.updateToken(fresh);
 *   });
 *
 *   // Automatic — let the Device refresh itself:
 *   const device = new Device(tokenResponse, {
 *     tokenProvider: () => fetch("/my/backend/voice-token").then((r) => r.json()),
 *   });
 *
 * Preferred: have your backend call POST /voice/tokens/refresh, which extends
 * the SAME identity in place — the Device then just reschedules and keeps its
 * existing registration (no re-register, seamless). If instead you mint a fresh
 * token (new identity), the Device re-registers under it (break-before-make,
 * deferred while a call is active).
 *
 * Events: "registered", "unregistered", "registrationFailed", "incoming",
 * "connected" (WSS established), "disconnected", "tokenWillExpire",
 * "tokenRefreshFailed", "error".
 */
/**
 * Narrow a token-or-credentials argument: a VoiceTokenResponse wraps its SIP credentials under `sip_credentials`.
 * @param {VoiceTokenResponse | SipCredentials} value - The argument to inspect.
 * @returns {value is VoiceTokenResponse} - True when the value is a token response.
 */
function isTokenResponse(value) {
	return !!value && typeof value === "object" && "sip_credentials" in value;
}

export class Device {
	/**
	 * @param {VoiceTokenResponse | SipCredentials} tokenOrCreds
	 * @param {Object} [opts]
	 * @param {number} [opts.registerExpires=600] - REGISTER expires interval, in seconds.
	 * @param {string} [opts.userAgent="SignalHouse-Voice-SDK/0.1"]
	 * @param {boolean} [opts.autoRegister=false] - Call register() on construct.
	 * @param {number} [opts.tokenRefreshMs=30000] - How long before `expires_at`
	 *   to raise `tokenWillExpire` (and auto-refresh, when `tokenProvider` is set).
	 * @param {() => (VoiceTokenResponse|Promise<VoiceTokenResponse>)} [opts.tokenProvider]
	 *   Optional. A function YOU supply that returns a fresh token — ideally by
	 *   calling POST /voice/tokens/refresh through your backend (identity-
	 *   preserving), or a fresh mint. When set, the Device calls it on
	 *   `tokenWillExpire` and applies the result via updateToken() automatically.
	 */
	constructor(tokenOrCreds, opts = {}) {
		this._credentials = this._parseCreds(tokenOrCreds, "Device");
		const token = isTokenResponse(tokenOrCreds) ? tokenOrCreds : null;
		this.identity = token?.identity || this._credentials.username;
		this.expiresAt = token?.expires_at || null;

		this._opts = {
			registerExpires: opts.registerExpires ?? 600,
			userAgent: opts.userAgent ?? "SignalHouse-Voice-SDK/0.1",
			tokenRefreshMs: opts.tokenRefreshMs ?? 30000,
			tokenProvider: typeof opts.tokenProvider === "function" ? opts.tokenProvider : null,
		};

		this._ua = null;
		this._listeners = new Map();
		this._registered = false;
		this._stopped = false;             // set by unregister(); guards in-flight refreshes

		// Token-refresh state.
		this._refreshTimer = null;         // fires `tokenWillExpire` before expiry
		this._activeSessions = new Set();  // in-flight calls; defer an identity swap while busy
		this._pendingToken = null;         // identity-change token handed to updateToken() while busy
		this._refreshPendingAuto = false;  // tokenProvider refresh deferred while busy

		if (opts.autoRegister) this.register().catch(() => { /* surfaced via "registrationFailed" event */ });
	}

	// ─── Public API ─────────────────────────────────────────────────────────

	/**
	 * Open the WSS connection and REGISTER. Resolves on first "registered"
	 * event, rejects on first "registrationFailed". On success, schedules the
	 * `tokenWillExpire` refresh timer from the current token's `expires_at`.
	 * @returns {Promise<void>}
	 */
	register() {
		this._stopped = false; // an intentional (re)start re-arms the device
		if (this._registered) return Promise.resolve();
		if (!this._ua) this._initUA();

		return new Promise((resolve, reject) => {
			const onOk = () => {
				this._ua.removeListener("registered", onOk);
				this._ua.removeListener("registrationFailed", onFail);
				this._scheduleTokenRefresh();
				resolve();
			};
			const onFail = (e) => {
				this._ua.removeListener("registered", onOk);
				this._ua.removeListener("registrationFailed", onFail);
				reject(new Error(`registrationFailed: ${e?.cause || "unknown"}`));
			};
			this._ua.on("registered", onOk);
			this._ua.on("registrationFailed", onFail);
			this._ua.start();
		});
	}

	/**
	 * Unregister and close the WSS connection. Idempotent. Marks the device
	 * stopped so any in-flight token refresh cannot bring it back online, and
	 * cancels the refresh timer + pending state.
	 * @returns {Promise<void>}
	 */
	unregister() {
		this._stopped = true;
		this._clearTokenRefresh();
		this._pendingToken = null;
		this._refreshPendingAuto = false;
		return this._teardownUA();
	}

	/**
	 * Apply a fresh token so the registration never lapses — call this in
	 * response to `tokenWillExpire` (or let `tokenProvider` do it).
	 *
	 * Identity-preserving fast path: if the token carries the SAME identity +
	 * password as the current one (i.e. your backend called POST
	 * /voice/tokens/refresh to extend in place), the existing registration is
	 * still valid, so the Device just updates `expires_at` and reschedules — no
	 * re-register, fully seamless, safe even mid-call.
	 *
	 * Identity change (a fresh mint): the Device re-registers under the new
	 * identity (break-before-make), deferred while a call is active and applied
	 * once the last call ends, so live audio is never disrupted.
	 *
	 * @param {VoiceTokenResponse | SipCredentials} tokenOrCreds
	 * @returns {Promise<void>} resolves once applied (or immediately when a swap
	 *   is deferred behind an active call).
	 */
	async updateToken(tokenOrCreds) {
		const creds = this._parseCreds(tokenOrCreds, "Device.updateToken");
		const token = isTokenResponse(tokenOrCreds) ? tokenOrCreds : null;
		const newIdentity = token?.identity || creds.username;

		// Identity-preserving fast path — same credential, just extended expiry.
		if (this._ua && this._registered && !this._stopped &&
			newIdentity === this.identity && creds.password === this._credentials.password) {
			this.expiresAt = token?.expires_at || this.expiresAt;
			this._scheduleTokenRefresh();
			return;
		}

		// Identity changed → full re-register; defer while a call is active.
		if (this._activeSessions.size > 0) {
			this._pendingToken = tokenOrCreds;
			return;
		}
		await this._applyToken(tokenOrCreds);
	}

	/**
	 * Place an outbound call. Returns a Call once the INVITE is sent.
	 * The returned Call fires "progress" → "accepted" → "confirmed" as
	 * the dialog establishes; listen for those before assuming audio is live.
	 *
	 * @param {ConnectParams} params
	 * @returns {Promise<Call>}
	 */
	async connect({ to, from, mediaStream, pcConfig, extraHeaders = [] } = /** @type {ConnectParams} */ ({})) {
		if (!this._ua || !this._registered) {
			throw new Error("Device.connect: not registered yet — call register() first");
		}
		if (!to) throw new Error("Device.connect: 'to' is required");

		const target = /^sip:/i.test(to)
			? to
			: `sip:${String(to).replace(/^\+?/, "")}@${this._credentials.domain}`;

		// P-Preferred-Identity (RFC 3325) — OpenSIPS validates this is an
		// account-owned DID, then uses it as the carrier From header. If
		// not supplied, OpenSIPS falls back to the account's default DID.
		const headers = [...extraHeaders];
		if (from) {
			headers.push(`P-Preferred-Identity: <sip:${from}@${this._credentials.domain}>`);
		}

		const stream = mediaStream || (await navigator.mediaDevices.getUserMedia({ audio: true, video: false }));

		// Default to no STUN servers — SignalHouse's rtpengine is configured
		// with `trust-address` (uses the actual source IP from incoming RTP
		// packets rather than the SDP), so host candidates are enough and
		// ICE gathering completes in milliseconds instead of waiting on
		// public STUN. Customers behind restrictive NATs can override via
		// `pcConfig: { iceServers: [{urls: "stun:..."}] }`.
		const session = this._ua.call(target, {
			mediaConstraints: { audio: true, video: false },
			mediaStream: stream,
			pcConfig: pcConfig || { iceServers: [] },
			rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
			extraHeaders: headers,
		});

		this._trackSession(session);
		return new Call({ session, direction: "outbound" });
	}

	/**
	 * Attach event listener. See class JSDoc for event list.
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

	/** True iff currently REGISTERED. */
	get isRegistered() { return this._registered; }

	// ─── Internal ───────────────────────────────────────────────────────────

	_emit(event, payload) {
		for (const fn of this._listeners.get(event) || []) {
			try { fn(payload); }
			catch (err) { console.error(`[Device.${event} handler]`, err); }
		}
	}

	/**
	 * Unwrap `sip_credentials` from a token response (or accept a bare creds
	 * object) and validate the four required SIP fields.
	 * @param {VoiceTokenResponse | SipCredentials} tokenOrCreds
	 * @param {string} ctx - Caller label used in the error message.
	 * @returns {SipCredentials}
	 * @throws {Error} when a required field is missing.
	 */
	_parseCreds(tokenOrCreds, ctx) {
		const creds = /** @type {SipCredentials} */ (isTokenResponse(tokenOrCreds) ? tokenOrCreds.sip_credentials : tokenOrCreds);
		if (!creds?.username || !creds?.password || !creds?.domain || !creds?.wss_url) {
			throw new Error(`${ctx}: token/credentials missing required fields (username, password, domain, wss_url)`);
		}
		return creds;
	}

	/**
	 * Stop the current UA and close its WSS, without touching lifecycle flags —
	 * used both by unregister() and by _applyToken()'s break-before-make swap.
	 * @returns {Promise<void>}
	 */
	_teardownUA() {
		if (!this._ua) return Promise.resolve();
		return new Promise((resolve) => {
			const ua = this._ua;
			const done = () => { try { ua.stop(); } catch {} resolve(); };
			if (!this._registered) return done();
			ua.once("unregistered", done);
			try { ua.unregister(); }
			catch { done(); }
		});
	}

	/**
	 * Re-register under fresh credentials when the identity changed
	 * (break-before-make). Only invoked when no call is active (updateToken
	 * defers while busy). Bails if the app tore the device down mid-swap; if the
	 * new registration fails, surfaces `tokenRefreshFailed` and re-arms a short
	 * retry so the device recovers rather than sitting unregistered.
	 * @param {VoiceTokenResponse | SipCredentials} tokenOrCreds
	 */
	async _applyToken(tokenOrCreds) {
		const creds = this._parseCreds(tokenOrCreds, "Device.updateToken");
		this._clearTokenRefresh();
		try { await this._teardownUA(); } catch { /* ignore — tearing down anyway */ }
		if (this._stopped) return; // unregister() ran while we were tearing down

		this._ua = null;
		this._registered = false;
		this._credentials = creds;
		const token = isTokenResponse(tokenOrCreds) ? tokenOrCreds : null;
		this.identity = token?.identity || creds.username;
		this.expiresAt = token?.expires_at || null;

		try {
			await this.register(); // rebuilds the UA + reschedules the refresh timer
		} catch (err) {
			this._emit("tokenRefreshFailed", { error: err });
			if (!this._stopped) {
				this._clearTokenRefresh();
				this._refreshTimer = setTimeout(() => this._onTokenWillExpire(), 5000);
			}
			throw err; // propagate to a manual updateToken() caller
		}
	}

	/** `expires_at` as epoch ms, or null when unparseable/absent. */
	_expiresAtMs() {
		const t = Date.parse(this.expiresAt || "");
		return Number.isFinite(t) ? t : null;
	}

	/**
	 * True if the given token has too little life left to safely apply (would
	 * expire within tokenRefreshMs). Tokens with no parseable expiry are treated
	 * as usable.
	 * @param {VoiceTokenResponse | SipCredentials} tokenOrCreds
	 * @returns {boolean}
	 */
	_isTokenStale(tokenOrCreds) {
		const exp = Date.parse((isTokenResponse(tokenOrCreds) && tokenOrCreds.expires_at) || "");
		if (!Number.isFinite(exp)) return false;
		return exp - Date.now() <= this._opts.tokenRefreshMs;
	}

	/** Arm the one-shot `tokenWillExpire` timer for tokenRefreshMs before expiry. */
	_scheduleTokenRefresh() {
		this._clearTokenRefresh();
		const expMs = this._expiresAtMs();
		if (expMs === null) return; // no expiry info → caller manages refresh manually
		const delay = Math.max(0, expMs - Date.now() - this._opts.tokenRefreshMs);
		this._refreshTimer = setTimeout(() => this._onTokenWillExpire(), delay);
	}

	/** Cancel the pending `tokenWillExpire` timer, if any. */
	_clearTokenRefresh() {
		if (this._refreshTimer) { clearTimeout(this._refreshTimer); this._refreshTimer = null; }
	}

	/**
	 * Fired shortly before the current token expires. Emits `tokenWillExpire`
	 * for manual handlers; if a `tokenProvider` is configured, also fetches a
	 * fresh token and applies it. Deferred while a call is active (the fetch
	 * happens only once idle, so a fetched token can't go stale in hand). Bails
	 * if the device was torn down while the fetch was in flight.
	 */
	async _onTokenWillExpire() {
		if (this._stopped) return;
		this._emit("tokenWillExpire", { identity: this.identity, expiresAt: this.expiresAt });
		if (!this._opts.tokenProvider) return; // app handles it via updateToken()
		if (this._activeSessions.size > 0) {
			this._refreshPendingAuto = true; // fetch + apply once the call ends
			return;
		}
		try {
			const fresh = await this._opts.tokenProvider();
			if (this._stopped) return; // torn down while the provider fetch was pending
			if (!fresh) throw new Error("tokenProvider returned no token");
			await this.updateToken(fresh);
		} catch (err) {
			if (this._stopped) return;
			this._emit("tokenRefreshFailed", { error: err });
			// Retry shortly so a transient failure doesn't strand us, provided
			// there's still time before the current token expires.
			const expMs = this._expiresAtMs();
			if (expMs !== null && expMs - Date.now() > 5000) {
				this._clearTokenRefresh();
				this._refreshTimer = setTimeout(() => this._onTokenWillExpire(), 5000);
			}
		}
	}

	/** Track a call session so an identity swap can be deferred until it ends. */
	_trackSession(session) {
		if (!session) return;
		this._activeSessions.add(session);
		const done = () => this._untrackSession(session);
		try { session.on("ended", done); session.on("failed", done); }
		catch { /* not a JsSIP session — best-effort tracking only */ }
	}

	/**
	 * Stop tracking a finished session. When the line goes fully idle, apply any
	 * token refresh that was deferred behind the call: a `tokenProvider` fetch
	 * (fresh) or a stored identity-change token — re-fetching instead if that
	 * stored token has gone stale while the call ran.
	 * @param {object} session - The JsSIP session that ended/failed.
	 */
	_untrackSession(session) {
		this._activeSessions.delete(session);
		if (this._activeSessions.size > 0 || this._stopped) return;

		if (this._refreshPendingAuto) {
			this._refreshPendingAuto = false;
			this._onTokenWillExpire();
		} else if (this._pendingToken) {
			const pending = this._pendingToken;
			this._pendingToken = null;
			// A long call can outlive the token we stashed — don't register with
			// stale creds; get a fresh one the same way the timer would.
			if (this._isTokenStale(pending)) {
				this._onTokenWillExpire();
			} else {
				this._applyToken(pending).catch((err) => this._emit("tokenRefreshFailed", { error: err }));
			}
		}
	}

	_initUA() {
		const socket = new JsSIP.WebSocketInterface(this._credentials.wss_url);
		this._ua = new JsSIP.UA({
			sockets: [socket],
			uri: `sip:${this._credentials.username}@${this._credentials.domain}`,
			password: this._credentials.password,
			register: true,
			register_expires: this._opts.registerExpires,
			user_agent: this._opts.userAgent,
		});

		this._ua.on("connecting", () => this._emit("connecting"));
		this._ua.on("connected",  () => this._emit("connected"));
		this._ua.on("disconnected", (e) => this._emit("disconnected", { reason: e?.reason }));
		this._ua.on("registered", () => { this._registered = true;  this._emit("registered"); });
		this._ua.on("unregistered", () => { this._registered = false; this._emit("unregistered"); });
		this._ua.on("registrationFailed", (e) => {
			this._registered = false;
			this._emit("registrationFailed", {
				cause: e?.cause,
				statusCode: e?.response?.status_code,
				reason: e?.response?.reason_phrase,
			});
		});

		this._ua.on("newRTCSession", (e) => {
			if (e.originator !== "remote") return; // outbound: we already wrap in connect()
			this._trackSession(e.session);
			const call = new Call({ session: e.session, direction: "inbound", request: e.request });
			this._emit("incoming", call);
		});
	}
}
