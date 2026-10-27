/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Serialise regionScopes for the query string: an array of branches becomes JSON, a string is passed through.
 * @param {Object} filters - Query filters that may carry regionScopes
 * @returns {Object} - The filters with regionScopes JSON-encoded when present
 */
function withRegionScopes(filters) {
	if (filters.regionScopes === undefined) return filters;
	const regionScopes = typeof filters.regionScopes === "string" ? filters.regionScopes : JSON.stringify(filters.regionScopes);
	return { ...filters, regionScopes };
}

export class Messages {
	constructor(client, multipartClient, enableAdmin) {
		this.client = client;
		this.multipartClient = multipartClient;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Estimate regional SMS/MMS retail cost; no charge or send. A Canadian sender requires a Ready Canadian sender and
	 * Canadian or US recipients, and is unavailable unless Canada is enabled for the environment. A +44 (UK) sender
	 * estimates SMS to GB mobiles only and returns region "GB"; while UK sending is disabled for the environment a UK
	 * sender is refused with a 400. The sender may also be a READY alphanumeric sender ID (e.g. "ACME"; UK recipients,
	 * SMS only); its estimate counts the "\nOpt out: sihou.io/o/{code}" footer the server appends to every such message.
	 * @async
	 * @param {Object} params - Sender, up to 100 recipients (10-15 digits each), messageBody and request options.
	 * @returns {Promise<SdkResponse<any>>} - Per-recipient rates and total in microdollars; unknown carriers use the upper fallback.
	 */
	async estimateMessage({ senderPhoneNumber, recipientPhoneNumbers, messageBody, messageType = "SMS", options = {} }) {
		return this.client("/message/estimate", { method: "POST", body: { senderPhoneNumber, recipientPhoneNumbers, messageBody, messageType }, ...options });
	}

	/**
	 * Get a list of messages with optional filters and pagination parameters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting messages
	 * @param {string} [params.id] - Filter messages by their unique ID
	 * @param {string} [params.campaignId] - Filter messages by the ID of the associated campaign
	 * @param {string} [params.brandId] - Filter messages by the ID of the associated brand
	 * @param {string} [params.subgroupId] - Filter messages by the ID of the associated subgroup
	 * @param {string} [params.groupId] - Filter messages by the ID of the associated group
	 * @param {string|string[]} [params.registrationId] - Filter to messages attributed to these registrations. Cannot be combined with campaignId; each id must belong to the group. Accepts a single value or an array.
	 * @param {string} [params.status] - Filter messages by their status (ENQUEUED, DEQUEUED, SENT, FAILED, DELIVERED)
	 * @param {string} [params.direction] - Filter messages by their direction (INBOUND, OUTBOUND)
	 * @param {string|string[]} [params.messageType] - Filter messages by their type. Accepts a single value or an array (e.g. ["SMS", "MMS"]). Allowed values: SMS, MMS, RCS, WHATSAPP, VIBER, P2P. When omitted, defaults to all non-P2P types.
	 * @param {string|string[]} [params.channel] - Filter messages by channel. Accepts a single value or an array. Allowed values: tenDLC, virtualLongCode, tollFree, shortCode, p2p. Each message records its channel when it is saved, and this filters on that stored value; older messages from before this feature have no channel and count as tenDLC. Ignored when matchAny is true (matchAny takes precedence).
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Accepted whether or not the environment serves hourly analytics.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Accepted whether or not the environment serves hourly analytics.
	 * @param {boolean} [params.matchAny] - When true, the provided campaignId/brandId/phoneNumber filters are OR'd (a message matches ANY of them) instead of the default most-specific-single behavior. subgroupId stays an AND scope. Opt-in/additive.
	 * @param {string} [params.carrier] - Filter messages by the carrier used for sending
	 * @param {string|string[]} [params.sentimentLabel] - Filter messages by sentiment bucket. Accepts a single value or an array (e.g. ["positive", "negative"]). Allowed values: positive, neutral, negative. Applied as the sentimentScore range the ±25 label threshold produces, so unscored messages match no bucket and outbound messages (never scored) are excluded.
	 * @param {string|string[]} [params.errorCode] - Filter FAILED messages by Signal House error code (single value or array). "OUT" is the campaign opt-out, displayed as RECIPIENT_OPTED_OUT. Carrier codes are not filterable here; they live inside successOrFailureReason.
	 * @param {string|string[]} [params.phoneNumber] - Filter messages by a business number on either side of the message. Accepts a single value or an array; OR'd with campaignId/brandId when matchAny is true
	 * @param {string} [params.senderPhoneNumber] - Filter messages by the sender's 5-6 digit Short Code or 10+ digit phone number. Use % as a wildcard for a partial match (e.g. "%1234" matches numbers ending in 1234); a plain value is an exact match. 3-15 digits required alongside any %.
	 * @param {string} [params.recipientPhoneNumber] - Filter messages by the recipient's phone number. Use % as a wildcard for a partial match (e.g. "%1234" matches numbers ending in 1234); a plain value is an exact match. 3-15 digits required alongside any %.
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back
	 * @param {string} [params.sortField] - The field to sort the messages by (createdAt, segmentCount, status, sentimentScore)
	 * @param {string} [params.sortOrder] - The order to sort the messages (asc, desc)
	 * @param {number} [params.page] - The page number for pagination
	 * @param {number} [params.limit] - The number of messages per page
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the list of messages. Inbound messages also carry
	 * sentimentScore (-100..100, null when unscored), sentimentLabel ("positive"|"neutral"|"negative", null when
	 * sentimentScore is null) and sentimentScoredAt. Outbound messages are never scored.
	 */
	async getMessages({
		id,
		campaignId,
		brandId,
		subgroupId,
		groupId,
		registrationId,
		phoneNumber,
		senderPhoneNumber,
		recipientPhoneNumber,
		status,
		direction,
		messageType,
		channel,
		region,
		regionScopes,
		matchAny,
		carrier,
		sentimentLabel,
		errorCode,
		startDate,
		endDate,
		sortField,
		sortOrder,
		page,
		limit,
		dateBounds,
		options = {},
	}) {
		const filters = { id, campaignId, brandId, subgroupId, groupId, registrationId, phoneNumber, senderPhoneNumber, recipientPhoneNumber, status, direction, messageType, channel, region, regionScopes, matchAny, carrier, sentimentLabel, errorCode, startDate, endDate, sortField, sortOrder, page, limit, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Fetch the latest upstream carrier delivery report for a set of messages by ID.
	 * Useful for reconciling messages stuck in a non-terminal state. Outbound SMS and MMS messages sent from numbers on
	 * supported carriers are looked up upstream (reports are retained about 48 hours); every other message,
	 * including P2P messages and messages sent from numbers on other carriers, is returned with its stored status and
	 * upstreamReportAvailable false. The request fails with a 500 when the sending numbers can't be read.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for fetching delivery reports
	 * @param {string[]} params.messageIds - The message IDs to fetch carrier delivery reports for (1-100)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to an array of carrier delivery reports
	 */
	async getDeliveryReports({ messageIds, options = {} }) {
		this.client._require({ messageIds });
		return this.client(`/message/delivery-report`, {
			method: "POST",
			body: { messageIds },
			...options,
		});
	}

	/**
	 * Get aggregated analytics for messages with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting analytics
	 * @param {string} [params.groupId] - Filter analytics by the ID of the associated group
	 * @param {string|string[]} [params.subgroupId] - Filter analytics by the ID of the associated subgroup. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.brandId] - Filter analytics by the ID of the associated brand. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.campaignId] - Filter analytics by the ID of the associated campaign. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string|string[]} [params.phoneNumber] - Filter analytics by the phone number involved in the messages. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.carrier] - Filter analytics by the carrier used for sending. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.carrierFamily] - Filter analytics by the recipient's resolved carrier family (Default, ATT, TMobile, Verizon, USCellular, GoogleVoice, ClearSky, Interop, RogueMobile, P2P, Standard, IceWireless). Accepts a single value, an array, or a comma-separated string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400 -- omit the parameter unless it is wanted.
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back
	 * @param {boolean} [params.matchAny] - When true, the provided campaignId/brandId/phoneNumber filters are OR'd (match ANY) instead of the default most-specific-single behavior. subgroupId stays an AND scope. Opt-in/additive.
	 * @param {(string|string[])} [params.messageType] - Message type(s) the SENTIMENT figures are scoped to: SMS, MMS or P2P (single value, array, or comma-separated string). Omit for all scored types. Does NOT narrow the message counts, which are always returned split per type (smsInbound/mmsInbound/p2pInbound) and have no filterable type dimension.
	 * @param {string|string[]} [params.channel] - Filter analytics by channel (tenDLC, virtualLongCode, tollFree, shortCode, p2p). Filters on the stored channel column; a tenDLC selection also includes older messages that have no channel, and p2p is a real channel here (matched by carrier). Accepts a single value or an array. Ignored when matchAny is true (matchAny takes precedence).
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the analytics data. Also includes inbound-message
	 * sentiment for the requested scope: sentimentScore (volume-weighted average of every scored inbound message
	 * in range, -100..100, null when nothing was scored), sentimentLabel ("positive"|"neutral"|"negative", null
	 * when sentimentScore is null), sentimentScoredCount, sentimentPositive, sentimentNeutral, sentimentNegative.
	 * plus the same six per message type under smsSentiment*, mmsSentiment* and p2pSentiment* prefixes. Every
	 * score is divided server-side and the raw sums are never returned: a score is an average and must never be
	 * summed or re-averaged across types, rows or responses. To weight a subset of message types, pass
	 * messageType and read sentimentScore.
	 */
	async getAnalytics({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, channel, region, regionScopes, messageType, matchAny, dateBounds, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, channel, region, regionScopes, messageType, matchAny, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/analytics${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get detailed analytics snapshot records for charting and aggregation
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting detailed analytics
	 * @param {string} [params.groupId] - Filter analytics by the ID of the associated group
	 * @param {string|string[]} [params.subgroupId] - Filter analytics by the ID of the associated subgroup. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.brandId] - Filter analytics by the ID of the associated brand. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.campaignId] - Filter analytics by the ID of the associated campaign. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string|string[]} [params.phoneNumber] - Filter analytics by the phone number involved in the messages. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.carrier] - Filter analytics by the carrier used for sending. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.carrierFamily] - Filter analytics by the recipient's resolved carrier family (Default, ATT, TMobile, Verizon, USCellular, GoogleVoice, ClearSky, Interop, RogueMobile, P2P, Standard, IceWireless). Accepts a single value, an array, or a comma-separated string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400 -- omit the parameter unless it is wanted.
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp. It is bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode, then floored to the start of its hour at either granularity, because the hourly cube is keyed by hour and a mid-hour start would drop that hour's bucket.
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp. At day granularity it is bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back; at hour granularity it is honoured as given.
	 * @param {(string|string[])} [params.messageType] - Message type(s) the SENTIMENT figures are scoped to: SMS, MMS or P2P (single value, array, or comma-separated string). Omit for all scored types. Does NOT narrow the message counts, which are always returned split per type (smsInbound/mmsInbound/p2pInbound) and have no filterable type dimension.
	 * @param {string|string[]} [params.channel] - Filter analytics by channel (tenDLC, virtualLongCode, tollFree, shortCode, p2p). Filters on the stored channel column; a tenDLC selection also includes older messages that have no channel, and p2p is a real channel here. Accepts a single value or an array.
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {("day"|"hour")} [params.granularity] - Time-bucket grain of the byDate rows. Omit for day (each row's _id is a "YYYY-MM-DD" date). "hour" buckets by hour (each row's _id is a "YYYY-MM-DD HH:MM:SS" UTC hour) and is capped to a 7-day span. Only accepted where the environment serves hourly analytics; elsewhere any value, including "day", is rejected with a 400 -- omit the parameter unless hour grain is wanted.
	 * @param {("carrier"|"carrierFamily")} [params.breakdown] - Adds a byBreakdown time × dimension series to the response ({ dimension, rows }: each row is one byDate bucket (_id) for one carrier or carrier family (key), over the top 50 keys by volume, excluding P2P) and caps the span at 31 days. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400 -- omit the parameter unless it is wanted.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Array>>} - A promise that resolves to an array of analytics snapshot records. cardTotals and
	 * every byDate/byPhoneNumber/byCarrier row also carry that row's own inbound-message sentiment: sentimentScore
	 * (volume-weighted average, -100..100, null when nothing in that row's scope was scored), sentimentLabel,
	 * sentimentScoredCount, sentimentPositive, sentimentNeutral, sentimentNegative. The fields are always present;
	 * plus the same six per message type under smsSentiment*, mmsSentiment* and p2pSentiment* prefixes. Every
	 * score is divided server-side and the raw sums are never returned: a score is an average and must never be
	 * summed or re-averaged across types, rows or responses.
	 */
	async getAnalyticsDetail({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, channel, region, regionScopes, messageType, granularity, breakdown, dateBounds, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, channel, region, regionScopes, messageType, granularity, breakdown, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/analytics/detail${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get per-minute send throughput (peak segments per minute, sending minutes, minutes at a ceiling) for a
	 * campaign, brand, or group, per time bucket and per carrier family. Measured from SENT transitions at
	 * campaign × carrier-family grain -- the grain carrier ceilings are enforced at -- so a peak here is the
	 * figure a ceiling is compared against. Only accepted where the environment serves hourly analytics;
	 * elsewhere the request is rejected with a 400.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the throughput read
	 * @param {string} params.groupId - The group to scope the read to (required)
	 * @param {string|string[]} [params.brandId] - Brand scope. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.campaignId] - Campaign scope; wins over brandId. Accepts a single value, an array, or a comma-separated string.
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). Accepts a single value or an array.
	 * @param {string|string[]} [params.carrierFamily] - Carrier-family filter (ATT, TMobile, Verizon, USCellular, ...). Accepts a single value, an array, or a comma-separated string.
	 * @param {string} params.startDate - ISO-8601 date or timestamp. It is bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode, then floored to the start of its hour at hour granularity and of its minute at day granularity (the cube is keyed by minute).
	 * @param {string} params.endDate - ISO-8601 date or timestamp. At hour granularity it is honoured as given; at day granularity it is bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back. The span is capped at 35 days (the retention of the per-minute data).
	 * @param {("hour"|"day")} [params.granularity] - Bucket grain of the byDate and byBreakdown rows. Omit for hour (each row's _id is a "YYYY-MM-DD HH:MM:SS" UTC hour, span capped at 7 days); "day" buckets by calendar day on the end bound's offset.
	 * @param {number} [params.ceiling] - Segments-per-minute ceiling. When given, every row also reports minutesAtCeiling (sending minutes at or above it); otherwise minutesAtCeiling is null.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - `{ totals, byDate, byCarrierFamily, byBreakdown: { dimension: "carrierFamily", rows } }`. Every row carries segments, messages, peakSegmentsPerMinute, peakMessagesPerMinute, peakMinute (UTC "YYYY-MM-DD HH:MM:SS", null when no traffic), sendingMinutes, averageSegmentsPerSendingMinute and minutesAtCeiling.
	 */
	async getAnalyticsThroughput({ groupId, brandId, campaignId, registrationId, carrierFamily, startDate, endDate, granularity, ceiling, dateBounds, options = {} }) {
		const filters = { groupId, brandId, campaignId, registrationId, carrierFamily, startDate, endDate, granularity, ceiling, dateBounds };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/message/analytics/throughput${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get filter dropdown options (subgroups, brands, campaigns, phone numbers, carriers) for the Analytics page,
	 * scoped to a single group. Only items with at least one message are returned.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting analytics filter options
	 * @param {string} params.groupId - The ID of the group whose filter options to load
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to { subgroups, brands, campaigns, phoneNumbers, carriers }. Each phone number carries type (TOLL_FREE, SHORT_CODE, ALPHANUMERIC, VIRTUAL_LONG_NUMBER, ...) and country (ISO-2), null when unknown: TOLL_FREE, SHORT_CODE and ALPHANUMERIC are channels by type; any other US number is 10DLC and a non-US one is a Virtual Long Code. `carriers` is a plain array of carrier name strings.
	 */
	async getAnalyticsFilterOptions({ groupId, region, options = {} }) {
		const filters = { groupId, region };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/message/analytics/filter-options${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a paginated breakdown of message metrics grouped by subgroup. Each row carries the
	 * full set of sms/mms/p2p metric columns so the caller can apply channel toggles client-side.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.groupId - The Group ID
	 * @param {string|string[]} [params.subgroupId]
	 * @param {string|string[]} [params.brandId]
	 * @param {string|string[]} [params.campaignId]
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string|string[]} [params.phoneNumber]
	 * @param {string|string[]} [params.carrier]
	 * @param {string|string[]} [params.carrierFamily] - Resolved carrier family of the recipient (Default, ATT, TMobile, Verizon, USCellular, GoogleVoice, ClearSky, Interop, RogueMobile, P2P, Standard, IceWireless); single value, array, or comma-separated. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400 -- omit the parameter unless it is wanted.
	 * @param {string} [params.startDate]
	 * @param {string} [params.endDate]
	 * @param {number} [params.page=1]
	 * @param {number} [params.limit=50] - max 50 per page
	 * @param {("tenDLC"|"virtualLongCode"|"tollFree"|"shortCode"|"p2p"|"both")|Array<"tenDLC"|"virtualLongCode"|"tollFree"|"shortCode"|"p2p">} [params.channel="both"] - Filter and rank rows by the stored channel column. "both" (default) means all activity. tenDLC/virtualLongCode/tollFree/shortCode/p2p (single value or array) limit to the selected channel(s).
	 * @param {(string|string[])} [params.messageType] - Message type(s) the SENTIMENT figures are scoped to: SMS, MMS or P2P (single value, array, or comma-separated string). Omit for all scored types. Does NOT narrow the message counts, which are always returned split per type (smsInbound/mmsInbound/p2pInbound) and have no filterable type dimension.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {RequestOptions} [params.options]
	 * @returns {Promise<SdkResponse<any>>} - { rows, totalCount, page, limit }. Each row carries sms/mms/p2p metric columns plus `smsOptOuts` and `mmsOptOuts` from the DNC analytics MV (P2P has no opt-outs).
	 * Each row also carries that subgroup's inbound-message sentiment: `sentimentScore` (volume-weighted average of every scored inbound message in that subgroup, -100..100, null when nothing was scored), `sentimentLabel`, `sentimentScoredCount`, `sentimentPositive`, `sentimentNeutral`, `sentimentNegative`, plus the same six per message type under `smsSentiment*`, `mmsSentiment*` and `p2pSentiment*` prefixes. The score is derived server-side and must never be re-averaged across rows — combine the counts, not the scores.
	 */
	async getAnalyticsBySubgroup({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, page, limit, channel, region, regionScopes, messageType, dateBounds, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, page, limit, channel, region, regionScopes, messageType, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/analytics/by-subgroup${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a paginated breakdown of failed messages grouped by error code.
	 * Each row contains per-channel (sms/mms/p2p) error counts plus an enriched description.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.groupId - The Group ID
	 * @param {string|string[]} [params.subgroupId]
	 * @param {string|string[]} [params.brandId]
	 * @param {string|string[]} [params.campaignId]
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string|string[]} [params.phoneNumber]
	 * @param {string|string[]} [params.carrier]
	 * @param {string|string[]} [params.carrierFamily] - Resolved carrier family of the recipient (Default, ATT, TMobile, Verizon, USCellular, GoogleVoice, ClearSky, Interop, RogueMobile, P2P, Standard, IceWireless); single value, array, or comma-separated. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400 -- omit the parameter unless it is wanted.
	 * @param {string} [params.startDate]
	 * @param {string} [params.endDate]
	 * @param {number} [params.page=1]
	 * @param {number} [params.limit=50] - max 50 per page
	 * @param {("tenDLC"|"virtualLongCode"|"tollFree"|"shortCode"|"p2p"|"both")|Array<"tenDLC"|"virtualLongCode"|"tollFree"|"shortCode"|"p2p">} [params.channel="both"] - Filter and rank rows by the stored channel column. "both" (default) means every code. tenDLC/virtualLongCode/tollFree/shortCode/p2p (single value or array) limit to the selected channel(s); when one channel is selected, totalErrors reflects only that channel.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {string} [params.errorCode] - Narrow the breakdown to a single failure reason: a numeric Infobip carrier code (as a string, e.g. "607"), the Signal House campaign-opt-out code "OUT", or a no-code failure class (other, moderation, att_limit, p2p_stop, campaign_opt_out, dnc_blocked, bind_hold_expired). Omitted = every reason.
	 * @param {RequestOptions} [params.options]
	 * @returns {Promise<SdkResponse<any>>} - { rows, totalCount, totalErrors: { sms, mms, p2p, all }, page, limit }
	 */
	async getAnalyticsByErrorCode({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, page, limit, channel, region, regionScopes, dateBounds, errorCode, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, carrierFamily, startDate, endDate, page, limit, channel, region, regionScopes, dateBounds, errorCode };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/analytics/by-error-code${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get aggregated DNC (Do Not Contact) opt-out analytics with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting DNC analytics
	 * @param {string} [params.groupId] - Filter by the ID of the associated group
	 * @param {string} [params.subgroupId] - Filter by the ID of the associated subgroup
	 * @param {string} [params.brandId] - Filter by the ID of the associated brand
	 * @param {string} [params.campaignId] - Filter by the ID of the associated campaign
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string} [params.phoneNumber] - Filter by the phone number
	 * @param {string} [params.carrier] - Filter by the carrier
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back
	 * @param {string|string[]} [params.channel] - Filter by channel (tenDLC, virtualLongCode, tollFree, shortCode). Opt-outs are A2P-only, so p2p applies no filter. Filters on the stored channel column; a tenDLC selection also includes older opt-outs that have no channel.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the DNC analytics data (totals, byDate, byPhoneNumber, bySenderNumber, byCampaign, bySubgroup, byType, byCarrier, byKeyword). bySenderNumber ({ senderPhoneNumber, total, sms, mms }) attributes each opt-out to the first business number that received it, so it is unchanged by later campaign moves and START replies. byCampaign ({ campaignId, ... }) counts campaign-scoped opt-outs only, by the campaign at the time of the STOP; subgroup-scoped opt-outs (non-US recipients) are never attributed to a campaign and appear under bySubgroup ({ subgroupId, ... }) instead. byType ({ messageType, total }) splits SMS/MMS. byKeyword breaks opt-outs down by the normalized keyword that revoked consent ({ optOutKeyword, total, sms, mms }); opt-outs recorded before keyword capture shipped appear as a single optOutKeyword: null bucket ("not recorded"). The distinct keyword set is open-ended (campaigns register their own keywords beyond the mandatory floor) — render top-N plus Other, never a fixed list.
	 */
	async getDncAnalytics({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, startDate, endDate, channel, region, regionScopes, dateBounds, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, startDate, endDate, channel, region, regionScopes, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/dnc/analytics${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get paginated Do Not Call records with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting DNC records
	 * @param {string} [params.groupId] - Filter by the ID of the associated group
	 * @param {string} [params.subgroupId] - Filter by the ID of the associated subgroup
	 * @param {string} [params.brandId] - Filter by the ID of the associated brand
	 * @param {string} [params.campaignId] - Filter by the ID of the associated campaign
	 * @param {string|string[]} [params.registrationId] - Filter to traffic attributed to these registrations (hourly analytics only; a 400 while hourly reads are off). A phoneNumber filter takes precedence. Accepts a single value or an array.
	 * @param {string} [params.phoneNumber] - Filter by the phone number
	 * @param {string} [params.carrier] - Filter by the carrier
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; bound per dateBounds: a bare date is always that whole UTC day (inclusive); a timestamp is widened to its whole UTC day in "day" mode and bound as the instant it names, in whatever offset it was written, in "exact" mode. In "exact" mode day buckets align to the UTC offset this bound carries, so a client that sends its own midnights gets its own calendar dates back
	 * @param {number} [params.page] - Page number for pagination
	 * @param {number} [params.limit] - Number of records per page
	 * @param {string} [params.sortField] - Field to sort by
	 * @param {string} [params.sortOrder] - Sort direction (asc, desc)
	 * @param {string|string[]} [params.channel] - Filter by channel (tenDLC, virtualLongCode, tollFree, shortCode). Opt-outs are A2P-only, so p2p applies no filter. Filters on the stored channel column; a tenDLC selection also includes older opt-outs that have no channel.
	 * @param {("day"|"exact")} [params.dateBounds] - Which contract binds startDate/endDate. "day": each bound is widened to its whole UTC day. "exact": a timestamp is bound as the instant it names and a bare date is its whole UTC day. Omitted: "day".
	 * @param {string|string[]} [params.region] - ISO-2 country filter: US, GB or CA (any case of UK/GB/GBR/United Kingdom is accepted for GB); one value, an array, or a comma-separated string; omitted = every region. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {Object[]|string} [params.regionScopes] - Array of OR-ed branches `{ region, channels, brandId?, campaignId?, phoneNumber? }` (channels among tenDLC, virtualLongCode, tollFree, shortCode, p2p); `[]` matches nothing. Sent as JSON unless already a string. Only accepted where the environment serves hourly analytics; elsewhere any value is rejected with a 400.
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the paginated DNC records. Each record carries senderPhoneNumber — the first business number that received the opt-out (set once, never changed by a later STOP or a campaign move; the same value as phoneNumber) — optOutKeyword — the normalized keyword that revoked consent (e.g. "stop", "opt out"; a repeat opt-out records the most recent word), null for opt-outs recorded before keyword capture shipped — and carrierFamily, the resolved carrier family of the recipient number (Default, ATT, TMobile, Verizon, USCellular, GoogleVoice, ClearSky, Interop, RogueMobile, Standard, IceWireless), copied from the inbound message that triggered the opt-out. campaignId is null on subgroup-scoped records (non-US recipients).
	 */
	async getDncRecords({ groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, startDate, endDate, page, limit, sortField, sortOrder, channel, region, regionScopes, dateBounds, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, registrationId, phoneNumber, carrier, startDate, endDate, page, limit, sortField, sortOrder, channel, region, regionScopes, dateBounds };
		const queryString = this.client._getQueryString(withRegionScopes(filters));
		return this.client(`/message/dnc${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Send an SMS message to one or more recipient phone numbers
	 *
	 * The response reports the send outcome with three fields so callers do not have to inspect
	 * insertedMessages: requestedRecipientCount, enqueuedCount, and failedCount. enqueuedCount is the
	 * number of recipients accepted for delivery and is 0 when the send was fully blocked (by the
	 * moderation filter or a campaign opt-out); the request still resolves successfully in that case, so
	 * treat enqueuedCount, not the HTTP status, as the signal that a message was accepted. Blocked
	 * recipients are returned in insertedMessages with status "FAILED"; recipients on the global Do Not
	 * Contact list are reported in dncBlockedNumbers with no message record. Each FAILED message carries
	 * errorCode, a stable machine-readable cause (campaign opt-out is "OUT"; null on success or on
	 * failures with no assigned code) that is also included on the FAILED status-callback payload.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for sending an SMS message
	 * @param {string} params.senderPhoneNumber - The 5-6 digit Short Code or 10+ digit phone number to send the message from, or a READY alphanumeric sender ID (e.g. "ACME"; UK recipients and SMS only). Every message from an alphanumeric sender gets "\nOpt out: sihou.io/o/{code}" appended by the server, counted in segments.
	 * @param {string|string[]} params.recipientPhoneNumbers - The 10+ digit phone number(s) to send the message to. A Short Code sender permits exactly one recipient, and it must be a +1 (US/Canada) number; a bare 10-digit number is treated as +1. The API rejects Short Code sends with multiple recipients or a non-+1 recipient.
	 * @param {string} params.messageBody - The body of the SMS message
	 * @param {string} [params.statusCallbackUrl] - The URL to receive status callbacks
	 * @param {boolean} [params.enableShortlink=false] - Whether to enable shortlink in the message
	 * @param {boolean} [params.filterLandlinesAndInactiveNumbers=false] - Whether to filter out landline and inactive numbers before sending
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the response data from the server
	 */
	async sendSMS({ senderPhoneNumber, recipientPhoneNumbers, messageBody, statusCallbackUrl, enableShortlink = false, filterLandlinesAndInactiveNumbers = false, options = {} }) {
		this.client._require({ senderPhoneNumber, recipientPhoneNumbers, messageBody });
		return this.client(`/message/sms`, {
			method: "POST",
			body: { senderPhoneNumber, recipientPhoneNumber: recipientPhoneNumbers, messageBody, statusCallbackUrl, enableShortlink, ...(filterLandlinesAndInactiveNumbers && { filterLandlinesAndInactiveNumbers }) },
			...options,
		});
	}

	/**
	 * Send a P2P message via Rogue Mobile SMPP
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for sending a P2P message
	 * @param {string[]} params.recipientPhoneNumbers - The phone number(s) to send the message to
	 * @param {string} params.messageBody - The body of the P2P message
	 * @param {string} [params.statusCallbackUrl] - The URL to receive status callbacks
	 * @param {string} [params.groupId] - Explicit group to send from. Defaults to the group in your auth context.
	 * @param {string} [params.subgroupId] - Explicit subgroup to attribute the send (and its inbound reply) to.
	 *   P2P has no dedicated sender number, so pass this to record the send against a specific subgroup; it also
	 *   resolves the group. Defaults to the group's oldest subgroup.
	 * @param {boolean} [params.useSignalHouseShortlinks] - When false, SignalHouse applies no link-shortening
	 *   or text-spin and your pre-spun links/content are sent verbatim (bring-your-own spinner). Defaults to
	 *   true server-side (the SignalHouse shortlink system, which mints unique per-recipient links).
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the response data from the server
	 */
	async sendP2P({ recipientPhoneNumbers, messageBody, statusCallbackUrl, groupId, subgroupId, useSignalHouseShortlinks, options = {} }) {
		this.client._require({ recipientPhoneNumbers, messageBody });
		const body = { recipientPhoneNumber: recipientPhoneNumbers, messageBody };
		if (statusCallbackUrl) body.statusCallbackUrl = statusCallbackUrl;
		if (groupId) body.groupId = groupId;
		if (subgroupId) body.subgroupId = subgroupId;
		if (typeof useSignalHouseShortlinks === "boolean") body.useSignalHouseShortlinks = useSignalHouseShortlinks;
		return this.client(`/message/p2p`, {
			method: "POST",
			body,
			...options,
		});
	}

	/**
	 * Get the details of a P2P batch by its ID
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a P2P batch
	 * @param {string} params.batchId - The ID of the P2P batch to retrieve
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the batchId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The P2P batch object returned from the server
	 */
	async getP2PBatch({ batchId, options = {} }) {
		this.client._require({ batchId });
		const safeBatchId = encodeURIComponent(batchId);
		return this.client(`/message/p2p/batches/${safeBatchId}`, { method: "GET", ...options });
	}

	/**
	 * Send an MMS message to one or more recipient phone numbers, with optional media attachments and status callback
	 *
	 * The response reports the send outcome with three fields so callers do not have to inspect
	 * insertedMessages: requestedRecipientCount, enqueuedCount, and failedCount. enqueuedCount is the
	 * number of recipients accepted for delivery and is 0 when the send was fully blocked (by the
	 * moderation filter or a campaign opt-out); the request still resolves successfully in that case, so
	 * treat enqueuedCount, not the HTTP status, as the signal that a message was accepted. Blocked
	 * recipients are returned in insertedMessages with status "FAILED"; recipients on the global Do Not
	 * Contact list are reported in dncBlockedNumbers with no message record. Each FAILED message carries
	 * errorCode, a stable machine-readable cause (campaign opt-out is "OUT"; null on success or on
	 * failures with no assigned code) that is also included on the FAILED status-callback payload.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for sending an MMS message
	 * @param {string} params.senderPhoneNumber - The 5-6 digit Short Code or 10+ digit phone number to send the message from
	 * @param {string[]} params.recipientPhoneNumbers - The 10+ digit phone number(s) to send the message to. A Short Code sender permits exactly one recipient, and it must be a +1 (US/Canada) number; a bare 10-digit number is treated as +1. The API rejects Short Code sends with multiple recipients or a non-+1 recipient.
	 * @param {string} params.messageBody - The body of the MMS message
	 * @param {string[]} [params.mediaUrls] - The URLs of the media attachments
	 * @param {string} [params.statusCallbackUrl] - The URL to receive status callbacks
	 * @param {boolean} [params.enableShortlink=false] - Whether to enable shortlink in the message
	 * @param {boolean} [params.enableCompression=true] - Whether to enable image compression for the image attachments
	 * @param {boolean} [params.filterLandlinesAndInactiveNumbers=false] - Whether to filter out landline and inactive numbers before sending
	 * @param {File[]} [params.images] - The images to attach to the MMS message
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the response data from the server
	 */
	async sendMMS({
		senderPhoneNumber,
		recipientPhoneNumbers,
		messageBody,
		mediaUrls,
		statusCallbackUrl,
		enableShortlink = false,
		enableCompression = true,
		filterLandlinesAndInactiveNumbers = false,
		images,
		options = {},
	}) {
		this.client._require({ senderPhoneNumber, recipientPhoneNumbers });

		const formData = new FormData();

		if (images && images.length > 0) {
			images.forEach((image, index) => {
				formData.append("images", image);
			});
		}

		formData.append("senderPhoneNumber", senderPhoneNumber);

		formData.append("recipientPhoneNumber", Array.isArray(recipientPhoneNumbers) ? JSON.stringify(recipientPhoneNumbers) : recipientPhoneNumbers);
		if (messageBody) formData.append("messageBody", messageBody);

		if (mediaUrls && mediaUrls.length > 0) {
			formData.append("mediaUrls", JSON.stringify(mediaUrls));
		}

		if (statusCallbackUrl) {
			formData.append("statusCallbackUrl", statusCallbackUrl);
		}

		formData.append("enableShortlink", String(enableShortlink));
		formData.append("enableCompression", String(enableCompression));
		if (filterLandlinesAndInactiveNumbers) formData.append("filterLandlinesAndInactiveNumbers", String(filterLandlinesAndInactiveNumbers));

		return this.multipartClient(`/message/mms`, { method: "POST", body: formData, ...options });
	}

	/**
	 * Send a group MMS message to one or more recipient phone numbers, with optional media attachments and status callback
	 *
	 * The response reports the send outcome with three fields so callers do not have to inspect
	 * insertedMessages: requestedRecipientCount, enqueuedCount, and failedCount. enqueuedCount is the
	 * number of recipients accepted for delivery and is 0 when the send was fully blocked (by the
	 * moderation filter or a campaign opt-out); the request still resolves successfully in that case, so
	 * treat enqueuedCount, not the HTTP status, as the signal that a message was accepted. Blocked
	 * recipients are returned in insertedMessages with status "FAILED"; recipients on the global Do Not
	 * Contact list are reported in dncBlockedNumbers with no message record. Each FAILED message carries
	 * errorCode, a stable machine-readable cause (campaign opt-out is "OUT"; null on success or on
	 * failures with no assigned code) that is also included on the FAILED status-callback payload.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for sending an MMS message
	 * @param {string} params.senderPhoneNumber - The phone number to send the message from
	 * @param {string[]} params.recipientPhoneNumbers - The phone number(s) to send the message to
	 * @param {string} params.messageBody - The body of the MMS message
	 * @param {string[]} [params.mediaUrls] - The URLs of the media attachments
	 * @param {string} [params.statusCallbackUrl] - The URL to receive status callbacks
	 * @param {boolean} [params.enableShortlink=false] - Whether to enable shortlink in the message
	 * @param {boolean} [params.enableCompression=true] - Whether to enable image compression for the image attachments
	 * @param {boolean} [params.filterLandlinesAndInactiveNumbers=false] - Whether to filter out landline and inactive numbers before sending
	 * @param {File[]} [params.images] - The images to attach to the MMS message
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the response data from the server
	 */
	async sendGroupMessage({
		senderPhoneNumber,
		recipientPhoneNumbers,
		messageBody,
		mediaUrls,
		statusCallbackUrl,
		enableShortlink = false,
		enableCompression = true,
		filterLandlinesAndInactiveNumbers = false,
		images,
		options = {},
	}) {
		this.client._require({ senderPhoneNumber, recipientPhoneNumbers });

		const formData = new FormData();

		if (images && images.length > 0) {
			images.forEach((image, index) => {
				formData.append("images", image);
			});
		}

		formData.append("senderPhoneNumber", senderPhoneNumber);

		formData.append("recipientPhoneNumber", Array.isArray(recipientPhoneNumbers) ? JSON.stringify(recipientPhoneNumbers) : recipientPhoneNumbers);
		if (messageBody) formData.append("messageBody", messageBody);

		if (mediaUrls && mediaUrls.length > 0) {
			formData.append("mediaUrls", JSON.stringify(mediaUrls));
		}

		if (statusCallbackUrl) {
			formData.append("statusCallbackUrl", statusCallbackUrl);
		}

		formData.append("enableShortlink", String(enableShortlink));
		formData.append("enableCompression", String(enableCompression));
		if (filterLandlinesAndInactiveNumbers) formData.append("filterLandlinesAndInactiveNumbers", String(filterLandlinesAndInactiveNumbers));

		return this.multipartClient(`/message/groupMessage`, { method: "POST", body: formData, ...options });
	}

	/**
	 * Look up the carrier for a phone number. Always performs a fresh lookup (not cached). Billed per request.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for looking up a carrier
	 * @param {string} params.phoneNumber - The phone number to look up (10+ digits, no + prefix)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to carrier information
	 */
	async carrierIdLookup({ phoneNumber, options = {} }) {
		this.client._require({ phoneNumber });
		return this.client(`/message/carrier-id`, {
			method: "POST",
			body: { phoneNumber },
			...options,
		});
	}
}
