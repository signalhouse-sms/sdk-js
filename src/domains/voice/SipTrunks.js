/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} SipTrunkHost
 * @property {string} host - IP address, hostname, FQDN, or CIDR.
 * @property {string} [port] - Port number as a string (1025-65535). Destination hosts only.
 */

/**
 * @typedef {Object} CreateSipTrunkData
 * @property {string} name - Trunk name (required, 1-255 chars).
 * @property {string} region - SIP POP region the trunk lives in (required), e.g. "us-east-1".
 * @property {"IP_AUTH"|"REGISTRATION"} connectionType - IP_AUTH authenticates by source-IP allow-list; REGISTRATION authenticates via SIP REGISTER with username/password.
 * @property {string[]} [allowedIps] - Allowed source IPs (IP_AUTH only). Defaults to [].
 * @property {"tcp"|"udp"|"tls"} [transport] - SIP transport protocol. Defaults to "tcp".
 * @property {number} [maxSpendPerMinute] - Per-minute spend cap override for this trunk.
 * @property {SipTrunkHost[]} [destinationHosts] - Where to send outbound SIP traffic. Defaults to [].
 * @property {SipTrunkHost[]} [sourceHosts] - Allowed source hosts for inbound traffic. Defaults to [].
 */

/**
 * @typedef {Object} UpdateSipTrunkData
 * @property {string} [name] - Trunk name (1-255 chars).
 * @property {string} [region] - SIP POP region.
 * @property {"IP_AUTH"|"REGISTRATION"} [connectionType] - Connection/auth type.
 * @property {string[]} [allowedIps] - Allowed source IPs (IP_AUTH only).
 * @property {"tcp"|"udp"|"tls"} [transport] - SIP transport protocol.
 * @property {number} [maxSpendPerMinute] - Per-minute spend cap override.
 * @property {SipTrunkHost[]} [destinationHosts] - Outbound SIP destinations.
 * @property {SipTrunkHost[]} [sourceHosts] - Allowed inbound source hosts.
 */

/**
 * SIP Trunk management. Calls the Voice service mounted under /voice.
 * Accessed via `sdk.voice.sipTrunks`.
 */
export class SipTrunks {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List all SIP trunks belonging to the current account.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} The list of SIP trunks: `{ sipTrunks: [...] }`.
	 */
	async list({ options = {} } = {}) {
		return this.client(`/voice/sip-trunks`, { method: "GET", ...options });
	}

	/**
	 * Get a single SIP trunk by ID.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} The SIP trunk: `{ sipTrunk: {...} }`.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create a new SIP trunk.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {CreateSipTrunkData} params.trunkData - The SIP trunk to create.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If trunkData is missing.
	 * @returns {Promise<SdkResponse<any>>} The created SIP trunk: `{ sipTrunk: {...} }`.
	 */
	async create({ trunkData, options = {} }) {
		this.client._require({ trunkData });
		return this.client(`/voice/sip-trunks`, { method: "POST", body: trunkData, ...options });
	}

	/**
	 * Update an existing SIP trunk.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {UpdateSipTrunkData} params.updateData - Fields to update.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or updateData is missing.
	 * @returns {Promise<SdkResponse<any>>} The updated SIP trunk: `{ sipTrunk: {...} }`.
	 */
	async update({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}`, { method: "PATCH", body: updateData, ...options });
	}

	/**
	 * Delete a SIP trunk by ID.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success: boolean, message: string }`.
	 */
	async delete({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Toggle a SIP trunk's active/inactive status.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} The updated SIP trunk: `{ sipTrunk: {...} }`.
	 */
	async toggleActive({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}/toggle-active`, { method: "POST", ...options });
	}

	/**
	 * Regenerate the SIP password for a REGISTRATION-type trunk.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ password: string }`.
	 */
	async regeneratePassword({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}/regenerate-password`, { method: "POST", ...options });
	}

	/**
	 * List available SIP Points of Presence (POPs) and their domains/ports.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ sipPops: [...] }`.
	 */
	async getPops({ options = {} } = {}) {
		return this.client(`/voice/sip-trunks/pops`, { method: "GET", ...options });
	}

	/**
	 * Attach one or more phone numbers (by E.164) to a SIP trunk — routes each
	 * DID down the trunk. Idempotent; numbers already configured on a SIP profile
	 * are skipped and returned in `skipped` with a reason.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {string[]} params.phoneNumbers - Phone numbers in E.164 (a leading "+" is optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or phoneNumbers is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ assigned: string[], skipped: { e164, reason }[] }`.
	 */
	async assignNumbers({ id, phoneNumbers, options = {} }) {
		this.client._require({ id, phoneNumbers });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}/assign-numbers`, { method: "POST", body: { phoneNumbers }, ...options });
	}

	/**
	 * Detach one or more phone numbers (by E.164) from a SIP trunk — removes each
	 * number's SIP_TRUNK inbound route when it points at this trunk.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The SIP trunk UUID.
	 * @param {string[]} params.phoneNumbers - Phone numbers in E.164 (a leading "+" is optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or phoneNumbers is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ unassigned: string[] }`.
	 */
	async unassignNumbers({ id, phoneNumbers, options = {} }) {
		this.client._require({ id, phoneNumbers });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/sip-trunks/${safeId}/unassign-numbers`, { method: "POST", body: { phoneNumbers }, ...options });
	}
}
