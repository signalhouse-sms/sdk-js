/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Audit domain: the staff read of who changed a registration or a message template, and what changed. Every method lives
 * under the admin namespace, present only when the SDK is created with `enableAdmin: true`.
 */
export class Audit {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Get audit events, newest first: one registration's or template's, or a group's. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {("registration"|"template")} [params.entityType] - The entity type; required with entityId
				 * @param {string} [params.entityId] - The registration id or template id
				 * @param {string} [params.groupId] - The owning group; required when entityId is omitted
				 * @param {number} [params.page] - Page number (default 1)
				 * @param {number} [params.limit] - Events per page (default 25, max 100)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ data, total, page, limit }`; each event is `{ _id, occurredAt, actor: { type, userId, role }, entity: { type, id, groupId }, action, changes: [{ path, from, to }] }`
				 */
				getAuditEvents: async ({ entityType, entityId, groupId, page, limit, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ entityType, entityId, groupId, page, limit });
					return this.client(`/audit${queryString}`, { method: "GET", ...options });
				},
			};
		}
	}
}
