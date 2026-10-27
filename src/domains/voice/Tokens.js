/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} VoiceGrants
 * @property {Object} [voice] - Voice grants object.
 * @property {Object} [voice.incoming] - Inbound call grants.
 * @property {boolean} [voice.incoming.allow] - Allow inbound calls to this identity.
 * @property {Object} [voice.outgoing] - Outbound call grants.
 * @property {string[]} [voice.outgoing.allowedNumbers] - E.164 numbers this identity may present as caller ID.
 */

/**
 * @typedef {Object} CreateTokenData
 * @property {string} [identity] - Customer-facing logical identity name (e.g. "alice"). Persisted as `requested_identity` so server-initiated `calls.create({to_identity: "alice"})` can resolve it later. Defaults to "anonymous".
 * @property {number} [ttl] - Token TTL in seconds. Clamped to the server's max. Defaults to VOICE_TOKEN_DEFAULT_TTL_SEC.
 * @property {VoiceGrants} [grants] - Capability grants attached to the token.
 */

/**
 * @typedef {Object} SipCredentials
 * @property {string} username - Server-generated SIP username (e.g. "wrtc_<hex>"). Use for the SIP-over-WSS registration.
 * @property {string} password - Plaintext SIP password — sent ONCE, never recoverable. Use for digest auth on REGISTER + INVITE.
 * @property {string} domain - SIP domain to register against (the part after `@` in the URI).
 * @property {string} wss_url - WebSocket Secure URL the SDK opens to send SIP traffic.
 */

/**
 * @typedef {Object} CreateTokenResponse
 * @property {string} token - JWT to pass to the SignalHouse browser voice SDK.
 * @property {string} identity - The server-generated SIP username (wrtc_<hex>). Distinct from the logical `requested_identity` passed in.
 * @property {string} expires_at - ISO-8601 expiry timestamp.
 * @property {SipCredentials} sip_credentials - Ephemeral SIP creds embedded in the token; surfaced separately for direct SIP clients.
 */

/**
 * WebRTC voice tokens. Mints ephemeral SIP identities the browser/mobile voice
 * SDK uses to register against the SignalHouse voice fabric. Wraps voice-
 * backend's `/voice/tokens` endpoint. Accessed via `sdk.voice.tokens`.
 *
 * Customer flow:
 * 1. Backend calls `sdk.voice.tokens.create({ identity: "alice", ttl: 1800 })`
 *    and returns the resulting `token` to the customer's browser/app.
 * 2. Browser SDK registers using the embedded `sip_credentials`.
 * 3. Outbound calls from the SDK go through OpenSIPS → Asterisk → carrier;
 *    the server-side `calls.create({ to_identity: "alice", ... })` flow can
 *    also ring this identity for click-to-call patterns.
 */
export class Tokens {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Mint an ephemeral voice token + SIP credentials.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {CreateTokenData} [params.tokenData] - Token mint options (identity, ttl, grants). All fields optional.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<CreateTokenResponse>>} The token + embedded SIP credentials.
	 */
	async create({ tokenData = {}, options = {} } = {}) {
		return this.client(`/voice/tokens`, { method: "POST", body: tokenData, ...options });
	}

	/**
	 * Refresh (extend) an existing voice token in place — identity-preserving.
	 * Wraps the Voice service's `/voice/tokens/refresh`. Keeps the same wrtc_
	 * identity + SIP credentials and only pushes out `expires_at`, so a
	 * long-lived softphone stays registered without re-establishing its SIP
	 * registration (unlike `create()`, which mints a NEW identity). Provide the
	 * current `token` (its identity is decoded server-side) or the `identity`
	 * directly. Rejects with a 404 when the token no longer exists for the
	 * account — mint a fresh one with `create()` in that case.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {string} [params.token] - The current voice token (JWT) whose identity to extend.
	 * @param {string} [params.identity] - The wrtc_ identity to extend, if held directly (from a prior mint/refresh response).
	 * @param {number} [params.ttl] - New TTL in seconds. Defaults to the server default, capped at the server maximum.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<CreateTokenResponse>>} The refreshed token + embedded SIP credentials (same shape as create()).
	 */
	async refresh({ token, identity, ttl, options = {} } = {}) {
		const body = {};
		if (token) body.token = token;
		if (identity) body.identity = identity;
		if (ttl != null) body.ttl = ttl;
		return this.client(`/voice/tokens/refresh`, { method: "POST", body, ...options });
	}
}
