/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} VoiceAnalyticsFilters
 * @property {string} [dateFrom] - ISO-8601 lower bound on call start time.
 * @property {string} [dateTo] - ISO-8601 upper bound on call start time.
 * @property {"day"|"week"|"month"} [groupBy] - Bucket size for the byDate breakdown (default "day").
 * @property {"INBOUND"|"OUTBOUND"} [direction] - Restrict the breakdowns to one direction. Summary tiles always cover both.
 * @property {string} [callSource] - Comma-separated CallLog.callSource list (SIP_TRUNK, PROGRAMMABLE_VOICE, AI_VOICE, WEBRTC, VOICEMAIL, CONFERENCE, PSTN).
 * @property {string} [subgroupId] - Filter by owning subgroup.
 * @property {string} [number] - Substring match against either leg (from OR to).
 * @property {string} [carrier] - Filter by carrier.
 */

/**
 * @typedef {Object} VoiceDirectionSummary
 * @property {number} totalCalls
 * @property {number} successfulCalls
 * @property {number} successRate - Percentage (0–100).
 * @property {number} avgCallsPerDay
 * @property {number|null} avgCallDurationSeconds
 * @property {number} totalCallMinutes
 * @property {number} answerRate - Percentage (ASR / answer seizure rate).
 * @property {number} abandonmentRate - Percentage (CANCELED before answer).
 * @property {number} failedCalls
 * @property {number} failureRate - Percentage.
 * @property {number} pctUnder6s - Percentage of answered calls under 6 seconds.
 * @property {number|null} avgRingDurationSeconds - Average answer_time − start_time.
 * @property {number|null} sentimentScore - Positive-sentiment percentage.
 * @property {"Positive"|"Negative"|"Neutral"|null} sentimentLabel
 */

/**
 * @typedef {Object} VoiceBreakdownBucket
 * @property {string} key - The date / number / carrier this bucket aggregates.
 * @property {number} total
 * @property {number} completed
 * @property {number} failed
 * @property {number} noAnswer
 * @property {number} busy
 * @property {number} canceled
 * @property {number} inProgress
 * @property {number} totalDurationSeconds
 * @property {number|null} avgSentimentScore
 */

/**
 * Voice Analytics — aggregated call metrics for the portal Voice Analytics view
 * (Voice service `GET /voice/stats/voice-analytics`). Returns per-direction
 * summary tiles (both directions) plus byDate / byNumber / byCarrier status
 * breakdowns for charts. Distinct from `voice.callLogs`, which is the raw call
 * history. Accessed via `sdk.voice.analytics`.
 */
export class Analytics {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get aggregated voice analytics for the current account.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {VoiceAnalyticsFilters} [params.filters] - Optional filters. Summary tiles honor every filter except `direction`; breakdowns honor all filters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ success, range, outbound: VoiceDirectionSummary, inbound: VoiceDirectionSummary, byDate: VoiceBreakdownBucket[], byNumber: VoiceBreakdownBucket[], byCarrier: VoiceBreakdownBucket[], byChannel: VoiceBreakdownBucket[] }` (byChannel = per-callSource breakdown).
	 */
	async get({ filters = {}, options = {} } = {}) {
		const query = new URLSearchParams();
		for (const [k, v] of Object.entries(filters)) {
			if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
		}
		const qs = query.toString();
		const path = qs ? `/voice/stats/voice-analytics?${qs}` : `/voice/stats/voice-analytics`;
		return this.client(path, { method: "GET", ...options });
	}
}
