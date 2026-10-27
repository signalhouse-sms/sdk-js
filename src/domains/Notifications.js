/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Notifications {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get notifications by id or by groupId with optional filters
	 * @async
	 * @roles signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} [params.id] - Notification id (one of id/groupId required)
	 * @param {string} [params.groupId] - Group id to fetch notifications for (one of id/groupId required)
	 * @param {number} [params.page] - Page number (min 1, default 1)
	 * @param {number} [params.limit] - Results per page (min 1, max 100, default 10)
	 * @param {string} [params.status] - Filter by status: "READ" or "UNREAD"
	 * @param {string|string[]} [params.eventTypes] - Event types to filter by (comma-separated string or array)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getNotifications({ id, groupId, page, limit, status, eventTypes, options = {} }) {
		this.client._require({ "id or groupId": id ?? groupId });
		const queryString = this.client._getQueryString({ id, groupId, page, limit, status, eventTypes });
		return this.client(`/notification${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Update the status of one or more notifications
	 * @async
	 * @roles signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string|string[]} params.ids - Notification id or array of notification ids
	 * @param {string} params.status - New status: "READ" or "UNREAD"
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async updateNotificationStatus({ ids, status, options = {} }) {
		this.client._require({ ids, status });
		return this.client(`/notification/status`, { method: "PUT", body: { ids, status }, ...options });
	}

	/**
	 * Delete a notification by id
	 * @async
	 * @roles signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.id - The notification id to delete
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async deleteNotification({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/notification/${safeId}`, { method: "DELETE", ...options });
	}
}
