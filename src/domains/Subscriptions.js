/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Subscriptions {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		if (enableAdmin) {
			this.admin = {
				/**
				 * Get subscription templates with optional filtering by template ID
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for getting subscription templates
				 * @param {string} [params.templateId] - The ID of a specific template to retrieve (optional)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The subscription templates returned from the server
				 */
				getTemplates: async ({ templateId, options = {} }) => {
					const filters = { templateId };
					const queryString = this.client._getQueryString(filters);
					return this.client(`/subscription/template${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Create a new subscription template with the provided template data
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for creating a subscription template
				 * @param {Object} params.templateData - The data for the new subscription template, including required fields such as templateName and monthlyFee
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the templateData parameter is missing or if required fields within templateData are missing
				 * @returns {Promise<SdkResponse<any>>} - The created subscription template object returned from the server
				 */
				createTemplate: async ({ templateData, options = {} }) => {
					this.client._require({ templateData: templateData });
					return this.client(`/subscription/template`, { method: "POST", body: templateData, ...options });
				},

				/**
				 * Update an existing subscription template with the provided template data
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for updating a subscription template
				 * @param {string} params.templateId - The ID of the subscription template to update
				 * @param {Object} params.templateData - The data for the subscription template, including fields such as templateName and monthlyFee
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the templateId or templateData parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated subscription template object returned from the server
				 */
				updateTemplate: async ({ templateId, templateData, options = {} }) => {
					this.client._require({ templateId, templateData });
					const safeTemplateId = encodeURIComponent(templateId);
					return this.client(`/subscription/template/${safeTemplateId}`, { method: "PUT", body: templateData, ...options });
				},

				/**
				 * Delete an existing subscription template
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for deleting a subscription template
				 * @param {string} params.templateId - The ID of the subscription template to delete
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the templateId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The deleted subscription template object returned from the server
				 */
				deleteTemplate: async ({ templateId, options = {} }) => {
					this.client._require({ templateId });
					const safeTemplateId = encodeURIComponent(templateId);
					return this.client(`/subscription/template/${safeTemplateId}`, { method: "DELETE", ...options });
				},

				/**
				 * Create a custom subscription for a group with the provided subscription data.
				 * Optional volumeTiers, rampDays, and monthlyMinimumSmsSegments enable graduated SMS rates and a monthly minimum that ramps up linearly over rampDays.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for creating a custom subscription
				 * @param {string} params.groupId - The ID of the group to create the custom subscription for
				 * @param {Object} params.subscriptionData - The data for the custom subscription, including required fields such as name and monthlyFee
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or subscriptionData parameter is missing or if required fields within subscriptionData are missing
				 * @returns {Promise<SdkResponse<any>>} - The created custom subscription object returned from the server
				 */
				createCustomSubscription: async ({ groupId, subscriptionData, options = {} }) => {
					this.client._require({ groupId, subscriptionData });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/subscription/user/custom/${safeGroupId}`, { method: "POST", body: subscriptionData, ...options });
				},

				/**
				 * Update volume tiers, ramp, and monthly minimum on an active custom subscription
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for updating the custom subscription
				 * @param {string} params.groupId - The ID of the group whose custom subscription to update
				 * @param {Object} params.updateData - Fields to change (name, description, monthlyFee, volumeTiers, monthlyMinimumSmsSegments, rampDays)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or updateData parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated custom subscription object returned from the server
				 */
				updateCustomSubscription: async ({ groupId, updateData, options = {} }) => {
					this.client._require({ groupId, updateData });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/subscription/user/custom/${safeGroupId}`, { method: "PUT", body: updateData, ...options });
				},
			};
		}
	}

	/**
	 * Get a list of subscription history for a group, with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting subscription history
	 * @param {string} params.groupId - The ID of the group to get subscription history for
	 * @param {boolean} [params.onlyActive] - Whether to only include active subscriptions
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The subscription history returned from the server
	 */
	async getSubscriptions({ groupId, onlyActive, options = {} }) {
		const filters = { groupId, onlyActive };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/subscription/user${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Subscribe a group to a template
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for subscribing a group to a template
	 * @param {string} params.groupId - The ID of the group to subscribe
	 * @param {string} params.templateId - The ID of the template to subscribe the group to
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId or templateId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The subscription object returned from the server
	 */
	async subscribe({ groupId, templateId, options = {} }) {
		this.client._require({ groupId, templateId });
		const safeGroupId = encodeURIComponent(groupId);
		const safeTemplateId = encodeURIComponent(templateId);
		return this.client(`/subscription/user/subscribe/${safeGroupId}/${safeTemplateId}`, { method: "POST", body: {}, ...options });
	}

	/**
	 * Unsubscribe a group from a template
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for unsubscribing a group from a template
	 * @param {string} params.groupId - The ID of the group to unsubscribe
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The subscription object returned from the server
	 */
	async unsubscribe({ groupId, options = {} }) {
		this.client._require({ groupId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/subscription/user/cancel/${safeGroupId}`, { method: "POST", ...options });
	}
}
