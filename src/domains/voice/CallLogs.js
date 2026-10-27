/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} ListCallLogsFilters
 * @property {number} [page] - 1-indexed page (default 1).
 * @property {number} [limit] - Page size (default 20, max 1000).
 * @property {"INBOUND"|"OUTBOUND"|"INTERNAL"} [direction] - Filter by direction.
 * @property {"QUEUED"|"RINGING"|"IN_PROGRESS"|"COMPLETED"|"FAILED"|"BUSY"|"NO_ANSWER"|"CANCELED"} [status] - Filter by status.
 * @property {"SIP_TRUNK"|"PROGRAMMABLE_VOICE"|"AI_VOICE"|"WEBRTC"|"VOICEMAIL"|"CONFERENCE"|"PSTN"} [callSource] - Filter by how the call was handled.
 * @property {string} [subgroupId] - Filter by owning subgroup.
 * @property {string} [sipTrunkId] - Filter by SIP trunk id.
 * @property {string} [programmableVoiceProfileId] - Filter by Programmable Voice Profile id.
 * @property {string} [from] - Filter by caller number (contains).
 * @property {string} [to] - Filter by called number (contains).
 * @property {string} [q] - Free-text search over callId / from / to.
 * @property {"positive"|"negative"|"neutral"} [sentiment] - Filter by sentiment.
 * @property {boolean} [voicemail] - When true, return only voicemails (metadata.voicemail=true).
 * @property {boolean} [hasRecording] - When true, only calls that have a recording (callRecordingUrl set).
 * @property {boolean} [excludeVoicemail] - When true, exclude voicemails (used by the Call Recordings view).
 * @property {string} [dateFrom] - ISO-8601 lower bound on start time.
 * @property {string} [dateTo] - ISO-8601 upper bound on start time.
 * @property {string} [sort] - Sort field (default startTime).
 * @property {"asc"|"desc"} [order] - Sort order (default desc).
 */

/**
 * Call Logs — the account-scoped voice call history (Voice service
 * `/voice/api/v1/call-logs`). Distinct from `voice.calls`, which is the
 * Twilio-compatible programmatic call-control surface; this is the richer log
 * read surface with cost, recording, and voice-config attribution used by the
 * portal Call Logs view. Accessed via `sdk.voice.callLogs`.
 */
export class CallLogs {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List call logs for the current account, paginated and filterable.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {ListCallLogsFilters} [params.filters] - Optional filters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: [...call logs], meta: { total, page, limit, totalPages } }`.
	 */
	async list({ filters = {}, options = {} } = {}) {
		const query = new URLSearchParams();
		for (const [k, v] of Object.entries(filters)) {
			if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
		}
		const qs = query.toString();
		const path = qs ? `/voice/api/v1/call-logs?${qs}` : `/voice/api/v1/call-logs`;
		return this.client(path, { method: "GET", ...options });
	}

	/**
	 * Get a single call log by its UUID or callId.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call log UUID or callId.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { ...call log } }`.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-logs/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Get a short-TTL presigned playback URL for a call's recording. Account-scoped
	 * — only the owning account can presign. 404 if the call has no recording.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call log UUID or callId.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { callId, url, expiresIn } }`.
	 */
	async getRecording({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-logs/${safeId}/recording`, { method: "GET", ...options });
	}

	/**
	 * Mark a voicemail (a call log with a recording) read or unread. Account-scoped.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call log UUID or callId.
	 * @param {boolean} [params.read=true] - true = read, false = unread.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { id, voicemailReadAt } }`.
	 */
	async markVoicemailRead({ id, read = true, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-logs/${safeId}/voicemail-read`, { method: "PATCH", body: { read }, ...options });
	}
}
