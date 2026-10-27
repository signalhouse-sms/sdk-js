/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateCallData
 * @property {string} to - Destination phone number in E.164 format (e.g. "+15551234567") or SIP URI.
 * @property {string} from - Caller ID to present on the outbound leg. Must be an account-owned phone number when not using a SIP trunk.
 * @property {string} [sip_trunk_id] - Route via a configured SIP trunk. Mutually exclusive with `sip_profile_id` and `to_identity` for the trunk path.
 * @property {string} [sip_profile_id] - Two-leg-with-bridge: ring this persistent SIP profile first, then dial `to` and bridge. Mutually exclusive with `to_identity`.
 * @property {string} [to_identity] - Two-leg-with-bridge: ring the SDK-registered identity by logical name (the value passed to `tokens.create({identity})`), then dial `to` and bridge. Mutually exclusive with `sip_profile_id`.
 * @property {string} [answer_url] - Webhook URL fetched on call answer; returns call-control instructions.
 * @property {"GET"|"POST"} [answer_method] - HTTP method for `answer_url`. Defaults to POST.
 * @property {string} [status_callback] - Webhook URL for call status updates (QUEUED, RINGING, ANSWERED, COMPLETED, FAILED).
 * @property {"GET"|"POST"} [status_callback_method] - HTTP method for `status_callback`. Defaults to POST.
 * @property {boolean} [recording_enabled] - Record both legs of the call. Defaults to false.
 * @property {boolean} [transcription_enabled] - Transcribe the recording. Defaults to false.
 * @property {string} [ivr_flow_id] - Route the call into an AI IVR flow on answer instead of webhook control.
 * @property {Object} [metadata] - Free-form metadata persisted on the call log.
 */

/**
 * @typedef {Object} ListCallsFilters
 * @property {number} [page] - Page number (1-indexed). Defaults to 1.
 * @property {number} [limit] - Page size (1-100). Defaults to 20.
 * @property {"QUEUED"|"RINGING"|"IN_PROGRESS"|"COMPLETED"|"FAILED"|"BUSY"|"NO_ANSWER"|"CANCELED"} [status] - Filter by call status.
 * @property {"INBOUND"|"OUTBOUND"} [direction] - Filter by call direction.
 * @property {string} [from] - Filter by caller number.
 * @property {string} [to] - Filter by destination number.
 * @property {string} [date_from] - ISO-8601 lower bound on start_time.
 * @property {string} [date_to] - ISO-8601 upper bound on start_time.
 */

/**
 * Voice calls. REST API for placing outbound calls and inspecting call logs.
 * Wraps the Voice service's `/voice/v1/calls` surface. Accessed via `sdk.voice.calls`.
 *
 * Origination modes:
 * - **Single-leg** (no trunk/profile/identity): Twilio-style direct outbound — dial `to` from caller-ID `from`. Customer's `from` must be an account-owned number.
 * - **SIP trunk** (`sip_trunk_id`): Route via a configured trunk; the trunk's auth/ACL governs caller-ID rules.
 * - **Two-leg-with-bridge** (`sip_profile_id` OR `to_identity`): Ring the SDK-registered endpoint first, then dial `to` and bridge. `to_identity` resolves to the most recently-minted unexpired ephemeral identity for that name.
 */
export class Calls {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Create an outbound call.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {CreateCallData} params.callData - The call to place.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If callData is missing.
	 * @returns {Promise<SdkResponse<any>>} The created call: `{ call_id, status, direction, from, to, created_at }`.
	 */
	async create({ callData, options = {} }) {
		this.client._require({ callData });
		return this.client(`/voice/v1/calls`, { method: "POST", body: callData, ...options });
	}

	/**
	 * List call logs for the current account, paginated and filterable.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {ListCallsFilters} [params.filters] - Optional filters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ calls: [...], total, page, limit }`.
	 */
	async list({ filters = {}, options = {} } = {}) {
		const query = new URLSearchParams();
		for (const [k, v] of Object.entries(filters)) {
			if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
		}
		const qs = query.toString();
		const path = qs ? `/voice/v1/calls?${qs}` : `/voice/v1/calls`;
		return this.client(path, { method: "GET", ...options });
	}

	/**
	 * Get a single call log by ID.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call log UUID (the value returned as `call_id` from `create`).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} The call log.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/v1/calls/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Hang up an in-progress call.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call log UUID.
	 * @param {"NORMAL"|"BUSY"|"NO_ANSWER"|"REJECTED"} [params.reason] - Hangup reason recorded on the call log. Defaults to NORMAL.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success: boolean, message: string }`.
	 */
	async hangup({ id, reason, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		const body = reason ? { reason } : {};
		return this.client(`/voice/v1/calls/${safeId}/hangup`, { method: "POST", body, ...options });
	}
}
