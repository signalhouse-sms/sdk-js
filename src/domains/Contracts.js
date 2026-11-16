/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Contracts domain: the staff queue for pricing read from signed PandaDoc contracts. Every method lives under
 * the admin namespace, present only when the SDK is created with `enableAdmin: true`. JS SDK only by design.
 */
export class Contracts {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * List contracts for the staff queue, newest first. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string|string[]} [params.status] - One status, or several (an array or a comma-separated string)
				 * @param {string} [params.groupId] - Only this group's contracts, newest signed first
				 * @param {number} [params.page] - Page number (default 1)
				 * @param {number} [params.limit] - Contracts per page (default 25, max 100)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ data, total, page, limit }`; each contract carries `pandadocUrl`
				 */
				getContracts: async ({ status, groupId, page, limit, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ status: Array.isArray(status) ? status.join(",") : status, groupId, page, limit });
					return this.client(`/contract${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Get one contract: issues, diff, signers, a PandaDoc link and, when it has no group, a suggested one. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.contractId - The contract's ID
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The contract with `pandadocUrl` and `suggestedGroup`
				 */
				getContract: async ({ contractId, options = {} }) => {
					this.client._require({ contractId });
					return this.client(`/contract/${encodeURIComponent(contractId)}`, { method: "GET", ...options });
				},

				/**
				 * Link a contract to a group by hand; the document is then read again against that group. The link resets the contract's
				 * status, so a scheduled contract loses its schedule. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.contractId - The contract's ID
				 * @param {string} params.groupId - The group the contract is for
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The contract after the re-read
				 */
				linkContractGroup: async ({ contractId, groupId, options = {} }) => {
					this.client._require({ contractId, groupId });
					return this.client(`/contract/${encodeURIComponent(contractId)}/link`, { method: "POST", body: { groupId }, ...options });
				},

				/**
				 * Apply a contract's pricing to its group now (staff approval). A contract dated in the future is scheduled instead.
				 * Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.contractId - The contract's ID
				 * @param {string} params.expectedUpdatedAt - The `updatedAt` of the contract as reviewed; a changed contract gets a 409
				 * @param {string} params.expectedGroupId - The group the contract was reviewed for
				 * @param {?number} [params.expectedPlanCharge] - The immediate charge shown from `applyPreview`, in microdollars; a plan
				 *   create that would charge anything else is refused before charging
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The contract after the apply
				 */
				applyContract: async ({ contractId, expectedUpdatedAt, expectedGroupId, expectedPlanCharge, options = {} }) => {
					this.client._require({ contractId, expectedUpdatedAt, expectedGroupId });
					return this.client(`/contract/${encodeURIComponent(contractId)}/apply`, { method: "POST", body: { expectedUpdatedAt, expectedGroupId, ...(expectedPlanCharge !== undefined ? { expectedPlanCharge } : {}) }, ...options });
				},

				/**
				 * Reject a contract so it is never applied. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.contractId - The contract's ID
				 * @param {string} params.reason - Why it is rejected
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The rejected contract
				 */
				rejectContract: async ({ contractId, reason, options = {} }) => {
					this.client._require({ contractId, reason });
					return this.client(`/contract/${encodeURIComponent(contractId)}/reject`, { method: "POST", body: { reason }, ...options });
				},

				/**
				 * Read a contract from PandaDoc again and re-parse it. Not allowed while scheduled, or once pricing is being written or has been applied.
				 * Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.contractId - The contract's ID
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The contract after the re-read
				 */
				reparseContract: async ({ contractId, options = {} }) => {
					this.client._require({ contractId });
					return this.client(`/contract/${encodeURIComponent(contractId)}/reparse`, { method: "POST", body: {}, ...options });
				},
			};
		}
	}
}
