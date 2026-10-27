/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} GlobalVoiceSettingsData
 * @property {string[]} [acceptedRegions] - Accepted regions as country calling codes; empty = all allowed.
 * @property {number|null} [maxSpendPerMinute] - Baseline max spend per minute (dollars); null = no limit.
 * @property {boolean} [e911Enabled] - Whether numbers may dial 911.
 */

/**
 * Global Voice Settings — account-wide voice defaults (accepted regions, max
 * spend per minute, E911). SIP trunks and Programmable Voice Profiles override
 * these. Calls the Voice service mounted under /voice. Accessed via
 * `sdk.voice.globalVoiceSettings`.
 */
export class GlobalVoiceSettings {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get the current account's global voice settings. Returns `data: null` if the
	 * account has never configured them (defaults apply).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { accountId, acceptedRegions, maxSpendPerMinute, e911Enabled, ... } | null }`.
	 */
	async get({ options = {} } = {}) {
		return this.client(`/voice/api/v1/global-voice-settings`, { method: "GET", ...options });
	}

	/**
	 * Upsert the account's global voice settings. Partial — only the fields you
	 * provide are written; omitted fields are preserved.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {GlobalVoiceSettingsData} params.settingsData - Fields to set.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If settingsData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { ...settings } }`.
	 */
	async update({ settingsData, options = {} }) {
		this.client._require({ settingsData });
		return this.client(`/voice/api/v1/global-voice-settings`, { method: "PUT", body: settingsData, ...options });
	}
}
