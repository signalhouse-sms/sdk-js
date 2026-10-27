/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Onboarding {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Get all onboarding records (one per group). Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params] - Optional parameters
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - Array of onboarding records
				 */
				getOnboardings: async ({ options = {} } = {}) => {
					return this.client(`/group/onboarding`, { method: "GET", ...options });
				},

				/**
				 * Get a single onboarding record by group ID. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID whose onboarding record to retrieve
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The onboarding record
				 */
				getOnboarding: async ({ groupId, options = {} }) => {
					this.client._require({ groupId });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/onboarding/${safeGroupId}`, { method: "GET", ...options });
				},

				/**
				 * Set where a group's new toll-free brands and numbers go (`infobip` or `twilio`). Staff-only. Existing brands,
				 * numbers and campaigns stay where they are.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID whose toll-free provider to set
				 * @param {string} params.tollFreeProvider - The toll-free provider for the group's new toll-free brands and numbers ("infobip" or "twilio")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or tollFreeProvider parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated onboarding record
				 */
				setTollFreeProvider: async ({ groupId, tollFreeProvider, options = {} }) => {
					this.client._require({ groupId, tollFreeProvider });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/onboarding/${safeGroupId}/toll-free-provider`, { method: "PUT", body: { tollFreeProvider }, ...options });
				},

				/**
				 * Add an internal comment/note to a group's admin Pricing editor. Staff-only.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID to comment on
				 * @param {string} params.comment - The comment/note text
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or comment parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated onboarding record
				 */
				addPricingComment: async ({ groupId, comment, options = {} }) => {
					this.client._require({ groupId, comment });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/onboarding/${safeGroupId}/pricing-comments`, { method: "POST", body: { comment }, ...options });
				},

				/**
				 * Add an internal comment/note to a group's admin Credits page. Staff-only.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID to comment on
				 * @param {string} params.comment - The comment/note text
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or comment parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated onboarding record
				 */
				addCreditComment: async ({ groupId, comment, options = {} }) => {
					this.client._require({ groupId, comment });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/onboarding/${safeGroupId}/credit-comments`, { method: "POST", body: { comment }, ...options });
				},
			};
		}
	}

	/**
	 * Get the caller's own onboarding record (customer-safe projection) — the selections captured at
	 * signup plus the gate flags derived from them. Never returns internal KYC, staff assignment,
	 * referral, or external-reference data.
	 *
	 * Staff roles and sessions with no active group receive a synthetic verified, selection-free
	 * record rather than an error, so callers never have to special-case them.
	 * @async
	 * @param {Object} [params] - Optional parameters
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - `{ acceptedTermsOfService: boolean, emailVerified: boolean, products: string[], estimatedVolume: string|null, pendingExternalLink: "ghl"|"shopify"|null }`
	 */
	async getMyOnboarding({ options = {} } = {}) {
		return this.client(`/group/onboarding/my`, { method: "GET", ...options });
	}

	/**
	 * Accept the Terms of Service for the caller's active group.
	 * @async
	 * @param {Object} [params] - Optional parameters
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - `{ acceptedTermsOfService: true }`
	 */
	async acceptTermsOfService({ options = {} } = {}) {
		return this.client(`/group/onboarding/my/accept-terms`, {
			method: "PUT",
			body: { acceptedTermsOfService: true },
			...options,
		});
	}
}
