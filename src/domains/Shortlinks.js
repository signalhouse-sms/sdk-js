/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Shortlinks {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get the redirect URL for a shortlink by its ID
	 * @async
	 * @roles public
	 * @param {Object} params - The parameters for getting the shortlink redirect
	 * @param {string} params.shortlinkId - The ID of the shortlink
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the redirect URL for the shortlink
	 */
	async getShortlinkRedirect({ shortlinkId, options = {} }) {
		this.client._require({ shortlinkId });
		const safeShortlinkId = encodeURIComponent(shortlinkId);
		return this.client(`/shortlink/redirect/${safeShortlinkId}`, { method: "GET", ...options });
	}

	/**
	 * Get the recipient opt-out details behind an alphanumeric-sender opt-out link (sihou.io/o/{code})
	 * @async
	 * @roles public
	 * @param {Object} params - The parameters for getting the opt-out details
	 * @param {string} params.code - The opt-out code from the link
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ code, senderName, maskedRecipient, optedOut }`
	 */
	async getOptOut({ code, options = {} }) {
		this.client._require({ code });
		const safeCode = encodeURIComponent(code);
		return this.client(`/shortlink/optout/${safeCode}`, { method: "GET", ...options });
	}

	/**
	 * Confirm the recipient opt-out behind an alphanumeric-sender opt-out link; idempotent
	 * @async
	 * @roles public
	 * @param {Object} params - The parameters for confirming the opt-out
	 * @param {string} params.code - The opt-out code from the link
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ code, senderName, maskedRecipient, optedOut: true }`
	 */
	async confirmOptOut({ code, options = {} }) {
		this.client._require({ code });
		const safeCode = encodeURIComponent(code);
		return this.client(`/shortlink/optout/${safeCode}`, { method: "POST", ...options });
	}

	/**
	 * Get details of a shortlink by its ID, with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting the shortlink details
	 * @param {string} [params.shortlinkId] - The ID of the shortlink
	 * @param {string} [params.messageId] - Filter by associated message ID
	 * @param {string} [params.phoneNumber] - Filter by associated phone number
	 * @param {string} [params.campaignId] - Filter by associated campaign ID
	 * @param {string} [params.brandId] - Filter by associated brand ID
	 * @param {string} [params.subgroupId] - Filter by associated subgroup ID
	 * @param {string} [params.groupId] - Filter by associated group ID
	 * @param {number} [params.page] - The page number for pagination
	 * @param {number} [params.limit] - The number of items per page for pagination
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the shortlink details
	 */
	async getShortlink({ shortlinkId, messageId, phoneNumber, campaignId, brandId, subgroupId, groupId, page, limit, options = {} }) {
		const filters = { shortlinkId, messageId, phoneNumber, campaignId, brandId, subgroupId, groupId, page, limit };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/shortlink${queryString}`, { method: "GET", ...options });
	}
}
