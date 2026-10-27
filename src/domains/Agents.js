/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateAgentProfileData
 * @property {string} groupId - The parent group id (at least 8 characters, starts with 'G').
 * @property {string|null} [subgroupId] - Optional subgroup id (at least 8 characters, starts with 'S'); null/omitted = group-level agent.
 * @property {string} name - The agent's name (required).
 * @property {string} [status] - Lifecycle status: "active" or "inactive" (defaults to "active").
 * @property {string} [systemPrompt] - Base system prompt composed into every conversation.
 * @property {string} [greeting] - Opening line the agent leads with.
 * @property {string} [guardrails] - Freeform guardrail instructions appended to the composed prompt.
 * @property {string} [sendAuthority] - Default send authority: "review" or "autopilot" (defaults to "review"). Deployments may override it per subgroup.
 */

/**
 * @typedef {Object} UpdateAgentProfileData
 * @property {string} [name] - The agent's name.
 * @property {string} [status] - Lifecycle status: "active" or "inactive".
 * @property {string} [systemPrompt] - Base system prompt composed into every conversation.
 * @property {string} [greeting] - Opening line the agent leads with.
 * @property {string} [guardrails] - Freeform guardrail instructions appended to the composed prompt.
 * @property {string} [sendAuthority] - Default send authority: "review" or "autopilot". Deployments may override it per subgroup.
 */

/**
 * An agent profile as returned by the server. `publishStatus` and `publishedAt` are read-only:
 * they change only through `publishAgentProfile` and `unpublishAgentProfile`.
 * @typedef {Object} AgentProfile
 * @property {string} agentProfileId - The agent profile id.
 * @property {string} groupId - The owning group id.
 * @property {string|null} subgroupId - The owning subgroup id; null for a group-level agent.
 * @property {string} name - The agent's name.
 * @property {string} status - Lifecycle status: "active" or "inactive".
 * @property {string} [systemPrompt] - Base system prompt composed into every conversation.
 * @property {string} [greeting] - Opening line the agent leads with.
 * @property {string} [guardrails] - Freeform guardrail instructions appended to the composed prompt.
 * @property {string} sendAuthority - Default send authority: "review" or "autopilot".
 * @property {string} publishStatus - "draft" or "published" (read-only).
 * @property {string|null} publishedAt - When the profile was last published; null while never published (read-only).
 * @property {string} createdAt - Creation timestamp.
 * @property {string} updatedAt - Last-update timestamp.
 */

/**
 * The fields of a deployment of a group-level agent to a subgroup.
 * @typedef {Object} AgentDeploymentData
 * @property {string|null} [sendAuthorityOverride] - "review" or "autopilot" to override the profile's default for this subgroup; null clears the override so the deployment inherits the profile default.
 * @property {boolean} [enabled] - Whether this deployment is live (defaults to true).
 */

/**
 * A deployment of a group-level agent to a subgroup, as returned by the server.
 * @typedef {Object} AgentDeployment
 * @property {string} agentDeploymentId - The deployment id.
 * @property {string} groupId - The group that owns the agent and the subgroup.
 * @property {string} subgroupId - The subgroup the agent is deployed to.
 * @property {string} agentProfileId - The deployed agent.
 * @property {string|null} sendAuthorityOverride - "review", "autopilot", or null (inherit the profile default).
 * @property {string|null} sendAuthorityChangedBy - userId of whoever last changed the override.
 * @property {string|null} sendAuthorityChangedAt - When the override last changed.
 * @property {boolean} enabled - Whether this deployment is live.
 * @property {string} createdAt - Creation timestamp.
 * @property {string} updatedAt - Last-update timestamp.
 */

/**
 * The fields of an endpoint binding: which agent answers a number.
 * @typedef {Object} AgentEndpointData
 * @property {string} agentProfileId - The agent that answers the number (required). It must be active, in the number's group, and either belong to the number's subgroup or be a group-level agent with an enabled deployment there.
 * @property {string} [answerMode] - Which inbound messages the agent answers: "all_inbound" (the only mode, and the default).
 */

/**
 * An endpoint binding (which agent answers a number), as returned by the server.
 * @typedef {Object} AgentEndpoint
 * @property {string} agentEndpointId - The binding id ("AEP..." prefix).
 * @property {string} groupId - The group that owns the binding.
 * @property {string|null} subgroupId - The subgroup the number belongs to.
 * @property {string} channel - The channel; "sms".
 * @property {string} endpointType - The endpoint kind; "sms_number".
 * @property {string} endpointValue - The phone number: digits only, country code included, no "+".
 * @property {string} agentProfileId - The agent that answers the number.
 * @property {string} answerMode - Which inbound messages the agent answers ("all_inbound").
 * @property {Object|null} overrides - Free-form per-endpoint overrides; null when none.
 * @property {boolean} enabled - Whether the binding is live.
 * @property {string} createdAt - Creation timestamp.
 * @property {string} updatedAt - Last-update timestamp.
 */

/**
 * A reply an SMS agent wrote but did not send, held for a person to approve or reject (the
 * Pending Replies queue), as returned by the server.
 * @typedef {Object} AgentReplyDraft
 * @property {string} agentReplyDraftId - The draft id ("ARD..." prefix).
 * @property {string} groupId - The group that owns the draft.
 * @property {string|null} subgroupId - The subgroup whose number the reply goes out from.
 * @property {string} agentProfileId - The agent that wrote the reply.
 * @property {string|null} conversationId - The conversation the reply belongs to.
 * @property {string} channel - The channel; "sms".
 * @property {string} endpointValue - The agent's number the reply is sent from, digits only.
 * @property {string} contactPhoneNumber - The contact the reply is sent to, digits only.
 * @property {string} inboundText - The contact message the agent was answering.
 * @property {string} draftText - The reply as the agent wrote it.
 * @property {string|null} sentText - The text actually sent; differs from draftText when edited.
 * @property {string} reason - Why it was held: "review_mode", "escalation", "fallback" or "guardrail".
 * @property {string} status - "pending", "sending", "sent", "rejected" or "failed" (the send path accepted nothing, e.g. the contact opted out).
 * @property {string|null} decidedBy - The user who approved or rejected it.
 * @property {string|null} decidedAt - When it was approved or rejected.
 * @property {string|null} sentMessageId - The outbound message id once sent (for an external delivery, the id you reported).
 * @property {string|null} claimId - The current claim's id (set when a decision claims the draft); complete and release must name it.
 * @property {string|null} deliveredBy - Who delivers an approved reply: "signalhouse" (approveAgentReplyDraft) or "external" (claimAgentReplyDraft); null until decided.
 * @property {string|null} failureReason - "delivery_unconfirmed" when an external claim was never completed or released; otherwise null.
 * @property {string} createdAt - Creation timestamp.
 * @property {string} updatedAt - Last-update timestamp.
 */

/**
 * The per-channel settings for one agent. Model, voice and sampling settings live here rather
 * than on the profile: each channel is served by a different runtime, and the model catalogues
 * do not overlap — so a value that is valid on one channel may be invalid on another.
 * @typedef {Object} AgentChannelSettingData
 * @property {string[]} [allowedTools] - Tools enabled on this channel — built-in keys or custom agentTool ids.
 * @property {boolean} [enabled] - Whether the agent answers on this channel.
 * @property {string} [channelPrompt] - Channel-specific prompt text appended to the agent's system prompt.
 * @property {string|null} [greeting] - Channel-specific greeting override; null = use the agent's greeting.
 * @property {string} [llmProvider] - LLM backend for this channel: "bedrock", "openai", "anthropic", or "groq" (defaults to "bedrock").
 * @property {string|null} [llmModel] - Concrete model id for the provider; null = provider default.
 * @property {number} [temperature] - Sampling temperature (0-2).
 * @property {string|null} [voiceId] - Voice identifier for spoken channels; ignored off the voice channel.
 * @property {number|null} [speed] - Speaking rate multiplier (0.7-1.2); null = platform default.
 * @property {number|null} [stability] - Voice consistency (0-1); lower is more expressive and more variable.
 * @property {number|null} [similarityBoost] - How closely synthesis tracks the source voice (0-1).
 * @property {string|null} [speechModel] - Speech synthesis model; separate from `llmModel`, which decides what is said rather than how it is voiced.
 * @property {string|null} [turnEagerness] - How readily the agent decides the caller has finished: "patient", "normal", or "eager".
 * @property {number|null} [turnTimeoutSeconds] - Silence before the agent takes its turn: 1-300, or -1 for no timeout.
 * @property {number|null} [initialWaitSeconds] - Silence before the agent speaks first: 1-300, or -1 for no timeout.
 * @property {number|null} [silenceEndCallSeconds] - Silence before the call is ended outright (10-7200).
 * @property {number|null} [maxCallDurationSeconds] - Hard ceiling on one conversation (60-7200).
 * @property {boolean} [allowGreetingInterruption] - Whether a caller may talk over the greeting.
 * @property {string[]} [keyterms] - Words the transcriber is biased toward — names, jargon, unusual spellings.
 * @property {Object|null} [backgroundSound] - Ambient audio bed as `{ preset, volume }`; null = silence.
 * @property {AgentWorkflow|null} [workflow] - Conversation workflow graph. Voice channel only — sending one on webchat or sms is a 400. null = no workflow.
 */

/**
 * A conversation workflow graph, in the voice runtime's own shape. Nodes and edges are keyed
 * maps rather than arrays: an edge names its endpoints by node key, and a node's `edge_order`
 * names its outgoing edges in the order their conditions are evaluated.
 *
 * Node bodies are deliberately not enumerated here. Node types are defined by the runtime and
 * new ones appear without an SDK release, so the SDK passes them through untouched. The API
 * validates the envelope — an entry point under the node key `start_node` typed `start` (the
 * runtime looks it up by that exact key), no second `start` node, at most 200 nodes, and every
 * edge endpoint naming a node that exists — and rejects a graph that fails any of those.
 * @typedef {Object} AgentWorkflow
 * @property {Object<string, Object>} nodes - Nodes keyed by node id. Each carries at least `type` and `position` ({ x, y }).
 * @property {Object<string, Object>} edges - Edges keyed by edge id. Each carries `source` and `target` node ids.
 * @property {Object<string, Object>} [subgraphs] - Nested subgraphs keyed by subgraph id.
 * @property {boolean} [prevent_subagent_loops] - Stop a subagent handing control back to one that already ran.
 */

export class Agents {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List the voices an agent can be configured to speak with.
	 *
	 * The catalog is platform-wide, not per-account, so this takes no scope. `voiceId` is the
	 * value to set on a spoken channel's setting.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - The parameters for the request.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} - The available voices, each as `{ voiceId, name, description, previewUrl, gender, accent, age, useCase, language }`.
	 */
	async getAgentVoices({ options = {} } = {}) {
		return this.client("/agent/voices", { method: "GET", ...options });
	}

	/**
	 * List the agent profiles under a group.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing agent profiles.
	 * @param {string} params.groupId - The group whose profiles to list (required).
	 * @param {string} [params.subgroupId] - Narrow to the agents this subgroup can use — its own, plus the group-level agents shared with every subgroup.
	 * @param {number} [params.page] - The page number for pagination.
	 * @param {number} [params.limit] - The number of items per page for pagination.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The list of agent profiles returned from the server.
	 */
	async getAgentProfiles({ groupId, subgroupId, page, limit, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId, page, limit });
		return this.client(`/agent/profiles${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a single agent profile by id.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting an agent profile.
	 * @param {string} params.agentProfileId - The id of the agent profile to fetch.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentProfileId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The agent profile returned from the server.
	 */
	async getAgentProfile({ agentProfileId, options = {} }) {
		this.client._require({ agentProfileId });
		const safeId = encodeURIComponent(agentProfileId);
		return this.client(`/agent/profiles/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create a new agent profile.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for creating an agent profile (see CreateAgentProfileData typedef).
	 * @param {CreateAgentProfileData} params.profileData - The data for the agent profile to create, including required fields groupId and name.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the profileData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The created agent profile returned from the server.
	 */
	async createAgentProfile({ profileData, options = {} }) {
		this.client._require({ profileData });
		return this.client(`/agent/profiles`, { method: "POST", body: profileData, ...options });
	}

	/**
	 * Update an existing agent profile.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for updating an agent profile (see UpdateAgentProfileData typedef).
	 * @param {string} params.id - The id of the agent profile to update.
	 * @param {UpdateAgentProfileData} params.updateData - The data for the agent profile to update.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id or updateData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The updated agent profile returned from the server.
	 */
	async updateAgentProfile({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/profiles/${safeId}`, { method: "PUT", body: updateData, ...options });
	}

	/**
	 * Permanently delete an agent profile by its id.
	 *
	 * Permanently deletes the agent, its channel settings, and any tools and knowledge scoped to it, plus their provider-side counterparts. Tools and knowledge shared across the account are untouched. Conversation records survive — a transcript outlives the agent that produced it.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for deleting an agent profile.
	 * @param {string} params.id - The id of the agent profile to delete.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id parameter is missing.
	 * @returns {Promise<Object>} - The deleted agent profile, as it was.
	 */
	async deleteAgentProfile({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/profiles/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Send a message to an agent and get its reply — the app-native conversation
	 * endpoint (webchat / SMS). Omit conversationId to start a new conversation, or
	 * pass one to continue an existing one. Runs the agent's LLM tool loop server-side
	 * and returns the assistant's reply along with any tools it invoked.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for sending a message.
	 * @param {string} params.agentProfileId - The agent to talk to (required).
	 * @param {string} params.channel - The channel: "webchat", "sms", or "voice" (required).
	 * @param {string} params.message - The user's message (required).
	 * @param {string} [params.conversationId] - Continue this conversation; omit to start a new one.
	 * @param {string} [params.contactIdentifier] - The far-end identifier (webchat visitor id, sender number).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId, channel, or message is missing.
	 * @returns {Promise<SdkResponse<any>>} - `{ conversationId, conversationSessionId, reply, toolInvocations, ok }` from the server.
	 */
	async sendAgentMessage({ agentProfileId, channel, message, conversationId, contactIdentifier, options = {} }) {
		this.client._require({ agentProfileId, channel, message });
		const body = { agentProfileId, channel, message };
		if (conversationId !== undefined && conversationId !== null) body.conversationId = conversationId;
		if (contactIdentifier !== undefined && contactIdentifier !== null) body.contactIdentifier = contactIdentifier;
		return this.client(`/agent/messages`, { method: "POST", body, ...options });
	}

	/**
	 * Start a conversation without sending a message.
	 *
	 * The counterpart to `sendAgentMessage` for callers that run the model themselves —
	 * a voice runtime, or your own LLM. Those record what was said; `sendAgentMessage`
	 * decides it. Both write the same conversation records.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for starting a conversation.
	 * @param {string} params.agentProfileId - The agent this conversation belongs to (required).
	 * @param {string} params.channel - The channel: "webchat", "sms", or "voice" (required).
	 * @param {string} [params.contactIdentifier] - The far-end identifier (visitor id, caller number).
	 * @param {string} [params.callId] - Telephony call id, for the voice channel.
	 * @param {Object} [params.metadata] - Arbitrary metadata stored with the conversation.
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or channel is missing.
	 * @returns {Promise<Object>} - The created conversation, including `conversationId` and `conversationSessionId`.
	 */
	async startConversation({ agentProfileId, channel, contactIdentifier, callId, metadata, options = {} }) {
		this.client._require({ agentProfileId, channel });
		const body = { agentProfileId, channel };
		if (contactIdentifier !== undefined && contactIdentifier !== null) body.contactIdentifier = contactIdentifier;
		if (callId !== undefined && callId !== null) body.callId = callId;
		if (metadata !== undefined && metadata !== null) body.metadata = metadata;
		return this.client(`/agent/conversations`, { method: "POST", body, ...options });
	}

	/**
	 * Read one conversation with a page of its messages, in order.
	 *
	 * Paged rather than whole: a transcript has no natural ceiling. Omitting `limit` gives 100
	 * messages, not all of them.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for reading a conversation.
	 * @param {string} params.conversationId - The conversation to read (required).
	 * @param {number} [params.page] - Page number; defaults to 1.
	 * @param {number} [params.limit] - Messages per page; defaults to 100, capped at 500.
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the conversationId parameter is missing.
	 * @returns {Promise<Object>} - A one-element array with the conversation and its `messages`.
	 */
	async getConversation({ conversationId, page, limit, options = {} }) {
		this.client._require({ conversationId });
		const safeId = encodeURIComponent(conversationId);
		const queryString = this.client._getQueryString({ page, limit });
		return this.client(`/agent/conversations/${safeId}${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Append one message to a conversation.
	 *
	 * Records a turn rather than generating one, so `role` is explicit — an assistant turn
	 * your own runtime produced is the normal case here. `content` is optional so a
	 * tool-only turn needs no prose.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for appending a message.
	 * @param {string} params.conversationId - The conversation to append to (required).
	 * @param {string} params.role - "user", "assistant", "system", or "tool" (required).
	 * @param {string} [params.content] - What was said.
	 * @param {Array<Object>} [params.toolCalls] - Tools invoked on this turn.
	 * @param {Array<Object>} [params.toolResults] - Their results.
	 * @param {number} [params.ttfbMs] - Time to first byte/audio, in milliseconds.
	 * @param {number} [params.latencyMs] - Total turn latency, in milliseconds.
	 * @param {boolean} [params.bargeInOccurred] - Whether the far end talked over this turn.
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if conversationId or role is missing.
	 * @returns {Promise<Object>} - The persisted message.
	 */
	async appendConversationMessage({ conversationId, role, content, toolCalls, toolResults, ttfbMs, latencyMs, bargeInOccurred, options = {} }) {
		this.client._require({ conversationId, role });
		const safeId = encodeURIComponent(conversationId);
		const body = { role };
		if (content !== undefined && content !== null) body.content = content;
		if (toolCalls !== undefined && toolCalls !== null) body.toolCalls = toolCalls;
		if (toolResults !== undefined && toolResults !== null) body.toolResults = toolResults;
		if (ttfbMs !== undefined && ttfbMs !== null) body.ttfbMs = ttfbMs;
		if (latencyMs !== undefined && latencyMs !== null) body.latencyMs = latencyMs;
		if (bargeInOccurred !== undefined && bargeInOccurred !== null) body.bargeInOccurred = bargeInOccurred;
		return this.client(`/agent/conversations/${safeId}/messages`, { method: "POST", body, ...options });
	}

	/**
	 * End a conversation, closing its open session.
	 *
	 * `status` records HOW it ended and cannot be recovered afterwards, so pass the one that
	 * actually happened. Ending an already-ended conversation is a no-op, so a retry after a
	 * dropped connection cannot overwrite it.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for ending a conversation.
	 * @param {string} params.conversationId - The conversation to end (required).
	 * @param {string} [params.status] - "completed", "escalated", or "abandoned" (defaults to "completed").
	 * @param {Object} [params.metadata] - Metadata merged onto the conversation.
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the conversationId parameter is missing.
	 * @returns {Promise<Object>} - The ended conversation.
	 */
	async endConversation({ conversationId, status, metadata, options = {} }) {
		this.client._require({ conversationId });
		const safeId = encodeURIComponent(conversationId);
		const body = {};
		if (status !== undefined && status !== null) body.status = status;
		if (metadata !== undefined && metadata !== null) body.metadata = metadata;
		return this.client(`/agent/conversations/${safeId}`, { method: "PUT", body, ...options });
	}

	/**
	 * List an agent's per-channel settings (the tools enabled per channel, whether the
	 * channel is on, and any channel-specific prompt/greeting).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing channel settings.
	 * @param {string} params.agentProfileId - The agent whose channel settings to list.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentProfileId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The agent's channel settings returned from the server.
	 */
	async getAgentChannelSettings({ agentProfileId, options = {} }) {
		this.client._require({ agentProfileId });
		const safeId = encodeURIComponent(agentProfileId);
		return this.client(`/agent/profiles/${safeId}/channels`, { method: "GET", ...options });
	}

	/**
	 * Get a single per-channel setting for an agent.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a channel setting.
	 * @param {string} params.agentProfileId - The agent the setting belongs to.
	 * @param {string} params.channel - The channel: "webchat", "sms", or "voice".
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or channel is missing.
	 * @returns {Promise<SdkResponse<any>>} - The channel setting returned from the server.
	 */
	async getAgentChannelSetting({ agentProfileId, channel, options = {} }) {
		this.client._require({ agentProfileId, channel });
		const safeId = encodeURIComponent(agentProfileId);
		const safeChannel = encodeURIComponent(channel);
		return this.client(`/agent/profiles/${safeId}/channels/${safeChannel}`, { method: "GET", ...options });
	}

	/**
	 * Create or update (upsert) an agent's per-channel setting. One row per (agent, channel);
	 * the channel is taken from the path, the fields from settingData.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the upsert.
	 * @param {string} params.agentProfileId - The agent the setting belongs to.
	 * @param {string} params.channel - The channel: "webchat", "sms", or "voice".
	 * @param {AgentChannelSettingData} [params.settingData] - The fields to set.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or channel is missing.
	 * @returns {Promise<SdkResponse<any>>} - The created or updated channel setting returned from the server.
	 */
	async upsertAgentChannelSetting({ agentProfileId, channel, settingData = {}, options = {} }) {
		this.client._require({ agentProfileId, channel });
		const safeId = encodeURIComponent(agentProfileId);
		const safeChannel = encodeURIComponent(channel);
		return this.client(`/agent/profiles/${safeId}/channels/${safeChannel}`, { method: "PUT", body: settingData, ...options });
	}

	/**
	 * Delete an agent's per-channel setting.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the delete.
	 * @param {string} params.agentProfileId - The agent the setting belongs to.
	 * @param {string} params.channel - The channel: "webchat", "sms", or "voice".
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or channel is missing.
	 * @returns {Promise<SdkResponse<any>>} - The delete confirmation returned from the server.
	 */
	async deleteAgentChannelSetting({ agentProfileId, channel, options = {} }) {
		this.client._require({ agentProfileId, channel });
		const safeId = encodeURIComponent(agentProfileId);
		const safeChannel = encodeURIComponent(channel);
		return this.client(`/agent/profiles/${safeId}/channels/${safeChannel}`, { method: "DELETE", ...options });
	}

	/**
	 * List a group-level agent's deployments to subgroups.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing deployments.
	 * @param {string} params.agentProfileId - The agent whose deployments to list.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentProfileId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentDeployment[]>>} - The agent's deployments returned from the server.
	 */
	async getAgentDeployments({ agentProfileId, options = {} }) {
		this.client._require({ agentProfileId });
		const safeId = encodeURIComponent(agentProfileId);
		return this.client(`/agent/profiles/${safeId}/deployments`, { method: "GET", ...options });
	}

	/**
	 * Deploy a group-level agent to a subgroup, or change that deployment (upsert). One row per
	 * (agent, subgroup); the subgroup is taken from the path, the fields from deploymentData.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the upsert.
	 * @param {string} params.agentProfileId - The agent to deploy.
	 * @param {string} params.subgroupId - The subgroup to deploy to (at least 8 characters, starts with 'S').
	 * @param {AgentDeploymentData} [params.deploymentData] - The fields to set.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or subgroupId is missing.
	 * @returns {Promise<SdkResponse<AgentDeployment>>} - The created or updated deployment returned from the server.
	 */
	async upsertAgentDeployment({ agentProfileId, subgroupId, deploymentData = {}, options = {} }) {
		this.client._require({ agentProfileId, subgroupId });
		const safeId = encodeURIComponent(agentProfileId);
		const safeSubgroupId = encodeURIComponent(subgroupId);
		return this.client(`/agent/profiles/${safeId}/deployments/${safeSubgroupId}`, { method: "PUT", body: deploymentData, ...options });
	}

	/**
	 * Remove an agent's deployment from a subgroup.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the delete.
	 * @param {string} params.agentProfileId - The deployed agent.
	 * @param {string} params.subgroupId - The subgroup to remove the deployment from.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if agentProfileId or subgroupId is missing.
	 * @returns {Promise<SdkResponse<AgentDeployment>>} - The removed deployment returned from the server.
	 */
	async deleteAgentDeployment({ agentProfileId, subgroupId, options = {} }) {
		this.client._require({ agentProfileId, subgroupId });
		const safeId = encodeURIComponent(agentProfileId);
		const safeSubgroupId = encodeURIComponent(subgroupId);
		return this.client(`/agent/profiles/${safeId}/deployments/${safeSubgroupId}`, { method: "DELETE", ...options });
	}

	/**
	 * List the endpoint bindings (which agent answers which number) in a group.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing endpoint bindings.
	 * @param {string} params.groupId - The group whose bindings to list (required).
	 * @param {string} [params.subgroupId] - Narrow to one subgroup's bindings.
	 * @param {string} [params.agentProfileId] - Narrow to one agent's bindings.
	 * @param {string} [params.channel] - Narrow to one channel ("sms").
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentEndpoint[]>>} - The bindings, ordered by number, returned from the server.
	 */
	async getAgentEndpoints({ groupId, subgroupId, agentProfileId, channel, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId, agentProfileId, channel });
		return this.client(`/agent/endpoints${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Assign an agent to answer a number (upsert keyed by channel + number). Assigning again
	 * replaces the previous agent, so a number has one agent per channel. Only SMS numbers can be bound.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the upsert.
	 * @param {string} params.channel - The channel to bind; must be "sms".
	 * @param {string} params.endpointValue - The phone number: 10 to 15 digits, country code included, no "+".
	 * @param {AgentEndpointData} params.endpointData - The agent to assign and its answer mode.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if channel, endpointValue, or endpointData.agentProfileId is missing.
	 * @returns {Promise<SdkResponse<AgentEndpoint>>} - The created or updated binding returned from the server.
	 */
	async upsertAgentEndpoint({ channel, endpointValue, endpointData, options = {} }) {
		this.client._require({ channel, endpointValue, agentProfileId: endpointData?.agentProfileId });
		const safeChannel = encodeURIComponent(channel);
		const safeEndpointValue = encodeURIComponent(endpointValue);
		return this.client(`/agent/endpoints/${safeChannel}/${safeEndpointValue}`, { method: "PUT", body: endpointData, ...options });
	}

	/**
	 * Remove the agent assigned to a number.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the delete.
	 * @param {string} params.channel - The bound channel; must be "sms".
	 * @param {string} params.endpointValue - The phone number: digits only, country code included, no "+".
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if channel or endpointValue is missing.
	 * @returns {Promise<SdkResponse<AgentEndpoint>>} - The removed binding returned from the server.
	 */
	async deleteAgentEndpoint({ channel, endpointValue, options = {} }) {
		this.client._require({ channel, endpointValue });
		const safeChannel = encodeURIComponent(channel);
		const safeEndpointValue = encodeURIComponent(endpointValue);
		return this.client(`/agent/endpoints/${safeChannel}/${safeEndpointValue}`, { method: "DELETE", ...options });
	}

	/**
	 * List held agent replies (the Pending Replies queue) in a group, newest first.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing drafts.
	 * @param {string} params.groupId - The group whose drafts to list (required).
	 * @param {string} [params.subgroupId] - Narrow to one subgroup.
	 * @param {string} [params.agentProfileId] - Narrow to one agent.
	 * @param {string} [params.status] - Narrow to one status, e.g. "pending".
	 * @param {number} [params.page] - Page number for pagination.
	 * @param {number} [params.limit] - Items per page (default 25, max 500).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft[]>>} - The drafts returned from the server.
	 */
	async getAgentReplyDrafts({ groupId, subgroupId, agentProfileId, status, page, limit, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId, agentProfileId, status, page, limit });
		return this.client(`/agent/drafts${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Approve a held agent reply and send it from the agent's number, optionally with edited text.
	 * It goes through the normal SMS send path, so opt-out and billing apply; the draft comes back
	 * "failed" when the send path accepted nothing. A draft that is no longer pending returns 409.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the approval.
	 * @param {string} params.agentReplyDraftId - The draft to approve.
	 * @param {string} [params.text] - Replacement text when a person edited the reply.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentReplyDraftId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft>>} - The draft, now sent (or failed), returned from the server.
	 */
	async approveAgentReplyDraft({ agentReplyDraftId, text, options = {} }) {
		this.client._require({ agentReplyDraftId });
		const safeId = encodeURIComponent(agentReplyDraftId);
		const body = text === undefined ? {} : { text };
		return this.client(`/agent/drafts/${safeId}/approve`, { method: "POST", body, ...options });
	}

	/**
	 * Reject a held agent reply so it is never sent. A draft that is no longer pending returns 409.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the rejection.
	 * @param {string} params.agentReplyDraftId - The draft to reject.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentReplyDraftId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft>>} - The rejected draft returned from the server.
	 */
	async rejectAgentReplyDraft({ agentReplyDraftId, options = {} }) {
		this.client._require({ agentReplyDraftId });
		const safeId = encodeURIComponent(agentReplyDraftId);
		return this.client(`/agent/drafts/${safeId}/reject`, { method: "POST", ...options });
	}

	/**
	 * Claim a held agent reply for delivery through your own channel instead of Signal House's send path.
	 * Nothing is sent: the draft becomes "sending" with `deliveredBy: "external"`, `sentText` and a new
	 * `claimId` set, and you then report the outcome with `completeAgentReplyDraft` or `releaseAgentReplyDraft`,
	 * passing that `claimId`. The claim
	 * means two approvals can never both deliver. A draft that is no longer pending returns 409; one whose
	 * number has left its subgroup returns 400 and is closed as failed.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the claim.
	 * @param {string} params.agentReplyDraftId - The draft to claim.
	 * @param {string} [params.text] - Replacement text when a person edited the reply.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentReplyDraftId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft>>} - The claimed draft returned from the server.
	 */
	async claimAgentReplyDraft({ agentReplyDraftId, text, options = {} }) {
		this.client._require({ agentReplyDraftId });
		const safeId = encodeURIComponent(agentReplyDraftId);
		const body = text === undefined ? {} : { text };
		return this.client(`/agent/drafts/${safeId}/claim`, { method: "POST", body, ...options });
	}

	/**
	 * Mark a claimed agent reply sent once your channel accepted it. Only the claim named by `claimId` can be
	 * completed (anything else returns 409). It is also accepted after an unfinished claim was closed as
	 * "failed" with `failureReason: "delivery_unconfirmed"`, which it turns into "sent".
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the completion.
	 * @param {string} params.agentReplyDraftId - The claimed draft.
	 * @param {string} params.claimId - The claim being completed, as returned by `claimAgentReplyDraft`.
	 * @param {string} [params.externalMessageId] - Your channel's id for the sent message, stored as `sentMessageId`.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentReplyDraftId or claimId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft>>} - The draft, now sent, returned from the server.
	 */
	async completeAgentReplyDraft({ agentReplyDraftId, claimId, externalMessageId, options = {} }) {
		this.client._require({ agentReplyDraftId, claimId });
		const safeId = encodeURIComponent(agentReplyDraftId);
		const body = externalMessageId === undefined ? { claimId } : { claimId, externalMessageId };
		return this.client(`/agent/drafts/${safeId}/complete`, { method: "POST", body, ...options });
	}

	/**
	 * Give back a claim whose reply certainly did not go out: the draft returns to "pending", or with
	 * `permanent` is closed as "failed". If you cannot tell whether it went out, do not release it; a claim
	 * left unfinished for 30 minutes is closed as failed with `failureReason: "delivery_unconfirmed"`.
	 * Only the claim named by `claimId` can be released; anything else returns 409.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the release.
	 * @param {string} params.agentReplyDraftId - The claimed draft.
	 * @param {string} params.claimId - The claim being released, as returned by `claimAgentReplyDraft`.
	 * @param {boolean} [params.permanent] - True closes the draft as failed instead of returning it to pending.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentReplyDraftId or claimId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentReplyDraft>>} - The draft, pending again or failed, returned from the server.
	 */
	async releaseAgentReplyDraft({ agentReplyDraftId, claimId, permanent, options = {} }) {
		this.client._require({ agentReplyDraftId, claimId });
		const safeId = encodeURIComponent(agentReplyDraftId);
		const body = permanent === undefined ? { claimId } : { claimId, permanent };
		return this.client(`/agent/drafts/${safeId}/release`, { method: "POST", body, ...options });
	}

	/**
	 * Publish an agent profile, setting its `publishStatus` to "published" and stamping
	 * `publishedAt`. The server rejects the call with 400 when the agent has no enabled
	 * deployment, and with 409 when the agent is inactive.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for publishing.
	 * @param {string} params.agentProfileId - The agent profile to publish.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentProfileId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentProfile>>} - The published agent profile returned from the server.
	 */
	async publishAgentProfile({ agentProfileId, options = {} }) {
		this.client._require({ agentProfileId });
		const safeId = encodeURIComponent(agentProfileId);
		return this.client(`/agent/profiles/${safeId}/publish`, { method: "POST", ...options });
	}

	/**
	 * Return an agent profile to draft, setting its `publishStatus` to "draft".
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for unpublishing.
	 * @param {string} params.agentProfileId - The agent profile to unpublish.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentProfileId parameter is missing.
	 * @returns {Promise<SdkResponse<AgentProfile>>} - The unpublished agent profile returned from the server.
	 */
	async unpublishAgentProfile({ agentProfileId, options = {} }) {
		this.client._require({ agentProfileId });
		const safeId = encodeURIComponent(agentProfileId);
		return this.client(`/agent/profiles/${safeId}/unpublish`, { method: "POST", ...options });
	}

	/**
	 * Read the tenant AI settings for a scope (group, or a subgroup within it) — brand, tone,
	 * timezone, business hours, and after-hours message. Returns the scope's own row only (no
	 * group-level fallback).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for reading tenant settings.
	 * @param {string} params.groupId - The group (required).
	 * @param {string} [params.subgroupId] - The subgroup; omit for the group-level settings.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The tenant settings returned from the server.
	 */
	async getTenantAiSettings({ groupId, subgroupId, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId });
		return this.client(`/agent/tenant-settings${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Create or update (upsert) the tenant AI settings for a scope. The scope is identified by
	 * the query params; the body carries the settings fields.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the upsert.
	 * @param {string} params.groupId - The group (required).
	 * @param {string} [params.subgroupId] - The subgroup; omit for the group-level settings.
	 * @param {Object} [params.settingsData] - Fields to set: brandName (string), tone (string), timezone (IANA string), businessHours (array of {day, closed, open, close}), afterHoursMessage (string).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The created or updated tenant settings returned from the server.
	 */
	async upsertTenantAiSettings({ groupId, subgroupId, settingsData = {}, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId });
		return this.client(`/agent/tenant-settings${queryString}`, { method: "PUT", body: settingsData, ...options });
	}

	/**
	 * Delete the tenant AI settings for a scope.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the delete.
	 * @param {string} params.groupId - The group (required).
	 * @param {string} [params.subgroupId] - The subgroup; omit for the group-level settings.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The delete confirmation returned from the server.
	 */
	async deleteTenantAiSettings({ groupId, subgroupId, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId });
		return this.client(`/agent/tenant-settings${queryString}`, { method: "DELETE", ...options });
	}

	/**
	 * List the knowledge-base items an agent can answer from (RAG), scoped to a group and
	 * optionally narrowed to a subgroup and/or a single agent.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing knowledge items.
	 * @param {string} params.groupId - The group whose knowledge to list (required).
	 * @param {string} [params.subgroupId] - Narrow to a subgroup.
	 * @param {string} [params.agentProfileId] - Narrow to one agent.
	 * @param {number} [params.page] - Page number (1-based) for pagination.
	 * @param {number} [params.limit] - Items per page (max 100; server default 25).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The knowledge items returned from the server.
	 */
	async getKnowledgeItems({ groupId, subgroupId, agentProfileId, page, limit, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId, agentProfileId, page, limit });
		return this.client(`/agent/knowledge${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a single knowledge item by id.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a knowledge item.
	 * @param {string} params.knowledgeItemId - The id of the knowledge item to fetch.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the knowledgeItemId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The knowledge item returned from the server.
	 */
	async getKnowledgeItem({ knowledgeItemId, options = {} }) {
		this.client._require({ knowledgeItemId });
		const safeId = encodeURIComponent(knowledgeItemId);
		return this.client(`/agent/knowledge/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create a knowledge item. The raw `text` is stored and Atlas Vector Search owns the
	 * embedding — there is no embedding to supply.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for creating a knowledge item.
	 * @param {Object} params.itemData - The knowledge fields. Required: groupId (starts with 'G'), text.
	 *                                   Optional: subgroupId (starts with 'S', nullable), agentProfileId
	 *                                   (nullable = shared across the tenant's agents), title, source
	 *                                   ("manual" | "url" | "document" | "import"), enabled (boolean), metadata (object|null).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the itemData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The created knowledge item returned from the server.
	 */
	async createKnowledgeItem({ itemData, options = {} }) {
		this.client._require({ itemData });
		return this.client(`/agent/knowledge`, { method: "POST", body: itemData, ...options });
	}

	/**
	 * Update a knowledge item. The item's scope (group/subgroup/agent) is immutable and
	 * cannot be changed.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for updating a knowledge item.
	 * @param {string} params.id - The id of the knowledge item to update.
	 * @param {Object} params.updateData - The fields to update: title, text, source, enabled, metadata.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id or updateData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The updated knowledge item returned from the server.
	 */
	async updateKnowledgeItem({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/knowledge/${safeId}`, { method: "PUT", body: updateData, ...options });
	}

	/**
	 * Delete a knowledge item by its id.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for deleting a knowledge item.
	 * @param {string} params.id - The id of the knowledge item to delete.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The delete confirmation returned from the server.
	 */
	async deleteKnowledgeItem({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/knowledge/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * List the tools defined under a group — custom webhook tools, configured built-ins, and
	 * (future) MCP. `webhookAuth` secrets are redacted in the response.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing tools.
	 * @param {string} params.groupId - The group whose tools to list (required).
	 * @param {string} [params.subgroupId] - Narrow to a subgroup.
	 * @param {string} [params.agentProfileId] - Narrow to one agent.
	 * @param {string} [params.type] - Narrow to a tool type: "builtin", "webhook", or "mcp".
	 * @param {number} [params.page] - Page number (1-based) for pagination.
	 * @param {number} [params.limit] - Items per page (max 100; server default 25).
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the groupId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The tools returned from the server (secrets redacted).
	 */
	async getAgentTools({ groupId, subgroupId, agentProfileId, type, page, limit, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, subgroupId, agentProfileId, type, page, limit });
		return this.client(`/agent/tools${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a single agent tool by id. `webhookAuth` secrets are redacted in the response.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a tool.
	 * @param {string} params.agentToolId - The id of the tool to fetch.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the agentToolId parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The tool returned from the server (secrets redacted).
	 */
	async getAgentTool({ agentToolId, options = {} }) {
		this.client._require({ agentToolId });
		const safeId = encodeURIComponent(agentToolId);
		return this.client(`/agent/tools/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Create an agent tool. For a webhook tool, `webhookUrl` must be an https URL that does not
	 * target a private/internal address (rejected otherwise). `webhookAuth` is stored and never
	 * echoed back.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for creating a tool.
	 * @param {Object} params.toolData - The tool fields. Required: groupId (starts with 'G'), name, description.
	 *                                   Type-specific: type ("builtin" | "webhook" | "mcp"); webhook → webhookUrl, builtin →
	 *                                   builtinKey, mcp → mcpServerUrl. Optional: subgroupId, agentProfileId (nullable = shared),
	 *                                   parametersSchema, config, channels (string[]), enabled (boolean), and webhookAuth —
	 *                                   which MUST be `{ headers?: { [name]: value }, signingSecret?: string }` (any other shape,
	 *                                   e.g. `{ header, value }`, is rejected with a 400). `headers` are sent verbatim on every
	 *                                   call (reserved/framing and `x-signalhouse-*` names are rejected); `signingSecret` makes us
	 *                                   send `X-SignalHouse-Signature: sha256=HMAC-SHA256(`${X-SignalHouse-Timestamp}.${rawBody}`)`
	 *                                   so you can verify the call and reject replays. Stored, never returned.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the toolData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The created tool returned from the server (secrets redacted).
	 */
	async createAgentTool({ toolData, options = {} }) {
		this.client._require({ toolData });
		return this.client(`/agent/tools`, { method: "POST", body: toolData, ...options });
	}

	/**
	 * Update an agent tool. The tool's scope (group/subgroup/agent) is immutable. A supplied
	 * `webhookUrl` is SSRF-checked.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for updating a tool.
	 * @param {string} params.id - The id of the tool to update.
	 * @param {Object} params.updateData - The fields to update: name, description, type, builtinKey, parametersSchema, config, webhookUrl, webhookAuth, mcpServerUrl, channels, enabled.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id or updateData parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The updated tool returned from the server (secrets redacted).
	 */
	async updateAgentTool({ id, updateData, options = {} }) {
		this.client._require({ id, updateData });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/tools/${safeId}`, { method: "PUT", body: updateData, ...options });
	}

	/**
	 * Delete an agent tool by its id.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for deleting a tool.
	 * @param {string} params.id - The id of the tool to delete.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} Throws an error if the id parameter is missing.
	 * @returns {Promise<SdkResponse<any>>} - The delete confirmation returned from the server.
	 */
	async deleteAgentTool({ id, options = {} }) {
		this.client._require({ id });
		const safeId = encodeURIComponent(id);
		return this.client(`/agent/tools/${safeId}`, { method: "DELETE", ...options });
	}
}
