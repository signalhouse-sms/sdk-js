/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Sender registrations for every jurisdiction and type: the catalog of what a region offers, retail quotes,
 * customer submissions and staff review operations. `type` selects the shape of `data`
 * (for VIRTUAL_LONG_CODE: quantity, useCases and the optional voice dossier; for GB ALPHANUMERIC_SENDER_ID: requestedSenderId,
 * trafficOrigin, trafficType and the company details).
 */
export class Registrations {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		if (enableAdmin) {
			this.admin = {
				/**
				 * Approve or reject a registration awaiting Signal House review (signalhouse only)
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for the review decision
				 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
				 * @param {("APPROVE"|"REJECT")} params.action - The review decision
				 * @param {string} [params.reason] - Why the registration was rejected; required when action is REJECT
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated registration
				 */
				reviewRegistration: async ({ registrationId, action, reason, options = {} }) => {
					this.client._require({ registrationId, action });
					const safeId = encodeURIComponent(registrationId);
					return this.client(`/registration/${safeId}/review`, {
						method: "POST",
						body: { action, reason },
						...options,
					});
				},

				/**
				 * Save corrections to the type's correctable fields for a registration the provider sent back for
				 * more information; owner, quantity, bundle and provider order never change (signalhouse only)
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for the correction
				 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
				 * @param {string} params.reason - Why the registration was corrected
				 * @param {Object} params.data - The type's correctable fields (for VIRTUAL_LONG_CODE: useCases and, for SMS + Voice, voice)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated registration
				 */
				correctRegistration: async ({ registrationId, reason, data, options = {} }) => {
					this.client._require({ registrationId, reason, data });
					const safeId = encodeURIComponent(registrationId);
					return this.client(`/registration/${safeId}/corrections`, {
						method: "POST",
						body: { reason, data },
						...options,
					});
				},

				/**
				 * Allocate a provider-owned number to a registration through the staff recovery path (signalhouse only)
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for the allocation
				 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
				 * @param {string} params.phoneNumber - The E.164 number (10-15 digits, optional leading +) to allocate
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated registration
				 */
				addNumber: async ({ registrationId, phoneNumber, options = {} }) => {
					this.client._require({ registrationId, phoneNumber });
					const safeId = encodeURIComponent(registrationId);
					return this.client(`/registration/${safeId}/numbers`, {
						method: "POST",
						body: { phoneNumber },
						...options,
					});
				},

				/**
				 * Link an existing provider order to a registration parked in RECONCILIATION_REQUIRED (signalhouse only)
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for the reconciliation
				 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
				 * @param {string} params.externalId - The provider's identifier for the existing order
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated registration
				 */
				reconcile: async ({ registrationId, externalId, options = {} }) => {
					this.client._require({ registrationId, externalId });
					const safeId = encodeURIComponent(registrationId);
					return this.client(`/registration/${safeId}/reconcile`, {
						method: "POST",
						body: { externalId },
						...options,
					});
				},

				/**
				 * Download the completed carrier application as DOCX bytes (signalhouse only)
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for the download
				 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<ArrayBuffer>>} A promise that resolves to the DOCX document as an ArrayBuffer
				 */
				getApplication: async ({ registrationId, options = {} }) => {
					this.client._require({ registrationId });
					const safeId = encodeURIComponent(registrationId);
					return this.client(`/registration/${safeId}/application`, {
						method: "GET",
						responseType: "arraybuffer",
						...options,
					});
				},
			};
		}
	}

	/**
	 * Get the registration types a region offers and whether each can be acquired right now
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the catalog
	 * @param {string} params.region - ISO-2 jurisdiction (US, GB or CA; any case of UK/GB/GBR/United Kingdom is accepted for GB)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { region, jurisdiction, sendingRequiresRegistration, registeredThrough, provisioning, types }
	 */
	async getCatalog({ region, options = {} }) {
		this.client._require({ region });
		const queryString = this.client._getQueryString({ region });
		return this.client(`/registration/catalog${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get retail quotes for a registration type: one quote per capability bundle with per-number setupAmount
	 * and monthlyAmount, the totals for the quantity (integer microdollars) and etaDays. GB ALPHANUMERIC_SENDER_ID
	 * quotes one ["SMS"] bundle (6000000 setup and 6000000 monthly by default).
	 * Unavailable (400) while the type cannot be acquired in the region.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the quote
	 * @param {string} params.region - ISO-2 jurisdiction (any case of UK/GB/GBR/United Kingdom is accepted for GB)
	 * @param {string} params.type - Registration type (e.g. VIRTUAL_LONG_CODE, or ALPHANUMERIC_SENDER_ID for GB)
	 * @param {number} [params.quantity=1] - Number of numbers to quote (1-100)
	 * @param {string} [params.groupId] - Group to price for; staff only
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { data: [quotes] }
	 */
	async getQuotes({ region, type, quantity = 1, groupId, options = {} }) {
		this.client._require({ region, type });
		const queryString = this.client._getQueryString({ region, type, quantity, groupId });
		return this.client(`/registration/quotes${queryString}`, { method: "GET", ...options });
	}

	/**
	 * List registrations for an authorized group; staff may omit groupId to read the review queue
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - The parameters for filtering the registrations
	 * @param {string} [params.groupId] - Filter by group ID
	 * @param {string} [params.subgroupId] - Filter by subgroup ID
	 * @param {string|string[]} [params.region] - Filter by one ISO-2 jurisdiction or a list
	 * @param {string} [params.type] - Filter by registration type
	 * @param {string} [params.kind] - Filter by kind (identity, program, sender)
	 * @param {string|string[]} [params.status] - Filter by one registration status or a list
	 * @param {string} [params.parentRegistrationId] - Filter by the parent registration ID
	 * @param {string} [params.phoneNumber] - Filter to registrations holding this phone number
	 * @param {string} [params.brandId] - RCS agents only: filter to agents linked to this 10DLC brand (carrier id, provisional UUID or _id)
	 * @param {string} [params.campaignId] - RCS agents only: filter to agents linked to this 10DLC campaign (campaign id or _id)
	 * @param {string} [params.sortBy] - Sort field: createdAt (default), subgroupId, registrationId, region or status
	 * @param {string} [params.sortOrder] - Sort direction: asc or desc (default)
	 * @param {number} [params.page] - Page number (default 1)
	 * @param {number} [params.limit] - Registrations per page (default 25, max 100)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { data: [registrations], totalCount, page, limit }
	 */
	async getRegistrations({ groupId, subgroupId, region, type, kind, status, parentRegistrationId, phoneNumber, brandId, campaignId, sortBy, sortOrder, page, limit, options = {} } = {}) {
		const queryString = this.client._getQueryString({ groupId, subgroupId, region, type, kind, status, parentRegistrationId, phoneNumber, brandId, campaignId, sortBy, sortOrder, page, limit });
		return this.client(`/registration${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a single registration with its review outcome, the type's public data and its status history
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting the registration
	 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the registration
	 */
	async getRegistration({ registrationId, options = {} }) {
		this.client._require({ registrationId });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}`, { method: "GET", ...options });
	}

	/**
	 * Edit a draft, or a registration Signal House rejected, before submitting it (types that keep drafts, such as
	 * RCS_AGENT). `data` is a partial of the type's create fields: for RCS_AGENT `agent` and `consent` merge field by
	 * field, every other key replaces, and `campaignId: null` unlinks the campaign. 409 once submitted.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the edit
	 * @param {string} params.registrationId - The registration ID (e.g. RCSA7K2M1QZ8RP)
	 * @param {Object} params.data - The fields to change
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated registration
	 */
	async updateRegistration({ registrationId, data, options = {} }) {
		this.client._require({ registrationId, data });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}`, { method: "PUT", body: data, ...options });
	}

	/**
	 * Check a draft against every submit requirement and the live state of its links, without writing
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the check
	 * @param {string} params.registrationId - The registration ID (e.g. RCSA7K2M1QZ8RP)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to { valid, errors: [{ field, reason }], warnings: [{ field, reason }] }
	 */
	async validateRegistration({ registrationId, options = {} }) {
		this.client._require({ registrationId });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}/validate`, { method: "POST", ...options });
	}

	/**
	 * Submit a draft. A type Signal House reviews goes to SIGNAL_HOUSE_REVIEW; a type it does not (RCS_AGENT) goes to
	 * SUBMITTING and is filed with the provider at once. A draft that fails a requirement gets a 400 whose details carry
	 * { code: "REGISTRATION_INCOMPLETE", errors, warnings }; a second submit, or one of a registration the provider
	 * already holds, gets a 409.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the submission
	 * @param {string} params.registrationId - The registration ID (e.g. RCSA7K2M1QZ8RP)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the registration, now SIGNAL_HOUSE_REVIEW or SUBMITTING
	 */
	async submitRegistration({ registrationId, options = {} }) {
		this.client._require({ registrationId });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}/submit`, { method: "POST", ...options });
	}

	/**
	 * Request the launch of a registration the provider already holds (an RCS agent in testing): the launch requirements
	 * are checked and the registration goes to SIGNAL_HOUSE_REVIEW, whose approval files the provider's launch request.
	 * Allowed while the provider reports the agent ready for testing, after a Signal House rejection, or after every
	 * carrier refused an earlier launch (409 otherwise); a failed requirement is a 400 whose details carry
	 * { code: "REGISTRATION_INCOMPLETE", errors, warnings }.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the launch request
	 * @param {string} params.registrationId - The registration ID (e.g. RCSA7K2M1QZ8RP)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the registration, now SIGNAL_HOUSE_REVIEW
	 */
	async launchRegistration({ registrationId, options = {} }) {
		this.client._require({ registrationId });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}/launch`, { method: "POST", ...options });
	}

	/**
	 * Cancel a registration. Allowed from SIGNAL_HOUSE_REVIEW, SIGNAL_HOUSE_APPROVED, PENDING_PROVIDER, NEEDS_INFORMATION,
	 * PAYMENT_REQUIRED and APPROVED (409 otherwise), and for types that keep drafts also from DRAFT and SIGNAL_HOUSE_REJECTED.
	 * Numbers already allocated stay on the account and stop sending.
	 * @async
	 * @roles api, admin, developer, user
	 * @param {Object} params - The parameters for cancelling the registration
	 * @param {string} params.registrationId - The registration ID (e.g. GB8T9GTD5AZY)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the cancelled registration
	 */
	async cancelRegistration({ registrationId, options = {} }) {
		this.client._require({ registrationId });
		const safeId = encodeURIComponent(registrationId);
		return this.client(`/registration/${safeId}`, { method: "DELETE", ...options });
	}

	/**
	 * Submit a registration. `type` selects the shape of `data`: for VIRTUAL_LONG_CODE it is { quantity (1-100),
	 * useCases (1-10 descriptions), voice? } where voice is required exactly when capabilities include VOICE. For GB
	 * ALPHANUMERIC_SENDER_ID (capabilities ["SMS"]) it is { requestedSenderId (3-11 letters/digits/space/dot/dash,
	 * at least one letter), trafficOrigin (LOCAL | INTERNATIONAL), trafficType (TRANSACTIONAL | PROMOTIONAL),
	 * companyName, companyCountry, companyWebsite, industry, messageExample, senderRelationship? } where
	 * senderRelationship is required when requestedSenderId differs from companyName; quantity is always 1 and
	 * data.phoneNumbers carries the granted sender (e.g. ["ACME"]) once APPROVED.
	 * Pass options.idempotencyKey to make a retry safe: an identical retry with the same key replays the first response.
	 * Unavailable (400) while the type cannot be acquired in the region.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for the registration
	 * @param {string} params.region - ISO-2 jurisdiction (any case of UK/GB/GBR/United Kingdom is accepted for GB)
	 * @param {string} params.type - Registration type (e.g. VIRTUAL_LONG_CODE, or ALPHANUMERIC_SENDER_ID for GB)
	 * @param {string} params.subgroupId - Subgroup that will own the registration and any allocated numbers
	 * @param {string[]} params.capabilities - One of the type's bundles, e.g. ["SMS"] or ["SMS", "VOICE"]
	 * @param {Object} params.data - The type's submission fields
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the created registration
	 */
	async createRegistration({ region, type, subgroupId, capabilities, data, options = {} }) {
		this.client._require({ region, type, subgroupId, capabilities, data });
		return this.client("/registration", {
			method: "POST",
			body: { region, type, subgroupId, capabilities, data },
			...options,
		});
	}
}
