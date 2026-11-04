/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} RcsAgentProfile
 * @property {string} [name] - Agent name shown on the handset (max 40)
 * @property {string} [description] - Agent description (max 100)
 * @property {string} [color] - Brand color, hex (default #6868ab)
 * @property {string} [logoUrl] - HTTPS URL of a 224 × 224 px logo (use uploadAsset to host one)
 * @property {string} [heroUrl] - HTTPS URL of a 1440 × 448 px hero image
 * @property {string} [phone] - Contact phone, E.164 (e.g. +18005550142)
 * @property {string} [website] - HTTPS website
 * @property {string} [email] - Contact email
 * @property {string} [phoneLabel] - Caption on the Call action (max 40; submit defaults it to "Call")
 * @property {string} [websiteLabel] - Caption on the Website action (max 40; submit defaults it to "Website")
 * @property {string} [emailLabel] - Caption on the Email action (max 40; submit defaults it to "Email")
 * @property {string} [privacyPolicyUrl] - HTTPS privacy policy URL
 * @property {string} [termsUrl] - HTTPS terms of service URL
 */

/**
 * The agent's launch text. Every field is required before submit, the opt-in URL and the launch video included.
 * @typedef {Object} RcsAgentConsent
 * @property {string} [optInDetails] - How recipients opt in (filled from the campaign's messageFlow when blank)
 * @property {string} [optInUrl] - HTTPS page that shows the opt-in
 * @property {string} [optInResponse] - The opt-in confirmation (filled from the campaign's optinMessage)
 * @property {string} [optOutDetails] - How recipients opt out
 * @property {string} [optOutResponse] - The opt-out confirmation (filled from the campaign's optoutMessage)
 * @property {string} [helpResponse] - The HELP reply (filled from the campaign's helpMessage)
 * @property {string} [campaignDescription] - What the agent sends (filled from the campaign's description)
 * @property {string[]} [messageExamples] - 1-6 example messages (filled from the campaign's samples)
 * @property {("UP_TO_10K"|"10K_100K"|"100K_500K"|"500K_1M"|"1M_PLUS")} [estimatedMonthlyVolume] - Expected monthly volume
 * @property {string} [launchVideoUrl] - HTTPS video of the opt-in flow
 */

/**
 * The individual at the brand the carrier partner's reviewers may contact about the launch. Every field is required
 * before the launch request; a shared mailbox (support@, info@) is refused.
 * @typedef {Object} RcsAgentContact
 * @property {string} [firstName] - First name (max 100)
 * @property {string} [lastName] - Last name (max 100)
 * @property {string} [role] - Role at the brand (3-75)
 * @property {string} [email] - An individual's business email
 * @property {string} [mobile] - Mobile number, E.164
 */

/**
 * Build the multipart form for an agent image upload.
 * @param {Object} params - Form fields
 * @param {("logo"|"hero")} params.kind - Which image
 * @param {Blob|File} params.file - The PNG or JPEG bytes
 * @param {string} [params.fileName] - Optional file name
 * @returns {FormData} - The form with kind and file fields
 */
export function agentAssetForm({ kind, file, fileName }) {
	const formData = new FormData();
	formData.append("kind", kind);
	if (fileName) formData.append("file", file, fileName);
	else formData.append("file", file);
	return formData;
}

/**
 * RCS agents under /rcs/agent. An agent links one 10DLC brand and one 10DLC campaign: the campaign's numbers are the
 * SMS fallback, and the brand and campaign supply the company identity and consent text for the carrier launch.
 * One brand or campaign can serve many agents. An agent is a registration (type RCS_AGENT, id RCSA…), so the
 * registrations methods read and edit the same record. 404 while the environment's RCS switch is off; 400 while the
 * group's rcsEnabled flag is off.
 */
export class RcsAgents {
	constructor(client, multipartClient) {
		this.client = client;
		this.multipartClient = multipartClient;
	}

	/**
	 * Create an agent draft on a 10DLC brand, optionally with its campaign. The agent's subgroup is the brand's.
	 * Blank consent fields fill from the linked campaign. Pass options.idempotencyKey to make a retry safe.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The agent
	 * @param {string} params.brandId - The 10DLC brand: carrier brand ID, provisional UUID or _id
	 * @param {string|null} [params.campaignId] - A 10DLC campaign of that brand: campaign ID or _id; required before submit
	 * @param {RcsAgentProfile} [params.agent] - The agent profile
	 * @param {RcsAgentConsent} [params.consent] - The launch text; required in full before the launch request
	 * @param {RcsAgentContact} [params.contact] - The launch contact; required in full before the launch request
	 * @param {("OTP"|"TRANSACTIONAL"|"PROMOTIONAL"|"MULTI_USE")} [params.useCase] - The agent's use case; required before submit
	 * @param {("NON_CONVERSATIONAL"|"CONVERSATIONAL")} [params.billingCategory] - Default NON_CONVERSATIONAL; submit refuses CONVERSATIONAL
	 * @param {{ mode?: string, channel?: string, from?: string }|null} [params.defaultFallback] - Fallback mode (auto, rcs_only, sms_only, none), channel (auto, sms, mms) and from, a number on the linked campaign
	 * @param {string[]} [params.excludedCarriers] - [] or ["T_MOBILE"] (the carrier partner's carrier name)
	 * @param {string[]} [params.testers] - Tester numbers (up to 200), invited once the agent exists at the carrier
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status DRAFT)
	 */
	async create({ brandId, campaignId, agent, consent, contact, useCase, billingCategory, defaultFallback, excludedCarriers, testers, options = {} }) {
		this.client._require({ brandId });
		return this.client("/rcs/agent", {
			method: "POST",
			body: { brandId, campaignId, agent, consent, contact, useCase, billingCategory, defaultFallback, excludedCarriers, testers },
			...options,
		});
	}

	/**
	 * List agents, newest first
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Filters
	 * @param {string} [params.groupId] - Filter by group ID
	 * @param {string} [params.subgroupId] - Filter by subgroup ID
	 * @param {string|string[]} [params.status] - DRAFT, PENDING_REVIEW, REJECTED, AGENT_CREATING or ARCHIVED, one or a list
	 * @param {string} [params.brandId] - Agents linked to this 10DLC brand (carrier brand ID, provisional UUID or _id)
	 * @param {string} [params.campaignId] - Agents linked to this 10DLC campaign (campaign ID or _id)
	 * @param {number} [params.page] - Page number (default 1)
	 * @param {number} [params.limit] - Agents per page (default 25, max 100)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { data: [agents], total, page, limit }
	 */
	async list({ groupId, subgroupId, status, brandId, campaignId, page, limit, options = {} } = {}) {
		const queryString = this.client._getQueryString({ groupId, subgroupId, status, brandId, campaignId, page, limit });
		return this.client(`/rcs/agent${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get one agent with the live state of its brand and campaign links
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.agentId - The agent ID (e.g. RCSA7K2M1QZ8RP)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent
	 */
	async get({ agentId, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}`, { method: "GET", ...options });
	}

	/**
	 * Edit an agent while it may change: a draft, a Signal House rejection, a request for changes, or an agent in
	 * testing (the change is pushed to the carrier partner). `agent`, `consent` and `contact` merge field by field;
	 * every other key replaces; campaignId: null unlinks the campaign. 409 in any other status; brandId is locked once
	 * the agent exists at the partner and billingCategory once a launch was requested.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The edit
	 * @param {string} params.agentId - The agent ID
	 * @param {string} [params.brandId] - Relink to another 10DLC brand of the same subgroup
	 * @param {string|null} [params.campaignId] - Link, relink or (null) unlink the campaign
	 * @param {RcsAgentProfile} [params.agent] - Profile fields to change
	 * @param {RcsAgentConsent} [params.consent] - Consent fields to change
	 * @param {RcsAgentContact} [params.contact] - Contact fields to change
	 * @param {string|null} [params.useCase] - The use case
	 * @param {string} [params.billingCategory] - The billing category
	 * @param {Object|null} [params.defaultFallback] - The fallback
	 * @param {string[]} [params.excludedCarriers] - [] or ["T_MOBILE"] (the carrier partner's carrier name)
	 * @param {string[]} [params.testers] - Tester numbers
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent
	 */
	async update({ agentId, brandId, campaignId, agent, consent, contact, useCase, billingCategory, defaultFallback, excludedCarriers, testers, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}`, {
			method: "PUT",
			body: { brandId, campaignId, agent, consent, contact, useCase, billingCategory, defaultFallback, excludedCarriers, testers },
			...options,
		});
	}

	/**
	 * Check an agent against the next gate on its path without writing: before it exists at the carrier partner, what
	 * creating it needs (the full profile, useCase, NON_CONVERSATIONAL billing); after that, what the launch request needs
	 * (a VERIFIED brand, the campaign, the full consent with the video, the contact)
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.agentId - The agent ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { valid, errors: [{ field, reason }], warnings: [{ field, reason }] }
	 */
	async validate({ agentId, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}/validate`, { method: "POST", ...options });
	}

	/**
	 * Submit a draft: create the agent at the carrier partner, with no review first. It needs the full profile, a
	 * useCase and NON_CONVERSATIONAL billing; otherwise a 400 whose details carry { code: "REGISTRATION_INCOMPLETE",
	 * errors, warnings }. The agent moves to AGENT_CREATING, then IN_TESTING once the partner reports it ready.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The submission
	 * @param {string} params.agentId - The agent ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status AGENT_CREATING)
	 */
	async submit({ agentId, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}/submit`, { method: "POST", ...options });
	}

	/**
	 * Request the agent's launch: the launch requirements are checked and the agent goes to Signal House review (status
	 * PENDING_REVIEW), whose approval files the launch with the carrier partner. Allowed from IN_TESTING, REJECTED and
	 * CARRIER_REJECTED (409 otherwise); a failed requirement is a 400 whose details carry { code:
	 * "REGISTRATION_INCOMPLETE", errors, warnings }. Sends POST /registration/:agentId/launch: the agent is a registration.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The launch request
	 * @param {string} params.agentId - The agent ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status PENDING_REVIEW)
	 */
	async launch({ agentId, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/registration/${encodeURIComponent(agentId)}/launch`, { method: "POST", ...options });
	}

	/**
	 * Archive an agent
	 * @async
	 * @roles api, admin, developer, user
	 * @param {Object} params - The archive request
	 * @param {string} params.agentId - The agent ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status ARCHIVED)
	 */
	async archive({ agentId, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}/archive`, { method: "POST", ...options });
	}

	/**
	 * Resend a tester's expired invitation, which starts a new 24 hours for the tester to accept it. The number must be
	 * a tester on the agent (404) and its invitation must be EXPIRED (409); up to 20 invitations go out a day (429).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The resend request
	 * @param {string} params.agentId - The agent ID
	 * @param {string} params.phoneNumber - The tester's US number, with or without the +
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent
	 */
	async resendTesterInvite({ agentId, phoneNumber, options = {} }) {
		this.client._require({ agentId, phoneNumber });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}/testers/${encodeURIComponent(phoneNumber)}/resend`, { method: "POST", ...options });
	}

	/**
	 * Host the agent's logo (224 × 224 px, 50 KB max) or hero image (1440 × 448 px, 200 KB max), PNG or JPEG, and set
	 * it on the draft. Images of any other size are refused.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The upload
	 * @param {string} params.agentId - The agent ID
	 * @param {("logo"|"hero")} params.kind - Which image
	 * @param {Blob|File} params.file - The image bytes
	 * @param {string} [params.fileName] - Optional file name
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent with the new URL
	 */
	async uploadAsset({ agentId, kind, file, fileName, options = {} }) {
		this.client._require({ agentId, kind, file });
		return this.multipartClient(`/rcs/agent/${encodeURIComponent(agentId)}/asset`, {
			method: "POST",
			body: agentAssetForm({ kind, file, fileName }),
			...options,
		});
	}
}

/**
 * RCS (Google RBM) resources. Templates for RCS live under `templates`.
 */
export class Rcs {
	constructor(client, multipartClient) {
		this.agents = new RcsAgents(client, multipartClient);
	}
}
