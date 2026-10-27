/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateSubgroupData
 * @property {string} groupId - The ID of the parent group for the subgroup (must be at least 8 characters long and start with 'G')
 * @property {string} subgroupName - The name of the subgroup (required)
 * @property {string} [contactFirstName] - The first name of the contact person for the subgroup
 * @property {string} [contactLastName] - The last name of the contact person for the subgroup
 * @property {string} [contactMiddleName] - The middle name of the contact person for the subgroup
 * @property {string} [subgroupCompanyName] - The company name associated with the subgroup
 * @property {string} [addressLine1] - The first line of the address for the subgroup
 * @property {string} [addressLine2] - The second line of the address for the subgroup
 * @property {string} [city] - The city for the subgroup's address
 * @property {string} [state] - The state for the subgroup's address
 * @property {string} [country] - The country for the subgroup's address
 * @property {string} [postalCode] - The postal code for the subgroup's address
 * @property {string} [phone] - The phone number for the subgroup
 * @property {string} [carrierIdFamily] - Optional agency-managed carrier ID selection ("Default", "ATT", "TMobile", "Verizon", "USCellular", "GoogleVoice", "ClearSky", "Interop"). Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {string|null} [carrierIdRegion] - Optional ClearSky region ("PRClaro", "GuamDocomo", "GuamGTA", "GuamITE") or null; only valid when carrierIdFamily is "ClearSky". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 */

/**
 * @typedef {Object} UpdateSubgroupData
 * @property {string} [subgroupName] - The name of the subgroup
 * @property {string} [contactFirstName] - The first name of the contact person for the subgroup
 * @property {string} [contactLastName] - The last name of the contact person for the subgroup
 * @property {string} [contactMiddleName] - The middle name of the contact person for the subgroup
 * @property {string} [subgroupCompanyName] - The company name associated with the subgroup
 * @property {string} [addressLine1] - The first line of the address for the subgroup
 * @property {string} [addressLine2] - The second line of the address for the subgroup
 * @property {string} [city] - The city for the subgroup's address
 * @property {string} [state] - The state for the subgroup's address
 * @property {string} [country] - The country for the subgroup's address
 * @property {string} [postalCode] - The postal code for the subgroup's address
 * @property {string} [phone] - The phone number for the subgroup
 * @property {string} [status] - The status of the subgroup (e.g., "active", "inactive")
 * @property {string} [carrierIdFamily] - Optional agency-managed carrier ID selection ("Default", "ATT", "TMobile", "Verizon", "USCellular", "GoogleVoice", "ClearSky", "Interop"). Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {string|null} [carrierIdRegion] - Optional ClearSky region ("PRClaro", "GuamDocomo", "GuamGTA", "GuamITE") or null; only valid when carrierIdFamily is "ClearSky". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {boolean} [cnamAutoApply] - Turn caller name (CNAM) auto-apply on or off: eligible numbers get their brand's registered name as the name shown on outbound calls. Requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin or developer role.
 * @property {string|null} [cnamBrandId] - Default caller-ID brand for numbers with no campaign (e.g. voice-only). Must be a verified brand in this subgroup; required when turning auto-apply on in a subgroup with more than one verified brand.
 */

export class Subgroups {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get a list of subgroups with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting subgroups
	 * @param {string} [params.id] - Filter by subgroup ID
	 * @param {string} [params.groupId] - Filter by parent group ID
	 * @param {number} [params.page] - The page number for pagination
	 * @param {number} [params.limit] - The number of items per page for pagination
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The list of subgroups returned from the server
	 */
	async getSubgroups({ id, groupId, page, limit, options = {} }) {
		const filters = { id, groupId, page, limit };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/subgroup${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get resource counts grouped by subgroup ID. Only signalhouse_admin can query all groups;
	 * every other allowed role is restricted to its JWT group scope.
	 * @async
	 * @roles signalhouse, api, admin, developer, billing, user
	 * @param {Object} [params={}] - Optional count filters.
	 * @param {string} [params.groupId] - Restrict results to a group.
	 * @param {string} [params.subgroupId] - Restrict results to a subgroup.
	 * @param {number} [params.limit] - Maximum rows to return.
	 * @param {number} [params.offset] - Rows to skip; requires limit.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} - Subgroup-level resource count rows.
	 */
	async getSubgroupCounts({ groupId, subgroupId, limit, offset, options = {} } = {}) {
		const queryString = this.client._getQueryString({ groupId, subgroupId, limit, offset });
		return this.client(`/subgroup/counts${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Create a new subgroup with the specified subgroup data
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for creating a subgroup (see CreateSubgroupData typedef for details)
	 * @param {CreateSubgroupData} params.subgroupData - The data for the subgroup to be created, including required fields such as groupId and subgroupName
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the subgroupData parameter is missing or if required fields in subgroupData are missing
	 * @returns {Promise<SdkResponse<any>>} - The created subgroup object returned from the server
	 */
	async createSubgroup({ subgroupData, options = {} }) {
		this.client._require({ subgroupData: subgroupData });
		return this.client(`/subgroup`, { method: "POST", body: subgroupData, ...options });
	}

	/**
	 * Update an existing subgroup with the specified subgroup data
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for updating a subgroup (see UpdateSubgroupData typedef for details)
	 * @param {string} params.id - The ID of the subgroup to update
	 * @param {UpdateSubgroupData} params.updateData - The data for the subgroup to be updated, including fields such as subgroupName, contact information, and status
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id or updateData parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The updated subgroup object returned from the server
	 */
	async updateSubgroup({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/subgroup/${safeId}`, { method: "PUT", body: updateData, ...options });
	}

	/**
	 * Delete a subgroup by its ID (mark as inactive)
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for deleting a subgroup
	 * @param {string} params.id - The ID of the subgroup to delete
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The deleted subgroup object returned from the server
	 */
	async deleteSubgroup({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/subgroup/${safeId}`, { method: "DELETE", ...options });
	}
}
