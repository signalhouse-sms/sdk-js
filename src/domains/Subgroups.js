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
 * @property {string} [carrierIdFamily] - Deprecated: accepted and stored, with no effect on billing. One of "Default", "ATT", "TMobile", "Verizon", "USCellular", "GoogleVoice", "ClearSky", "Interop". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {string|null} [carrierIdRegion] - Deprecated: accepted and stored, with no effect on billing. ClearSky region ("PRClaro", "GuamDocomo", "GuamGTA", "GuamITE") or null; only valid when carrierIdFamily is "ClearSky". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
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
 * @property {string} [carrierIdFamily] - Deprecated: accepted and stored, with no effect on billing. One of "Default", "ATT", "TMobile", "Verizon", "USCellular", "GoogleVoice", "ClearSky", "Interop". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {string|null} [carrierIdRegion] - Deprecated: accepted and stored, with no effect on billing. ClearSky region ("PRClaro", "GuamDocomo", "GuamGTA", "GuamITE") or null; only valid when carrierIdFamily is "ClearSky". Setting this field requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin, developer, or billing role.
 * @property {boolean} [cnamAutoApply] - Turn caller name (CNAM) auto-apply on or off: eligible numbers get their brand's registered name as the name shown on outbound calls. Requires signalhouse_api, signalhouse_admin, signalhouse_user, api, admin or developer role.
 * @property {string|null} [cnamBrandId] - Default caller-ID brand for numbers with no campaign (e.g. voice-only). Must be a verified brand in this subgroup; required when turning auto-apply on in a subgroup with more than one verified brand.
 */

export class Subgroups {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Link (or, with ghlLocationId: null, unlink) a GoHighLevel location to a subgroup. At most
				 * one subgroup may hold a given ghlLocationId; linking it here steals it from any other
				 * subgroup that currently holds it. Intended for ghl-app/backend's write-through right after
				 * it locally claims a location -> subgroup link.
				 * @async
				 * @roles signalhouse_api, signalhouse_admin
				 * @param {Object} params - The parameters for linking a GHL location
				 * @param {string} params.subgroupId - The subgroup to link
				 * @param {string|null} params.ghlLocationId - The GHL location ID to link, or null to unlink
				 * @param {string|null} [params.ghlLocationName] - Display name of the GHL location. Omit to leave the
				 *   subgroup's currently stored name untouched (only when ghlLocationId is unchanged - otherwise
				 *   cleared to null); always cleared to null when unlinking
				 * @param {Date|string} [params.claimedAt] - When this link was locally claimed by the caller.
				 *   Required when linking (ghlLocationId is non-null) - used to detect and reject a delayed/
				 *   out-of-order push whose claim has since been superseded by a newer one recorded elsewhere.
				 *   Ignored when unlinking.
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the subgroupId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated subgroup object returned from the server
				 */
				linkGhlLocation: async ({ subgroupId, ghlLocationId, ghlLocationName, claimedAt, options = {} }) => {
					this.client._require({ subgroupId });
					return this.client(`/subgroup/ghl-location-link`, { method: "PUT", body: { subgroupId, ghlLocationId, ghlLocationName, claimedAt }, ...options });
				},
			};
		}
	}

	/**
	 * Get a list of subgroups with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting subgroups
	 * @param {string} [params.id] - Filter by subgroup ID
	 * @param {string} [params.groupId] - Filter by parent group ID
	 * @param {string|string[]} [params.search] - Search terms, each sent as its own `search` key; every term must match. Free text matches subgroupId, subgroupName and subgroupCompanyName; `field:term` searches one of those fields. Each term is 3 to 100 characters, at most 5 terms.
	 * @param {number} [params.page] - The page number for pagination
	 * @param {number} [params.limit] - The number of items per page for pagination
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The list of subgroups returned from the server
	 */
	async getSubgroups({ id, groupId, search, page, limit, options = {} }) {
		const filters = { id, groupId, search, page, limit };
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
	 * Resolve the mapping between a GoHighLevel location and a Signal House subgroup, in either
	 * direction. Provide exactly one of ghlLocationId or subgroupId. groupId is optional - customer
	 * roles default to their own accessible group(s) and are rejected if they name a group they don't
	 * belong to; a subgroupId/ghlLocationId that belongs to a different group than the caller's returns
	 * a 404, identical to a nonexistent one.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the lookup
	 * @param {string} [params.groupId] - Restrict the lookup to an accessible group ID
	 * @param {string} [params.ghlLocationId] - GHL location ID to resolve to its subgroup (mutually exclusive with subgroupId)
	 * @param {string} [params.subgroupId] - Subgroup ID to resolve to its GHL location (mutually exclusive with ghlLocationId)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - `{ groupId, subgroupId, subgroupName, ghlLocationId, ghlLocationName }`
	 */
	async lookupGhlLocation({ groupId, ghlLocationId, subgroupId, options = {} } = {}) {
		const queryString = this.client._getQueryString({ groupId, ghlLocationId, subgroupId });
		return this.client(`/subgroup/ghl-location-lookup${queryString}`, { method: "GET", ...options });
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
