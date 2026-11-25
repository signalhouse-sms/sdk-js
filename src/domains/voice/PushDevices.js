/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} RegisterPushDeviceData
 * @property {"apns"|"fcm"} provider - "apns" for iOS (PushKit VoIP token), "fcm" for Android (Firebase registration token).
 * @property {string} deviceToken - The device's push token.
 * @property {"production"|"sandbox"} [environment] - apns only: "sandbox" for development builds. Default "production".
 * @property {string} [appId] - The bundle ID or Firebase project ID; only needed when the account has several apps for the provider.
 */

/**
 * Mobile push devices — your app registers each device so incoming calls wake it. These methods are
 * called by the app with the user's **voice token** (from `sdk.voice.tokens.create`, minted with a
 * `subgroupId`) as `options.token`, not a dashboard or API key token. The device is tied to that
 * token's identity. Calls the Voice service mounted under /voice. Accessed via `sdk.voice.pushDevices`.
 */
export class PushDevices {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Register this device for push. Call it after each token mint and whenever the OS gives the app a
	 * new push token. A push token already registered to another user moves to this one.
	 * @async
	 * @roles voice token
	 * @param {Object} params - Request parameters.
	 * @param {RegisterPushDeviceData} params.deviceData - The device.
	 * @param {RequestOptions} params.options - Must carry the voice token as `token`.
	 * @throws {Error} If deviceData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { id, identity, provider, environment, appId, registeredAt } }` (201).
	 */
	async register({ deviceData, options = {} }) {
		this.client._require({ deviceData });
		return this.client(`/voice/api/v1/push-devices`, { method: "POST", body: deviceData, ...options });
	}

	/**
	 * Unregister this device, e.g. when the user signs out.
	 * @async
	 * @roles voice token
	 * @param {Object} params - Request parameters.
	 * @param {string} params.deviceToken - The device's push token.
	 * @param {RequestOptions} params.options - Must carry the voice token as `token`.
	 * @throws {Error} If deviceToken is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { removed } }`.
	 */
	async unregister({ deviceToken, options = {} }) {
		this.client._require({ deviceToken });
		return this.client(`/voice/api/v1/push-devices/${encodeURIComponent(deviceToken)}`, { method: "DELETE", ...options });
	}

	/**
	 * The pushes recently sent to the voice token's user, newest first (kept 7 days), for debugging.
	 * @async
	 * @roles voice token
	 * @param {Object} [params] - Request parameters.
	 * @param {number} [params.limit] - How many, 1 to 100 (default 20).
	 * @param {RequestOptions} [params.options] - Must carry the voice token as `token`.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: [{ id, callUuid, provider, kind, status, error, createdAt }] }`.
	 */
	async listDeliveries({ limit, options = {} } = {}) {
		const query = limit !== undefined && limit !== null ? `?limit=${encodeURIComponent(limit)}` : "";
		return this.client(`/voice/api/v1/push-devices/deliveries${query}`, { method: "GET", ...options });
	}
}
