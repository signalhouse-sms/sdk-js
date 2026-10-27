/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateUserData
 * @property {string} groupId - The ID of the group to which the user belongs (must start with "G" and be at least 8 characters long)
 * @property {string} role - The role of the user (admin, developer, billing, user)
 * @property {string} password - The password for the user (must be at least 8 characters long)
 * @property {string} email - The email address of the user (must be a valid email format)
 * @property {string} [firstName] - The first name of the user (optional)
 * @property {string} [lastName] - The last name of the user (optional)
 * @property {string} [companyName] - The company name associated with the user (optional)
 * @property {string} [phone] - The phone number of the user (optional)
 * @property {string} [profileImageLink] - A URL to the user's profile image (optional, must be a valid URL format if provided)
 * @property {string} [addressLine1] - The first line of the user's address (optional)
 * @property {string} [addressLine2] - The second line of the user's address (optional)
 * @property {string} [city] - The city of the user's address (optional)
 * @property {string} [state] - The state of the user's address (optional)
 * @property {string} [country] - The country of the user's address (optional)
 * @property {string} [postalCode] - The postal code of the user's address (optional)
 * @property {string} [signupSource] - The source from which the user signed up (optional)
 */

/**
 * @typedef {Object} CreateServiceUserData
 * @property {string} groupId - The ID of the group to which the service user belongs (required for customer API keys)
 * @property {string} name - The name of the service user (required)
 * @property {string} role - The role of the service user: "api" for a customer API key (required)
 * @property {string[]} [allowedIps] - Only accept this API key from these IPv4/IPv6 addresses or CIDR ranges (max 100). Omit or pass [] for no IP restriction. Customer API keys only.
 * @property {string[]} [allowedCountries] - Only accept this API key from these countries, as ISO 3166-1 alpha-2 codes such as "US" (max 250). Omit or pass [] for no country restriction. Customer API keys only.
 * @property {string[]} [allowedDestinationCountries] - Only let this API key send messages to these countries, as ISO 3166-1 alpha-2 codes such as "US" (max 250). Sends to any other country are rejected with a 403 DESTINATION_COUNTRY_NOT_ALLOWED. Omit or pass [] for any country. Customer API keys only.
 */

/**
 * @typedef {Object} UpdateUserData
 * @property {string} [role] - The role of the user (admin, developer, billing, user)
 * @property {string} [email] - The email address of the user (must be a valid email format if provided)
 * @property {string} [firstName] - The first name of the user (optional)
 * @property {string} [lastName] - The last name of the user (optional)
 * @property {string} [companyName] - The company name associated with the user (optional)
 * @property {string} [phone] - The phone number of the user (optional)
 * @property {string} [profileImageLink] - A URL to the user's profile image (optional, must be a valid URL format if provided)
 * @property {string} [addressLine1] - The first line of the user's address (optional)
 * @property {string} [addressLine2] - The second line of the user's address (optional)
 * @property {string} [city] - The city of the user's address (optional)
 * @property {string} [state] - The state of the user's address (optional)
 * @property {string} [country] - The country of the user's address (optional)
 * @property {string} [postalCode] - The postal code of the user's address (optional)
 * @property {string} [status] - The status of the user (e.g., "active", "inactive")
 * @property {string[]} [allowedIps] - Customer API keys only: replace the key's allowed IPv4/IPv6 addresses or CIDR ranges ([] removes the restriction). Requires an interactive admin or developer session; an API key cannot change its own restrictions.
 * @property {string[]} [allowedCountries] - Customer API keys only: replace the key's allowed ISO 3166-1 alpha-2 country codes ([] removes the restriction). Requires an interactive admin or developer session.
 * @property {string[]} [allowedDestinationCountries] - Customer API keys only: replace the countries the key may send messages to ([] allows any country). Requires an interactive admin or developer session.
 */

export class Users {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		if (enableAdmin) {
			this.admin = {
				/**
				 * Get a list of users with optional filters.
				 * @roles signalhouse
				 * @param {Object} params - The parameters for getting users
				 * @param {string} [params.email] - Filter users by email (partial match)
				 * @param {string} [params.userType] - Filter users by type (user, service)
				 * @param {number} [params.page] - Page number for pagination
				 * @param {number} [params.limit] - Items per page
				 * @param {string} [params.search] - Search users by email (case-insensitive)
				 * @param {string} [params.sortBy] - Field to sort by (createdAt, email, activeGroupId, companyName, status, _id)
				 * @param {string} [params.sortOrder] - Sort direction (asc, desc)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the list of users
				 */
				getUsers: async ({ email, userType, page, limit, search, sortBy, sortOrder, options = {} }) => {
					const filters = { email, userType, page, limit, search, sortBy, sortOrder };
					const queryString = this.client._getQueryString(filters);
					return this.client(`/user${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Create a new internal user (admin or service user) with the specified data.
				 * @roles signalhouse
				 * @param {Object} params - The parameters for creating an internal user
				 * @param {CreateServiceUserData} params.data - The data for the new internal user
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the created internal user
				 */
				createInternalUser: async ({ data, options = {} }) => {
					this.client._require({ data: data });
					return this.client(`/user/signalhouse`, { method: "POST", body: data, ...options });
				},
			};
		}
	}

	/**
	 * Get a list of users with optional filters
	 * @async
	 * @roles api, admin, self
	 * @param {Object} params - The parameters for getting users
	 * @param {string} [params.id] - Filter by user ID
	 * @param {string} [params.groupId] - Filter by group ID
	 * @param {string} [params.userType] - Filter by user type (user, service)
	 * @param {number} [params.page] - Page number for pagination
	 * @param {number} [params.limit] - Items per page
	 * @param {string} [params.search] - Search users by email (case-insensitive)
	 * @param {string} [params.sortBy] - Field to sort by (createdAt, email, activeGroupId, companyName, status, _id)
	 * @param {string} [params.sortOrder] - Sort direction (asc, desc)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the list of users
	 */
	async getUsers({ id, groupId, userType, page, limit, search, sortBy, sortOrder, options = {} }) {
		const filters = { id, groupId, userType, page, limit, search, sortBy, sortOrder };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/user${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Create a new user with the specified user data
	 * @async
	 * @roles api, admin
	 * @param {Object} params - The parameters for creating a user (see CreateUserData typedef for details)
	 * @param {CreateUserData} params.data - The data for the new user
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if required fields in the data parameter are missing
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the created user
	 */
	async createUser({ data, options = {} }) {
		this.client._require({ data: data });
		return this.client(`/user`, { method: "POST", body: data, ...options });
	}

	/**
	 * Create a new service user with the specified user data. Used for creating API keys and other non-human users.
	 * @async
	 * @roles admin, developer
	 * @param {Object} params - The parameters for creating a service user (see CreateServiceUserData typedef for details)
	 * @param {CreateServiceUserData} params.data - The data for the new service user
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if required fields in the data parameter are missing
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the created service user
	 */
	async createServiceUser({ data, options = {} }) {
		this.client._require({ data: data });
		return this.client(`/user/serviceuser`, { method: "POST", body: data, ...options });
	}

	/**
	 * Update an existing user's information with the specified user data
	 * @async
	 * @roles api, admin, self
	 * @param {Object} params - The parameters for updating a user (see UpdateUserData typedef for details)
	 * @param {string} params.id - The ID of the user to update
	 * @param {UpdateUserData} params.data - The data to update for the user
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if required fields in the data parameter are missing
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the updated user
	 */
	async updateUser({ id, data, options = {} }) {
		this.client._require({ id, data: data });
		const safeId = encodeURIComponent(id);
		return this.client(`/user/${safeId}`, { method: "PUT", body: data, ...options });
	}

	/**
	 * Delete a user by their ID (mark as inactive)
	 * @async
	 * @roles api, admin
	 * @param {Object} params - The parameters for deleting a user
	 * @param {string} params.id - The ID of the user to delete
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - A promise that resolves to the deleted user
	 */
	async deleteUser({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/user/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Accept the Terms of Service for the authenticated caller (self-service).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ acceptedTermsOfService: true })
	 */
	async acceptTermsOfService({ options = {} } = {}) {
		return this.client(`/user/accept-terms`, { method: "PUT", body: { acceptedTermsOfService: true }, ...options });
	}

	/**
	 * Get notification preferences for a user
	 * @async
	 * @roles api, admin, self
	 * @param {Object} params
	 * @param {string} params.id - The ID of the user
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getNotificationPreferences({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/user/${safeId}/notification-preferences`, { method: "GET", ...options });
	}

	/**
	 * Update notification preferences for a user
	 * @async
	 * @roles api, admin, self
	 * @param {Object} params
	 * @param {string} params.id - The ID of the user
	 * @param {Array<{name: string, web: boolean, email: boolean}>} params.notificationPreferences - Array of notification preference objects
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async updateNotificationPreferences({ id, notificationPreferences, options = {} }) {
		this.client._require({ id, notificationPreferences });
		const safeId = encodeURIComponent(id);
		return this.client(`/user/${safeId}/notification-preferences`, { method: "PUT", body: { notificationPreferences }, ...options });
	}
}
