/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Groups {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
					 * Get resource counts grouped by group ID. Only signalhouse_admin can query all groups;
					 * every other allowed role is restricted to its JWT group scope.
				 * @async
					 * @roles signalhouse, api, admin, developer, billing, user
				 * @param {Object} [params] - Optional group-count filters and pagination.
				 * @param {string} [params.groupId] - Restrict results to a group.
				 * @param {number} [params.limit] - Maximum rows to return.
				 * @param {number} [params.offset] - Rows to skip; requires limit.
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @returns {Promise<SdkResponse<any>>} - Group-level resource count rows.
				 */
				getGroupCounts: async ({ groupId, limit, offset, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ groupId, limit, offset });
					return this.client(`/group/counts${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Get a list of all groups with optional pagination parameters
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for getting groups
				 * @param {number} [params.page] - The page number for pagination
				 * @param {number} [params.limit] - The number of items per page
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - The list of groups returned from the server
				 */
				getGroups: async ({ page, limit, options = {} }) => {
					const filters = { page, limit };
					const queryString = this.client._getQueryString(filters);
					return this.client(`/group${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Create a new group with the specified group data
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for creating a new group
				 * @param {Object} params.groupData - The data for the new group, including required fields such as groupName. Optionally accepts `psPartnerKey` and `ownerEmail` to credit a referring partner.
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupData parameter is missing or if required fields within groupData are missing
				 * @returns {Promise<SdkResponse<any>>} - The created group object returned from the server
				 */
				createGroup: async ({ groupData, options = {} }) => {
					this.client._require({ groupData: groupData });
					return this.client(`/group`, { method: "POST", body: groupData, ...options });
				},

				/**
				 * Record a GHL-app or Shopify-app install's registration for the per-surface
				 * customer-lifecycle webhook system. Call this right after admin.createGroup when
				 * provisioning a group outside the Portal's self-registration flow (which records
				 * itself automatically) — without it, the group never fires a registration webhook and
				 * is never eligible for the "registered but no brand submitted" staleness webhook.
				 * @async
				 * @roles signalhouse_api, signalhouse_admin
				 * @param {Object} params - The parameters for recording a registration
				 * @param {string} params.groupId - The just-provisioned group's ID
				 * @param {string} params.registrationSource - Which surface provisioned this group ("ghl" or "shopify")
				 * @param {string} [params.firstName] - The account owner's first name
				 * @param {string} [params.fullName] - The account owner's full name
				 * @param {string} [params.email] - The account owner's email
				 * @param {string} [params.phone] - The account owner's phone number
				 * @param {string} [params.estimatedVolume] - Estimated monthly message volume
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or registrationSource parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - `{ success: true }`
				 */
				recordLifecycleRegistration: async ({ groupId, registrationSource, firstName, fullName, email, phone, estimatedVolume, options = {} }) => {
					this.client._require({ groupId, registrationSource });
					return this.client(`/group/lifecycle/registration`, {
						method: "POST",
						body: { groupId, registrationSource, firstName, fullName, email, phone, estimatedVolume },
						...options,
					});
				},

				/**
				 * Delete a group with the specified group ID
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for deleting a group
				 * @param {string} params.groupId - The ID of the group to delete
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The deleted group object returned from the server
				 */
				deleteGroup: async ({ groupId, options = {} }) => {
					this.client._require({ groupId });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/${safeGroupId}`, { method: "DELETE", ...options });
				},

				/**
				 * Set a group's KYC complianceStatus. Only flips the field — it does not
				 * trigger any lockout side effects (halted sends, revoked API keys, etc.) for "rejected".
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for updating a group's compliance status
				 * @param {string} params.groupId - The ID of the group to update
				 * @param {string} params.complianceStatus - One of "unverified", "pending", "verified", "rejected"
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId or complianceStatus parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The updated group object returned from the server
				 */
				updateComplianceStatus: async ({ groupId, complianceStatus, options = {} }) => {
					this.client._require({ groupId, complianceStatus });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/group/${safeGroupId}/compliance-status`, { method: "PUT", body: { complianceStatus }, ...options });
				},

				/**
				 * Link an external tenant (GHL/Shopify) to a V2 group (server-to-server). Exchanges a
				 * single-use link token for a canonical group, adopting an empty portal group, repointing
				 * to an existing group, or flagging for manual review.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for linking an external account
				 * @param {string} params.linkToken - The single-use external-link token minted by the portal user
				 * @param {string} params.externalSystem - The external system ("ghl" or "shopify")
				 * @param {string} params.externalId - The external tenant identifier
				 * @param {string} [params.existingGroupId] - An existing V2 group ID to repoint to, if any
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if linkToken, externalSystem, or externalId is missing
				 * @returns {Promise<SdkResponse<any>>} - The link outcome ({ status, canonicalGroupId, ... })
				 */
				linkExternal: async ({ linkToken, externalSystem, externalId, existingGroupId, options = {} }) => {
					this.client._require({ linkToken, externalSystem, externalId });
					return this.client(`/group/link-external`, {
						method: "POST",
						body: { linkToken, externalSystem, externalId, ...(existingGroupId ? { existingGroupId } : {}) },
						...options,
					});
				},
			};
		}
	}

	/**
	 * Get details of a group by its ID
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a group
	 * @param {string} params.id - The ID of the group to retrieve
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The group object returned from the server
	 */
	async getGroup({ id, options = {} }) {
		const filters = { id };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/group${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Update a group with the specified group data
	 * @async
	 * @roles api, admin, developer, billing
	 * @param {Object} params - The parameters for updating a group
	 * @param {string} params.id - The ID of the group to update
	 * @param {Object} params.groupData - The data for the group, including required fields such as groupName. A group admin can set requireTwoFactor (boolean) to require 2FA for every member.
	 *   Optional CNP fields: cspId (string|null), defaultCnpSubgroupId (string|null)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the id or groupData parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The updated group object returned from the server
	 */
	async updateGroup({ id, groupData, options = {} }) {
		this.client._require({ id, groupData: groupData });
		const safeId = encodeURIComponent(id);
		return this.client(`/group/${safeId}`, { method: "PUT", body: groupData, ...options });
	}

	/**
	 * Get a group's Enterprise SSO configuration: whether SSO is available, the redirect URL to register at
	 * the identity provider, the saved provider (never its client secret), and each claimed domain with the
	 * DNS TXT record that verifies it
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - { groupId, available, callbackUrl, connection, domains }
	 */
	async getSsoConfiguration({ groupId, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId });
		return this.client(`/group/sso${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Create or update a group's OpenID Connect identity provider. Requires a fresh
	 * auth.confirmTwoFactorIdentity from the same session
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {string} params.issuer - The provider's https issuer URL
	 * @param {string} params.clientId - The client ID registered at the provider
	 * @param {string} [params.clientSecret] - The client secret; required the first time, omit to keep the saved one
	 * @param {boolean} [params.enabled] - Whether sign-in through the provider is on (default true)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The SSO configuration
	 */
	async saveSsoConnection({ groupId, issuer, clientId, clientSecret, enabled, options = {} }) {
		this.client._require({ groupId, issuer, clientId });
		return this.client(`/group/sso`, { method: "PUT", body: { groupId, issuer, clientId, clientSecret, enabled }, ...options });
	}

	/**
	 * Remove a group's identity provider and its domains, and unlink every account that signed in through it.
	 * Requires a fresh auth.confirmTwoFactorIdentity from the same session
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The (now empty) SSO configuration
	 */
	async deleteSsoConnection({ groupId, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId });
		return this.client(`/group/sso${queryString}`, { method: "DELETE", ...options });
	}

	/**
	 * Claim an email domain for a group's SSO; the response includes the DNS TXT record that verifies it
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {string} params.domain - The domain, e.g. "acme.com"
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The SSO configuration
	 */
	async addSsoDomain({ groupId, domain, options = {} }) {
		this.client._require({ groupId, domain });
		return this.client(`/group/sso/domains`, { method: "POST", body: { groupId, domain }, ...options });
	}

	/**
	 * Verify a claimed domain by its DNS TXT record
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {string} params.domain - The claimed domain
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The SSO configuration
	 */
	async verifySsoDomain({ groupId, domain, options = {} }) {
		this.client._require({ groupId, domain });
		return this.client(`/group/sso/domains/${encodeURIComponent(domain)}/verify`, { method: "POST", body: { groupId }, ...options });
	}

	/**
	 * Remove a domain from a group's SSO
	 * @async
	 * @roles admin
	 * @param {Object} params
	 * @param {string} params.groupId - The group
	 * @param {string} params.domain - The domain
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The SSO configuration
	 */
	async removeSsoDomain({ groupId, domain, options = {} }) {
		this.client._require({ groupId, domain });
		const queryString = this.client._getQueryString({ groupId });
		return this.client(`/group/sso/domains/${encodeURIComponent(domain)}${queryString}`, { method: "DELETE", ...options });
	}
}
