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
 * One recipient of an RCS send.
 * @typedef {Object} RcsRecipient
 * @property {string} phoneNumber - The number, 10-15 digits, with or without the +
 * @property {Object<string, string>} [variables] - Template variable values for this recipient
 * @property {string} [clientMessageId] - Your reference for this message (max 128)
 * @property {Object<string, string>} [metadata] - Your key-value data (up to 20 keys, values up to 500 characters)
 */

/**
 * What an RCS send does when RCS cannot reach a recipient.
 * @typedef {Object} RcsMessageFallback
 * @property {("auto"|"rcs_only"|"sms_only")} [mode] - The fallback mode
 * @property {("auto"|"sms"|"mms")} [channel] - The fallback channel
 * @property {string} [from] - The sender: a Ready number on the agent's linked Active campaign
 * @property {{ text: string, mediaUrls?: string[] }} [content] - The fallback text; omitted, the template's fallback, else a generated one, is used
 * @property {number} [validitySeconds] - How long the fallback message stays valid, in seconds
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
 * RCS agents under /rcs/agent. An agent links one brand and one campaign, of any registration type: the campaign's numbers are the
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
	 * Create an agent draft on a brand, optionally with its campaign. The agent's subgroup is the brand's.
	 * Blank consent fields fill from the linked campaign. Pass options.idempotencyKey to make a retry safe.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The agent
	 * @param {string} params.brandId - The brand: carrier brand ID, provisional UUID or _id
	 * @param {string|null} [params.campaignId] - A campaign of that brand: campaign ID or _id; required before submit
	 * @param {RcsAgentProfile} [params.agent] - The agent profile
	 * @param {RcsAgentConsent} [params.consent] - The launch text; required in full before the launch request
	 * @param {RcsAgentContact} [params.contact] - The launch contact; required in full before the launch request
	 * @param {("OTP"|"TRANSACTIONAL"|"PROMOTIONAL"|"MULTI_USE")} [params.useCase] - The agent's use case; required before submit
	 * @param {("NON_CONVERSATIONAL"|"CONVERSATIONAL")} [params.billingCategory] - Default NON_CONVERSATIONAL (per message); CONVERSATIONAL is billed per interactive session
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
	 * @param {string|string[]} [params.status] - DRAFT, PENDING_REVIEW, REJECTED, AGENT_CREATING, ARCHIVE_PENDING or ARCHIVED, one or a list
	 * @param {string} [params.brandId] - Agents linked to this brand (carrier brand ID, provisional UUID or _id)
	 * @param {string} [params.campaignId] - Agents linked to this campaign (campaign ID or _id)
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
	 * @param {string} [params.brandId] - Relink to another brand of the same subgroup
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
	 * creating it needs (the full profile, useCase, a billingCategory); after that, what the launch request needs
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
	 * useCase and a billingCategory; otherwise a 400 whose details carry { code: "REGISTRATION_INCOMPLETE",
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
	 * The request charges the agent's launch fees: a wallet that cannot cover them gets a 402, and the agent stays where it is. When any fee is due the request must set acknowledgeFees: true, or it gets a 400 with code FEE_ACKNOWLEDGEMENT_REQUIRED and nothing is held; a launch with nothing due needs no acknowledgement. The agent's launchFees quotes what the next request charges.
	 * When the agent's brand vertical is healthcare or insurance, the launch needs the protected health information (PHI) disclosure acknowledged: send acknowledgePhi: true, or the request gets a 400 REGISTRATION_INCOMPLETE whose errors name consent.phiAcknowledgement. The API records the acknowledgement as consent.phiAcknowledgement { acknowledgedAt, acknowledgedBy } from the caller; the client sends only the boolean, and an agent update cannot set it. Once recorded, a later launch request needs no new acknowledgement.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The launch request
	 * @param {string} params.agentId - The agent ID
	 * @param {boolean} [params.acknowledgeFees] - Accept the fees due; required when any are
	 * @param {boolean} [params.acknowledgePhi] - Accept the PHI disclosure; required for a healthcare or insurance brand
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status PENDING_REVIEW)
	 */
	async launch({ agentId, acknowledgeFees, acknowledgePhi, options = {} }) {
		this.client._require({ agentId });
		return this.client(`/registration/${encodeURIComponent(agentId)}/launch`, { method: "POST", body: { acknowledgeFees, acknowledgePhi }, ...options });
	}

	/**
	 * Archive an agent. One the carrier partner created stops sending at once and stays ARCHIVE_PENDING until Signal House confirms the partner cancelled it, then ARCHIVED. Archiving cannot be undone; an agent already ARCHIVE_PENDING answers 409.
	 * @async
	 * @roles api, admin, developer, user
	 * @param {Object} params - The archive request
	 * @param {string} params.agentId - The agent ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent (status ARCHIVE_PENDING or ARCHIVED)
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
	 * Remove a tester at once, at any point before the agent is archived. The number must be a tester on the agent (404);
	 * an archived agent answers 409.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The removal
	 * @param {string} params.agentId - The agent ID
	 * @param {string} params.phoneNumber - The tester's US number, with or without the +
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the agent
	 */
	async removeTester({ agentId, phoneNumber, options = {} }) {
		this.client._require({ agentId, phoneNumber });
		return this.client(`/rcs/agent/${encodeURIComponent(agentId)}/testers/${encodeURIComponent(phoneNumber)}`, { method: "DELETE", ...options });
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
 * RCS messages. Sends go through an agent to POST /message/rcs. A message is a Message record (messageType RCS), so the
 * messages methods read the same record. 404 while the environment's RCS switch is off; 403 while the group's rcsEnabled
 * flag is off; 409 while the agent cannot send yet.
 */
export class RcsMessages {
	/**
	 * Keep the JSON client every RCS message request goes through.
	 * @param {any} client - The JSON request client
	 */
	constructor(client) {
		this.client = client;
	}

	/**
	 * Send an RCS message to up to 100 recipients. A check that blocks one recipient writes a BLOCKED message for it and the
	 * rest still send. Pass options.idempotencyKey to make a retry safe.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The send
	 * @param {string} params.agentId - The agent that sends (RCSA…)
	 * @param {RcsRecipient[]} params.recipients - Up to 100 recipients
	 * @param {string} [params.templateId] - A template to send; exactly one of templateId or content
	 * @param {number} [params.templateVersion] - A published version of templateId; needs templateId
	 * @param {Object} [params.content] - Inline content; exactly one of templateId or content
	 * @param {string} [params.contentFormat] - content.v1 (default) or google.rcs
	 * @param {("AUTHENTICATION"|"TRANSACTION"|"SERVICEREQUEST"|"ACKNOWLEDGEMENT"|"PROMOTION")} [params.trafficType] - Required on a MULTI_USE agent when the template sets none
	 * @param {number} [params.ttlSeconds] - Seconds the RCS message may wait for delivery; at most one of ttlSeconds or expireTime
	 * @param {string} [params.expireTime] - ISO-8601 time the RCS message expires
	 * @param {RcsMessageFallback} [params.fallback] - The fallback for this send
	 * @param {string} [params.statusCallbackUrl] - URL that receives this message's status events
	 * @param {boolean} [params.enableShortlink] - Shorten the links in the message
	 * @param {boolean} [params.isTest] - Send as a test; approved testers only
	 * @param {("not_capable"|"ttl_expired"|"delivered"|"read")} [params.simulate] - Simulate this outcome; approved testers only
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { requested, enqueued, failed, bulkId, messages } (201). A blocked row carries blockReason, reason and issues; an archived template answers 409 TEMPLATE_ARCHIVED. A recipient from 19999990000 to 19999990359 makes the whole request a simulation, as on SMS: it resolves to { simulated: true, webhooks } and nothing is stored, sent or charged
	 */
	async send({ agentId, recipients, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback, statusCallbackUrl, enableShortlink, isTest, simulate, options = {} }) {
		this.client._require({ agentId, recipients });
		return this.client("/message/rcs", {
			method: "POST",
			body: { agentId, recipients, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback, statusCallbackUrl, enableShortlink, isTest, simulate },
			...options,
		});
	}

	/**
	 * Check a send without writing anything. Takes the same parameters as send.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The send to check
	 * @param {string} params.agentId - The agent that sends (RCSA…)
	 * @param {RcsRecipient[]} params.recipients - Up to 100 recipients
	 * @param {string} [params.templateId] - A template to send; exactly one of templateId or content
	 * @param {number} [params.templateVersion] - A published version of templateId; needs templateId
	 * @param {Object} [params.content] - Inline content; exactly one of templateId or content
	 * @param {string} [params.contentFormat] - content.v1 (default) or google.rcs
	 * @param {("AUTHENTICATION"|"TRANSACTION"|"SERVICEREQUEST"|"ACKNOWLEDGEMENT"|"PROMOTION")} [params.trafficType] - Required on a MULTI_USE agent when the template sets none
	 * @param {number} [params.ttlSeconds] - Seconds the RCS message may wait for delivery; at most one of ttlSeconds or expireTime
	 * @param {string} [params.expireTime] - ISO-8601 time the RCS message expires
	 * @param {RcsMessageFallback} [params.fallback] - The fallback for this send
	 * @param {string} [params.statusCallbackUrl] - URL that receives this message's status events
	 * @param {boolean} [params.enableShortlink] - Shorten the links in the message
	 * @param {boolean} [params.isTest] - Send as a test; approved testers only
	 * @param {("not_capable"|"ttl_expired"|"delivered"|"read")} [params.simulate] - Simulate this outcome; approved testers only
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { valid, errors, warnings, billingClass, segments, estimatedCostMicros, unsupportedFiles, recipients }. valid is true only with no errors; each blocked recipient adds an error and carries blockReason, reason and issues
	 */
	async validate({ agentId, recipients, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback, statusCallbackUrl, enableShortlink, isTest, simulate, options = {} }) {
		this.client._require({ agentId, recipients });
		return this.client("/message/rcs/validate", {
			method: "POST",
			body: { agentId, recipients, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback, statusCallbackUrl, enableShortlink, isTest, simulate },
			...options,
		});
	}

	/**
	 * Price an RCS draft; no charge or send. Sends POST /message/estimate with channel "rcs". Amounts are microdollars.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The draft
	 * @param {string} params.agentId - The agent that would send (RCSA…)
	 * @param {RcsRecipient[]} [params.recipients] - Named recipients; exactly one of recipients or recipientCount
	 * @param {number} [params.recipientCount] - A recipient count; carriers are unknown, so the default fees apply
	 * @param {string} [params.templateId] - A template to price; exactly one of templateId or content
	 * @param {number} [params.templateVersion] - A published version of templateId; needs templateId
	 * @param {Object} [params.content] - Inline content; exactly one of templateId or content
	 * @param {string} [params.contentFormat] - content.v1 (default) or google.rcs
	 * @param {("AUTHENTICATION"|"TRANSACTION"|"SERVICEREQUEST"|"ACKNOWLEDGEMENT"|"PROMOTION")} [params.trafficType] - Required on a MULTI_USE agent when the template sets none
	 * @param {number} [params.ttlSeconds] - Seconds the RCS message may wait for delivery; at most one of ttlSeconds or expireTime
	 * @param {string} [params.expireTime] - ISO-8601 time the RCS message expires
	 * @param {RcsMessageFallback} [params.fallback] - The fallback to price; its from is optional here, and with none the leg is priced on the channel of the agent's linked campaign
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { billingClass, segments, recipientCount, rcsLeg, fallbackLeg, totals, balance, issues, warnings }; rcsLeg.mediaSurcharge is the carrier's surcharge on media over 5 MB for one recipient, and rcsLeg.cost already holds it for every recipient; rcsLeg.cost is null with the fallback mode sms_only; a message over 100 MB adds a MEDIA_TOO_LARGE issue.
	 */
	async estimate({ agentId, recipients, recipientCount, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback, options = {} }) {
		this.client._require({ agentId });
		return this.client("/message/estimate", {
			method: "POST",
			body: { channel: "rcs", agentId, recipients, recipientCount, templateId, templateVersion, content, contentFormat, trafficType, ttlSeconds, expireTime, fallback },
			...options,
		});
	}

	/**
	 * Report which numbers can receive RCS from an agent
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.agentId - The agent (RCSA…)
	 * @param {string[]} params.phoneNumbers - Up to 500 numbers, 10-15 digits, with or without the +
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { results: [{ phoneNumber, capability, rcsEnabled, reason, features, carrier, checkedAt, cached }] }, capability being ENABLED, UNREACHABLE or UNKNOWN, and reason CAPABLE, NOT_CAPABLE, NOT_LAUNCHED_ON_CARRIER or UNKNOWN; rcsEnabled is true only for CAPABLE, carrier and checkedAt may be null, and features is empty today
	 */
	async capabilities({ agentId, phoneNumbers, options = {} }) {
		this.client._require({ agentId, phoneNumbers });
		return this.client("/rcs/capabilities", { method: "POST", body: { agentId, phoneNumbers }, ...options });
	}

	/**
	 * Fake an inbound event from an approved tester of the agent, with no carrier involved: it runs the real inbound handlers and webhooks, as free test traffic. A simulated STOP really opts the tester out; a simulated START clears it. Anyone else gets a 403 with code NOT_TESTER. Returns 202 with { status, messageId }.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The event
	 * @param {string} params.agentId - The agent (RCSA…)
	 * @param {string} params.from - The approved tester's number
	 * @param {string} params.type - TEXT, SUGGESTION, LOCATION, FILE or UNSUBSCRIBE
	 * @param {string} [params.text] - The text; required for TEXT
	 * @param {string} [params.postbackData] - The tapped suggestion's postback; SUGGESTION needs this or buttonId
	 * @param {string} [params.messageId] - The message a tap answers; the latest message delivered to the tester by default
	 * @param {string} [params.buttonId] - The suggestion's position, as webhooks report it
	 * @param {number} [params.latitude] - Required for LOCATION
	 * @param {number} [params.longitude] - Required for LOCATION
	 * @param {string} [params.fileName] - The file's name, for FILE
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { status: "QUEUED", messageId }
	 */
	async simulateInbound({ agentId, from, type, text, postbackData, messageId, buttonId, latitude, longitude, fileName, options = {} }) {
		this.client._require({ agentId, from, type });
		return this.client("/message/rcs/simulate-inbound", { method: "POST", body: { agentId, from, type, text, postbackData, messageId, buttonId, latitude, longitude, fileName }, ...options });
	}

	/**
	 * Get one message by its ID. The same route as messages.getMessage.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.messageId - The message ID
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the message; an unknown ID is a 404
	 */
	async get({ messageId, options = {} }) {
		this.client._require({ messageId });
		return this.client(`/message/${encodeURIComponent(messageId)}`, { method: "GET", ...options });
	}

	/**
	 * List RCS messages. Sends GET /message with messageType RCS. A fallback leg is an SMS or MMS message: read it with
	 * messages.getMessage and the parent's fallbackMessageId.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The group, the date range and the filters
	 * @param {string} params.groupId - The group whose messages to list
	 * @param {string} params.from - ISO-8601 date or timestamp; sent as startDate
	 * @param {string} params.to - ISO-8601 date or timestamp; sent as endDate
	 * @param {string} [params.agentId] - Messages this agent sent; sent as registrationId
	 * @param {string} [params.status] - Filter by status (ENQUEUED, DEQUEUED, SENT, FAILED, DELIVERED, READ, EXPIRED, FALLBACK, BLOCKED)
	 * @param {number} [params.page] - Page number
	 * @param {number} [params.limit] - Messages per page
	 * @param {string} [params.templateId] - Messages sent from this template
	 * @param {number} [params.templateVersion] - Messages sent from this template version
	 * @param {string} [params.bulkId] - Messages of one send
	 * @param {string} [params.fallbackReason] - Why the fallback ran (NOT_CAPABLE, CARRIER_NOT_LAUNCHED, TTL_EXPIRED, RCS_ERROR, PROVIDER_ERROR, SMS_ONLY)
	 * @param {string} [params.billingClass] - Filter by billing class (RICH, RICH_MEDIA)
	 * @param {string} [params.deliveredChannel] - Filter by the channel that delivered the message (rcs, sms, mms)
	 * @param {boolean} [params.isTest] - true for test messages only, false to leave them out
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the list of messages
	 */
	async list({ groupId, from, to, agentId, status, page, limit, templateId, templateVersion, bulkId, fallbackReason, billingClass, deliveredChannel, isTest, options = {} }) {
		this.client._require({ groupId, from, to });
		const queryString = this.client._getQueryString({ registrationId: agentId, startDate: from, endDate: to, groupId, status, page, limit, templateId, templateVersion, bulkId, fallbackReason, billingClass, deliveredChannel, isTest, messageType: "RCS", dateBounds: "exact" });
		return this.client(`/message${queryString}`, { method: "GET", ...options });
	}
}

/**
 * RCS (Google RBM) resources. Templates for RCS live under `templates`.
 */
export class Rcs {
	constructor(client, multipartClient) {
		this.agents = new RcsAgents(client, multipartClient);
		this.messages = new RcsMessages(client);
	}
}
