/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Tickets {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain (staff-only customer ticket → Jira)
		if (enableAdmin) {
			this.admin = {
				/**
				 * Load Jira form metadata (issue types, priorities, active sprint, field IDs). Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params] - Optional parameters
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - Jira form metadata
				 */
				getJiraMetadata: async ({ options = {} } = {}) => {
					return this.client(`/admin/ticket/jira/metadata`, { method: "GET", ...options });
				},

				/**
				 * Search open epics for the parent picker. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.query] - Optional epic summary/key filter
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ epics: Array<{ id, key, summary }> }`
				 */
				searchJiraEpics: async ({ query, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ query });
					return this.client(`/admin/ticket/jira/epics${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Search open non-Epic, non-Subtask issues for the Subtask parent picker. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.query] - Optional issue summary/key filter
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ issues: Array<{ id, key, summary }> }`
				 */
				searchJiraParentIssues: async ({ query, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ query });
					return this.client(`/admin/ticket/jira/parent-issues${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Search assignable Jira users for the assignee picker. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.query] - Partial name or email
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ users: Array<{ accountId, displayName, emailAddress }> }`
				 */
				searchJiraAssignees: async ({ query, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ query });
					return this.client(`/admin/ticket/jira/assignees${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Suggest Jira labels matching a query. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params]
				 * @param {string} [params.query] - Partial label text
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ labels: string[] }`
				 */
				searchJiraLabels: async ({ query, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ query });
					return this.client(`/admin/ticket/jira/labels${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Create a Jira ticket from the admin customer ticket form. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {Object} params.data - Create payload (groupId, issueTypeId, priorityId, summary required)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the data parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - Created ticket summary (key, browseUrl, reporter, etc.)
				 */
				createJiraTicket: async ({ data, options = {} }) => {
					this.client._require({ data });
					return this.client(`/admin/ticket/jira`, { method: "POST", body: data, ...options });
				},
			};
		}
	}
}
