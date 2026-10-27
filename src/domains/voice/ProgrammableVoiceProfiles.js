/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateProgrammableVoiceProfileData
 * @property {string} name - Profile name (required).
 * @property {string[]} subgroupIds - Subgroups this profile spans (required, at least one).
 * @property {string} [region] - Region/POP label.
 * @property {"FORWARD"|"WEBRTC"|"SIP_TRUNK"|"SIP_PROFILE"|"CALL_CONTROL"|"AI"} [routeAction] - Inbound call action (default "FORWARD"). Deliver the call to a PSTN number (FORWARD), ring the profile's subgroup registered softphones (WEBRTC), send to a SIP trunk (SIP_TRUNK), ring a registered SIP endpoint (SIP_PROFILE), hand the call to your programmable call-control webhook that returns SHML (CALL_CONTROL), or answer it with an AI agent (AI).
 * @property {string} [forwardToE164] - Destination number, required when routeAction is "FORWARD".
 * @property {number} [forwardAfterSeconds] - Ring seconds before the action fires.
 * @property {string} [routeSipTrunkId] - SIP trunk id, required when routeAction is "SIP_TRUNK".
 * @property {string} [routeSipProfileId] - SIP endpoint id, required when routeAction is "SIP_PROFILE".
 * @property {string} [webhookUrl] - Your inbound voice webhook (SHML program URL), required when routeAction is "CALL_CONTROL". Inbound calls to this profile's numbers are driven by the SHML your webhook returns.
 * @property {string} [routeAgentProfileId] - AI agent profile id (AGP…), required when routeAction is "AI". The agent's prompt, voice, model and tools are read when the call lands, so editing the agent takes effect on the next call with nothing to re-save here.
 * @property {boolean} [recordingEnabled] - Record calls on this profile.
 * @property {boolean} [enabled] - Active state (default true).
 */

/**
 * @typedef {Object} UpdateProgrammableVoiceProfileData
 * @property {string} [name] - Profile name.
 * @property {string[]} [subgroupIds] - Subgroups this profile spans.
 * @property {string|null} [region] - Region/POP label.
 * @property {"FORWARD"|"WEBRTC"|"SIP_TRUNK"|"SIP_PROFILE"|"CALL_CONTROL"|"AI"} [routeAction] - Inbound call action (FORWARD | WEBRTC | SIP_TRUNK | SIP_PROFILE | CALL_CONTROL | AI).
 * @property {string|null} [forwardToE164] - FORWARD destination.
 * @property {number|null} [forwardAfterSeconds] - Ring seconds before the action fires.
 * @property {string|null} [routeSipTrunkId] - SIP trunk id (required when routeAction is "SIP_TRUNK").
 * @property {string|null} [routeSipProfileId] - SIP endpoint id (required when routeAction is "SIP_PROFILE").
 * @property {string|null} [webhookUrl] - Inbound voice webhook / SHML program URL (required when routeAction is "CALL_CONTROL"). Pass null to clear.
 * @property {string|null} [routeAgentProfileId] - AI agent profile id (AGP…), required when routeAction is "AI". Pass null to clear.
 * @property {boolean} [recordingEnabled] - Record calls on this profile.
 * @property {boolean} [enabled] - Active state.
 */

/**
 * Programmable Voice Profile management. A Programmable Voice Profile groups a
 * set of the account's numbers (across one or more subgroups) under a single
 * inbound call-handling decision routed through Signal House's own voice servers
 * — the same idea as a SIP trunk, but without a customer SBC. A number can
 * belong to at most one profile and is mutually exclusive with SIP trunks.
 *
 * Calls the Voice service mounted under /voice. Accessed via
 * `sdk.voice.programmableVoiceProfiles`.
 */
export class ProgrammableVoiceProfiles {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List all Programmable Voice Profiles for the current account.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ profiles: [...] }`.
	 */
	async list({ options = {} } = {}) {
		return this.client(`/voice/api/v1/programmable-voice-profiles`, { method: "GET", ...options });
	}

	/**
	 * Get a single Programmable Voice Profile by ID.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create a Programmable Voice Profile.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {CreateProgrammableVoiceProfileData} params.profileData - The profile to create.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If profileData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async create({ profileData, options = {} }) {
		this.client._require({ profileData });
		return this.client(`/voice/api/v1/programmable-voice-profiles`, { method: "POST", body: profileData, ...options });
	}

	/**
	 * Update an existing Programmable Voice Profile (partial).
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {UpdateProgrammableVoiceProfileData} params.updateData - Fields to update.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or updateData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async update({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}`, { method: "PATCH", body: updateData, ...options });
	}

	/**
	 * Toggle a profile active/inactive.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async toggleActive({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}/toggle-active`, { method: "POST", ...options });
	}

	/**
	 * Delete a Programmable Voice Profile. Its number assignments cascade away,
	 * so those numbers fall back to subgroup/global routing.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ message: string }`.
	 */
	async delete({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Assign a phone number (by E.164) to this profile. Rejected if the number is
	 * already configured on a SIP trunk/endpoint or another profile — it must be
	 * de-configured there first (mutual exclusivity).
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {string} params.e164 - The phone number in E.164 (a leading "+" is optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or e164 is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async assignNumber({ id, e164, options = {} }) {
		this.client._require({ id, e164 });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}/assign-number`, {
			method: "POST",
			body: { e164 },
			...options,
		});
	}

	/**
	 * Unassign a phone number (by E.164) from this profile.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The profile UUID.
	 * @param {string} params.e164 - The phone number in E.164 (a leading "+" is optional).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or e164 is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ profile: {...} }`.
	 */
	async unassignNumber({ id, e164, options = {} }) {
		this.client._require({ id, e164 });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/programmable-voice-profiles/${safeId}/unassign-number`, {
			method: "POST",
			body: { e164 },
			...options,
		});
	}
}
