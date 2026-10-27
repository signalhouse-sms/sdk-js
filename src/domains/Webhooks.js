/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Webhooks {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get a list of webhooks with optional filters. Each returned endpoint carries `hasSigningSecret`
	 * (boolean) instead of the signing secret itself — the plaintext secret is only ever returned once,
	 * from `createWebhook`, and is never exposed again on any read.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for getting webhooks
	 * @param {string} [params.id] - Filter by webhook ID
	 * @param {string} [params.groupId] - Filter by associated group ID
	 * @param {string} [params.endpointType] - Filter by endpoint type (Global, Number)
	 * @param {string} [params.phoneNumber] - Filter by associated phone number (for SMS webhooks)
	 * @param {number} [params.page] - The page number for pagination
	 * @param {number} [params.limit] - The number of items per page for pagination
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Array>>} The response from the server
	 */
	async getWebhooks({ id, groupId, endpointType, phoneNumber, page, limit, options = {} }) {
		const filters = { id, groupId, endpointType, phoneNumber, page, limit };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/webhook${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Create a new webhook with the specified data. The response includes a `signingSecret` — a
	 * plaintext HMAC-SHA256 secret used to sign every delivery to this endpoint, sent as the
	 * `X-SignalHouse-Signature` header alongside `X-SignalHouse-Timestamp` (the signed string is
	 * `${timestamp}.${rawRequestBody}`) and `X-SignalHouse-Delivery-Id` (stable across retries of the
	 * same event, for receiver-side dedup), plus `X-SignalHouse-Signature-V1` (`t=<ms>,v1=<hex>[,v1=<hex>]`,
	 * every currently valid signature). Store this secret now: it is never returned again by any read.
	 * If it's lost, call `rotateWebhookSecret`. Verify deliveries with
	 * `verifyWebhookSignature` from `@signalhouse-sms/sdk/webhooks` (Node only). `webhookData.authType` is one of
	 * `NONE` (default), `BASIC`, `API_KEY`, `OAUTH2` or `HMAC`; `HMAC` sends no credentials, so the
	 * receiver authenticates by the signature alone, and must be sent without `credentials` or `apiHeaderPrefix`.
	 * `webhookData.eventSettings` holds per-event options keyed by event name:
	 * `NUMBER_HEALTH_BELOW_THRESHOLD` and `CAMPAIGN_HEALTH_BELOW_THRESHOLD` each take `{ threshold }`, the 7-day
	 * health score (1.5–10, in 0.5 steps) below which the event fires; a subscribed health event without one is
	 * stored with the default, 6.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for creating a webhook
	 * @param {Object} params.webhookData - The data for the new webhook
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the webhookData parameter is missing or if required fields in webhookData are missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server, including the plaintext `signingSecret` (this one time only)
	 */
	async createWebhook({ webhookData, options = {} }) {
		this.client._require({ webhookData: webhookData });
		return this.client(`/webhook`, { method: "POST", body: webhookData, ...options });
	}

	/**
	 * Update an existing webhook with the specified data. `updateData` may include `name`, `url`,
	 * `subscribedEvents` and `authType`, `apiHeaderPrefix` and `credentials` (`{ key, secret? }`)
	 * to change the endpoint's own credentials in place: credentials are required when switching to an auth
	 * type that needs them, and omitted credentials keep the stored ones. Switching to `NONE` or `HMAC` clears
	 * the stored credentials; `HMAC` is rejected for an endpoint with no signing secret (call
	 * `rotateWebhookSecret` first). `updateData.eventSettings` changes per-event options by event name
	 * (`{ NUMBER_HEALTH_BELOW_THRESHOLD: { threshold } }`, `{ CAMPAIGN_HEALTH_BELOW_THRESHOLD: { threshold } }`,
	 * 1.5–10 in 0.5 steps); events you omit keep their stored settings. Like every read of a webhook, the
	 * response carries `hasSigningSecret` and `hasCredentials` (booleans), never a secret or credential.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for updating a webhook
	 * @param {string} params.id - The ID of the webhook to update
	 * @param {Object} params.updateData - The data for the webhook to be updated, including fields such as endpoint URL and event types
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id or updateData parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async updateWebhook({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/webhook/${safeId}`, { method: "PUT", body: updateData, ...options });
	}

	/**
	 * Rotate a webhook's signing secret, or give a webhook created before signing existed its first one.
	 * The response includes the new plaintext `signingSecret`, returned this one time only.
	 * The replaced secret keeps working for `graceSeconds` (default 86400, max 604800, 0 = stop now):
	 * during that window each delivery's `X-SignalHouse-Signature-V1` header carries a signature for both,
	 * and `previousSecretExpiresAt` in the response says when the old one stops. Not available to OAuth
	 * connector tokens.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for rotating the secret
	 * @param {string} params.id - The ID of the webhook
	 * @param {number} [params.graceSeconds] - How long the replaced secret stays valid
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The webhook, including the new plaintext `signingSecret` (this one time only)
	 */
	async rotateWebhookSecret({ id, graceSeconds, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/webhook/${safeId}/rotate-secret`, { method: "POST", body: graceSeconds === undefined ? {} : { graceSeconds }, ...options });
	}

	/**
	 * Delete a webhook by its ID (mark as inactive)
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for deleting a webhook
	 * @param {string} params.id - The ID of the webhook to delete
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async deleteWebhook({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/webhook/${safeId}`, { method: "DELETE", ...options });
	}
}
