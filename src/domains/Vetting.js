/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Vetting domain: the staff-only brand vetting engine for branded calling. A case runs a brand through automated checks, a
 * rules engine decides it, and staff work only the exception queue. Every method lives under the admin namespace, present
 * only when the SDK is created with `enableAdmin: true`. JS SDK only by design.
 */
export class Vetting {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Start vetting a brand. The case runs in the background; read it with getVettingCase. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {Object} params.subject - The brand: `{ legalName, entityType?, displayName?, ein?, website?, sector?,
				 *   authorizer?: { name?, email?, phone? }, billingContact?: { name?, email?, phone? },
				 *   billingAddress?: { street?, city?, state?, postalCode?, country? }, groupId?, brandId? }`. Only `legalName` is
				 *   required to start; a case missing any field the checks need is rejected with a cure listing them.
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ caseId, tenantId, status }`, accepted with HTTP 202
				 */
				startVettingCase: async ({ subject, tenantId, options = {} }) => {
					this.client._require({ subject });
					return this.client("/vetting/cases", { method: "POST", body: { subject, ...(tenantId !== undefined ? { tenantId } : {}) }, ...options });
				},

				/**
				 * List vetting cases, newest first. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {("RUNNING"|"DECIDING"|"VERIFIED"|"REJECTED"|"FALLBACK"|"EXCEPTION"|"HUMAN_SIGNOFF")} [params.status] - Only cases in this status
				 * @param {number} [params.page] - Page number (default 1)
				 * @param {number} [params.limit] - Cases per page (default 25, max 100)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ data, total, page, limit }`
				 */
				getVettingCases: async ({ tenantId, status, page, limit, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ tenantId, status, page, limit });
					return this.client(`/vetting/cases${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Get one vetting case with its steps, decision and history. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.caseId - The case ID
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The case
				 */
				getVettingCase: async ({ caseId, tenantId, options = {} }) => {
					this.client._require({ caseId });
					const queryString = this.client._getQueryString({ tenantId });
					return this.client(`/vetting/cases/${encodeURIComponent(caseId)}${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Export every evidence item for a case, oldest first, each with its payload's SHA-256. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.caseId - The case ID
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ caseId, tenantId, status, decision, exportedAt, evidence }`
				 */
				getVettingEvidence: async ({ caseId, tenantId, options = {} }) => {
					this.client._require({ caseId });
					const queryString = this.client._getQueryString({ tenantId });
					return this.client(`/vetting/cases/${encodeURIComponent(caseId)}/evidence${queryString}`, { method: "GET", ...options });
				},

				/**
				 * List the vetting exception queue, oldest first. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {("OPEN"|"CLAIMED"|"RESOLVED")} [params.status] - Only items in this status
				 * @param {("EXCEPTION"|"HUMAN_SIGNOFF"|"QA_SAMPLE")} [params.kind] - Only items of this kind
				 * @param {string} [params.reasonCode] - Only items with this reason
				 * @param {number} [params.page] - Page number (default 1)
				 * @param {number} [params.limit] - Items per page (default 25, max 100)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ data, total, page, limit }`
				 */
				getVettingExceptions: async ({ tenantId, status, kind, reasonCode, page, limit, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ tenantId, status, kind, reasonCode, page, limit });
					return this.client(`/vetting/exceptions${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Claim an open exception queue item, or take over one whose holder is no longer a Compliance Admin. Only one staff
				 * member can hold an item. Compliance Admins only, and never on a case the caller started.
				 * @async
				 * @roles signalhouse_user holding the COMPLIANCE_ADMIN staff permission (never signalhouse_admin)
				 * @param {Object} params
				 * @param {string} params.exceptionId - The queue item ID
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The claimed item
				 */
				claimVettingException: async ({ exceptionId, tenantId, options = {} }) => {
					this.client._require({ exceptionId });
					return this.client(`/vetting/exceptions/${encodeURIComponent(exceptionId)}/claim`, { method: "POST", body: { ...(tenantId !== undefined ? { tenantId } : {}) }, ...options });
				},

				/**
				 * Resolve a claimed exception queue item and set the case's result by hand. On a QA sample, VERIFY confirms the
				 * auto-approval and REJECT overturns it. Compliance Admins only: the one holding the item.
				 * @async
				 * @roles signalhouse_user holding the COMPLIANCE_ADMIN staff permission (never signalhouse_admin)
				 * @param {Object} params
				 * @param {string} params.exceptionId - The queue item ID
				 * @param {("VERIFY"|"REJECT")} params.outcome - The result
				 * @param {string} params.note - Why, kept with the case's evidence
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ exception, case: { caseId, tenantId, status, decision } }`; read the full case with getVettingCase
				 */
				resolveVettingException: async ({ exceptionId, outcome, note, tenantId, options = {} }) => {
					this.client._require({ exceptionId, outcome, note });
					return this.client(`/vetting/exceptions/${encodeURIComponent(exceptionId)}/resolve`, { method: "POST", body: { outcome, note, ...(tenantId !== undefined ? { tenantId } : {}) }, ...options });
				},

				/**
				 * Report vetting outcomes over a period (the last 30 days by default): counts by status, the straight-through rate,
				 * and the exception reasons. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.tenantId] - The vetting tenant (default "signalhouse")
				 * @param {string} [params.from] - Start of the period (ISO date)
				 * @param {string} [params.to] - End of the period (ISO date)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ tenantId, from, to, cases: { total, decided, byStatus }, straightThrough: { count, rate }, exceptionReasons }`
				 */
				getVettingReport: async ({ tenantId, from, to, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ tenantId, from, to });
					return this.client(`/vetting/report${queryString}`, { method: "GET", ...options });
				},
			};
		}
	}
}
