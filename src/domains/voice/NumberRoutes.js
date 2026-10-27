/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} NumberRouteData
 * @property {"FORWARD"|"WEBRTC"|"SIP_TRUNK"|"SIP_PROFILE"|"CALL_CONTROL"|"AI"|"VOICEMAIL"} routeAction - How inbound calls to the number are handled.
 * @property {string|null} [forwardToE164] - FORWARD destination (required for FORWARD), or the WEBRTC no-answer destination when noAnswerAction is FORWARD.
 * @property {"VOICEMAIL"|"FORWARD"|"KEEP_RINGING"|null} [noAnswerAction] - WEBRTC only: what happens when nobody answers (default VOICEMAIL).
 * @property {number|null} [noAnswerSeconds] - WEBRTC only: seconds to ring before the no-answer action, 5-120 (default 20).
 * @property {string|null} [routeSipTrunkId] - SIP trunk to deliver to (required for SIP_TRUNK).
 * @property {string|null} [routeSipProfileId] - SIP endpoint to ring (required for SIP_PROFILE).
 * @property {string|null} [webhookUrl] - SHML program URL (required for CALL_CONTROL).
 * @property {string|null} [routeAgentProfileId] - AI agent profile id, AGP… (required for AI).
 * @property {boolean} [recordingEnabled] - Record calls handled by this route.
 */

/**
 * Number Routes — one inbound route set directly on a single phone number. A
 * number's own route takes priority over its Programmable Voice Profile and
 * subgroup voice settings. Calls the Voice service mounted under
 * /voice. Accessed via `sdk.voice.numberRoutes`.
 */
export class NumberRoutes {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get a number's own route and the routing currently in effect for it.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.e164 - The phone number in E.164 (leading + optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If e164 is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ e164, route: {...} | null, effective: {...} }`.
	 */
	async get({ e164, options = {} }) {
		this.client._require({ e164 });
		const safeE164 = encodeURIComponent(e164);
		return this.client(`/voice/api/v1/numbers/${safeE164}/route`, { method: "GET", ...options });
	}

	/**
	 * Set (create or replace) a number's route. The whole route is replaced:
	 * fields the new routeAction doesn't use are cleared.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.e164 - The phone number in E.164 (leading + optional).
	 * @param {NumberRouteData} params.routeData - The route to set.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If e164 or routeData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ e164, route: {...}, effective: {...} }`.
	 */
	async set({ e164, routeData, options = {} }) {
		this.client._require({ e164, routeData });
		const safeE164 = encodeURIComponent(e164);
		return this.client(`/voice/api/v1/numbers/${safeE164}/route`, { method: "PUT", body: routeData, ...options });
	}

	/**
	 * Remove a number's own route. The number falls back to its Programmable
	 * Voice Profile, subgroup voice settings, or the default.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.e164 - The phone number in E.164 (leading + optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If e164 is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ e164, route: null, effective: {...} }`.
	 */
	async delete({ e164, options = {} }) {
		this.client._require({ e164 });
		const safeE164 = encodeURIComponent(e164);
		return this.client(`/voice/api/v1/numbers/${safeE164}/route`, { method: "DELETE", ...options });
	}
}
