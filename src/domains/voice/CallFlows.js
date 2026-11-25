/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CallFlowListFilters
 * @property {number} [page] - Page number, from 1 (default 1).
 * @property {number} [limit] - Page size, 1-100 (default 20).
 * @property {string} [q] - Match against the flow name.
 * @property {string} [subgroupId] - Only flows in this subgroup.
 * @property {boolean} [includeDeleted] - Include deleted flows (default false).
 * @property {"createdAt"|"updatedAt"|"name"} [sortBy] - Sort field (default "createdAt").
 * @property {"asc"|"desc"} [sortOrder] - Sort direction (default "desc").
 */

/**
 * @typedef {Object} CreateCallFlowData
 * @property {string} name - Flow name, unique within its subgroup.
 * @property {string} subgroupId - The subgroup the flow belongs to. Fixed once created; only numbers and Programmable Voice Profiles in this subgroup can run the flow.
 */

/**
 * @typedef {Object} UpdateCallFlowData
 * @property {string} [name] - New name, unique within the flow's subgroup.
 * @property {"ACTIVE"|"DISABLED"} [status] - A disabled flow does not run; numbers routed to it fall through to their next routing layer.
 */

/**
 * @typedef {Object} CallFlowStep
 * @property {string} id - A UUID you generate. It is kept as the step's id, so it stays stable across saves.
 * @property {"inbound"|"answer"|"play"|"sms"|"ivr"|"ai_agent"|"ai_sms"|"webhook"|"fwd_phone"|"fwd_sip"|"voicemail"|"hangup"} type - The step kind. `catalog()` lists the kinds this service can run.
 * @property {string} name - Display name.
 * @property {Object} [config] - The step's settings, which depend on its type.
 * @property {number} [positionX] - Canvas x position, for a visual builder.
 * @property {number} [positionY] - Canvas y position, for a visual builder.
 */

/**
 * @typedef {Object} CallFlowConnection
 * @property {string} id - A UUID you generate.
 * @property {string} fromNodeId - The step the connection leaves.
 * @property {string} toNodeId - The step it leads to.
 * @property {string} port - The outcome of the source step it leaves from, e.g. "next", "success", "no_input" or "opt_<optionId>".
 */

/**
 * @typedef {Object} CallFlowDraft
 * @property {CallFlowStep[]} nodes - Every step in the flow, including exactly one "inbound" step.
 * @property {CallFlowConnection[]} edges - Every connection between steps.
 */

/**
 * Call Flows — customer-built call trees (greeting, menu, forward, voicemail, hang up)
 * that run when a number's route, or its Programmable Voice Profile, names the flow
 * with `routeAction: "CALL_FLOW"`.
 *
 * Each flow has one working draft you edit with `saveDraft`, and published versions.
 * `publish` validates the draft and makes it the version calls run; the draft stays
 * editable without affecting calls until you publish again.
 *
 * Calls the Voice service mounted under /voice. Accessed via `sdk.voice.callFlows`.
 */
export class CallFlows {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List the account's call flows, newest first by default.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {CallFlowListFilters} [params.filters] - Paging, search, subgroup and sort.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ data: [...], meta: { total, page, limit, totalPages } }`.
	 */
	async list({ filters = {}, options = {} } = {}) {
		const query = new URLSearchParams();
		for (const [k, v] of Object.entries(filters)) {
			if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
		}
		const qs = query.toString();
		return this.client(`/voice/api/v1/call-flows${qs ? `?${qs}` : ""}`, { method: "GET", ...options });
	}

	/**
	 * List the step types this service can run, with the outcomes each one offers.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { nodeTypes: [{ type, ports, configurable }] } }`.
	 */
	async catalog({ options = {} } = {}) {
		return this.client(`/voice/api/v1/call-flows/catalog`, { method: "GET", ...options });
	}

	/**
	 * Get a call flow with its working draft and the issues that stop the draft being published.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow, draft: { versionId, nodes, edges, issues } } }`.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create a call flow, with its working draft and the Inbound Call step every flow starts from.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {CreateCallFlowData} params.flowData - The flow to create.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If flowData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow, draft } }`.
	 */
	async create({ flowData, options = {} }) {
		this.client._require({ flowData });
		return this.client(`/voice/api/v1/call-flows`, { method: "POST", body: flowData, ...options });
	}

	/**
	 * Rename a call flow, or enable or disable it (partial update).
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {UpdateCallFlowData} params.updateData - Fields to update.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or updateData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow, draft } }`.
	 */
	async update({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}`, { method: "PATCH", body: updateData, ...options });
	}

	/**
	 * Delete a call flow. Reversible with `restore`: while deleted, numbers and profiles
	 * routed to it fall through to their next routing layer.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow } }`.
	 */
	async delete({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Restore a deleted call flow.
	 *
	 * Sends an empty JSON body: the SDK always declares JSON, and the Voice service
	 * rejects a JSON request with no body at all.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow, draft } }`.
	 */
	async restore({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}/restore`, { method: "POST", body: {}, ...options });
	}

	/**
	 * Copy a call flow and its working draft into a new flow in the same subgroup. The copy is not published.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID to copy.
	 * @param {string} [params.name] - Name for the copy (default "<name> (copy)").
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { ...flow, draft } }`.
	 */
	async duplicate({ id, name, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}/duplicate`, {
			method: "POST",
			body: name ? { name } : {},
			...options,
		});
	}

	/**
	 * Replace the working draft. The whole draft is saved, even when it is not finished;
	 * the issues that would stop it being published come back in the response.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {CallFlowDraft} params.draft - Every step and connection.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or draft is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { nodes, edges, issues } }`.
	 */
	async saveDraft({ id, draft, options = {} }) {
		this.client._require({ id, draft });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}/draft`, { method: "PUT", body: draft, ...options });
	}

	/**
	 * Publish the working draft, making it the version calls run. A draft that is not
	 * ready returns 400 with `error.issues` listing each step that needs attention.
	 *
	 * Sends an empty JSON body: the SDK always declares JSON, and the Voice service
	 * rejects a JSON request with no body at all.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The call flow UUID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ data: { id, versionNumber, status, publishedAt } }`.
	 */
	async publish({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/voice/api/v1/call-flows/${safeId}/publish`, { method: "POST", body: {}, ...options });
	}
}
