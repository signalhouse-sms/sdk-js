/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Carrier phone-number checks under /verify: SIM Swap and Number Verify. Every check the carrier answers is billed to
 * the group's wallet (402 on insufficient funds); a check the carrier cannot run for the number is a 422 and is not charged.
 */
export class Verify {
	/**
	 * Keep the JSON client every verify request goes through.
	 * @param {any} client - The JSON request client
	 * @param {boolean} [enableAdmin] - Whether admin-scoped behaviors are enabled
	 */
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Check whether a number's SIM card changed recently, as reported by its carrier. Billed once when the check answers;
	 * 422 when the check is not available for the number (not charged)
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The check
	 * @param {string} params.phoneNumber - The number to check, in international format (e.g. "+12025550123")
	 * @param {number} [params.maxAge] - Lookback window in hours, 1-2400; the carrier's default when omitted
	 * @param {boolean} [params.includeSwapDate] - Also return the latest SIM change date (no extra charge; default false)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ checkId, phoneNumber, swapped, maxAge, latestSimChange?, cost }`
	 */
	async checkSimSwap({ phoneNumber, maxAge, includeSwapDate, options = {} }) {
		this.client._require({ phoneNumber });
		const body = { phoneNumber, ...(maxAge !== undefined && { maxAge }), ...(includeSwapDate !== undefined && { includeSwapDate }) };
		return this.client(`/verify/sim-swap`, { method: "POST", body, ...options });
	}

	/**
	 * Start a Number Verify check. The end user's phone must open the returned `authorizationUrl` on mobile data (Wi-Fi off)
	 * within 10 minutes; the carrier then confirms whether the phone's own number matches. Read the result with
	 * getNumberVerification. Billed only when the check is answered (VERIFIED or NOT_VERIFIED)
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The check
	 * @param {string} params.phoneNumber - The number to verify, in international format (e.g. "+12025550123")
	 * @param {string} [params.devicePhoneNumber] - The phone's own number, sent to the carrier as a login hint
	 * @param {string} [params.redirectUrl] - An https URL the end user's browser is sent to after the check, with `?checkId=…`
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ checkId, phoneNumber, status: "PENDING", authorizationUrl, expiresAt }`
	 */
	async startNumberVerification({ phoneNumber, devicePhoneNumber, redirectUrl, options = {} }) {
		this.client._require({ phoneNumber });
		const body = { phoneNumber, ...(devicePhoneNumber !== undefined && { devicePhoneNumber }), ...(redirectUrl !== undefined && { redirectUrl }) };
		return this.client(`/verify/number`, { method: "POST", body, ...options });
	}

	/**
	 * Get a Number Verify check's status and result. A PENDING check past its expiresAt reads as EXPIRED
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.checkId - The check ID (e.g. NVC…)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ checkId, phoneNumber, status, devicePhoneNumberVerified, failureReason, createdAt, expiresAt, completedAt, cost }`
	 */
	async getNumberVerification({ checkId, options = {} }) {
		this.client._require({ checkId });
		return this.client(`/verify/number/${encodeURIComponent(checkId)}`, { method: "GET", ...options });
	}
}
