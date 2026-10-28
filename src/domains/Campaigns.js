/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} CreateCampaignData
 * @property {string} brandId - The ID of the brand associated with the campaign (required)
 * @property {string} usecase - The use case for the campaign (2FA, ACCOUNT_NOTIFICATION, AGENTS_FRANCHISES, CARRIER_EXEMPT, CHARITY, CUSTOMER_CARE, DELIVERY_NOTIFICATION, EMERGENCY, FRAUD_ALERT, HIGHER_EDUCATION, K12_EDUCATION, LOW_VOLUME, M2M, MARKETING, MIXED, POLITICAL, POLLING_VOTING, PROXY, PUBLIC_SAFETY_RESTRICTED, PUBLIC_SERVICE_ANNOUNCEMENT, SECURITY_ALERT, SOCIAL, SOLE_PROPRIETOR, SWEEPSTAKE, TRIAL, UCAAS_HIGH, UCAAS_LOW)
 * @property {Array<string>} [subUsecases] - An array of sub-use cases for the campaign (2FA, ACCOUNT_NOTIFICATION, AGENTS_FRANCHISES, CARRIER_EXEMPT, CHARITY, CUSTOMER_CARE, DELIVERY_NOTIFICATION, EMERGENCY, FRAUD_ALERT, HIGHER_EDUCATION, K12_EDUCATION, LOW_VOLUME, M2M, MARKETING, MIXED, POLITICAL, POLLING_VOTING, PROXY, PUBLIC_SAFETY_RESTRICTED, PUBLIC_SERVICE_ANNOUNCEMENT, SECURITY_ALERT, SOLE_PROPRIETOR, SWEEPSTAKE, TRIAL, UCAAS_HIGH, UCAAS_LOW — NOT SOCIAL, which TCR rejects as a sub-usecase for every parent usecase even though it is valid as the top-level `usecase`)
 * @property {string} description - A detailed description of the campaign (required, must be between 40 and 4096 characters)
 * @property {boolean} [embeddedLink=true] - Whether the campaign includes an embedded link (optional, defaults to true)
 * @property {boolean} [embeddedPhone=false] - Whether the campaign includes an embedded phone number (optional, defaults to false)
 * @property {boolean} [termsAndConditions=true] - Whether the campaign includes terms and conditions (optional, defaults to true)
 * @property {boolean} [numberPool=false] - Whether the campaign uses a number pool (optional, defaults to false)
 * @property {boolean} [ageGated=false] - Whether the campaign is age-gated (optional, defaults to false)
 * @property {boolean} [directLending=false] - Whether the campaign uses direct lending (optional, defaults to false)
 * @property {boolean} [subscriberOptIn=true] - Whether the campaign requires subscriber opt-in (optional, defaults to true)
 * @property {boolean} [subscriberOptOut=true] - Whether the campaign allows subscriber opt-out (optional, defaults to true)
 * @property {boolean} [subscriberHelp=true] - Whether the campaign provides subscriber help (optional, defaults to true)
 * @property {string} [sample1] - Sample message 1 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample2] - Sample message 2 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample3] - Sample message 3 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample4] - Sample message 4 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample5] - Sample message 5 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} messageFlow - A detailed description of the message flow for the campaign (required, must be between 40 and 4096 characters)
 * @property {string} [helpMessage] - A message providing help information for the campaign (optional)
 * @property {boolean} [autoRenewal=true] - Whether the campaign should auto-renew (optional, defaults to true)
 * @property {string} [tag] - A tag for the campaign (optional, must be at most 255 characters)
 * @property {string} [optinKeywords="START,SUBSCRIBE"] - A comma-separated list of keywords for opting in to the campaign (optional, defaults to "START,SUBSCRIBE", must be at most 255 characters)
 * @property {string} [optoutKeywords="STOP,UNSUBSCRIBE"] - A comma-separated list of keywords for opting out of the campaign (optional, defaults to "STOP,UNSUBSCRIBE", must be at most 255 characters)
 * @property {string} [helpKeywords="HELP"] - A comma-separated list of keywords for getting help with the campaign (optional, defaults to "HELP", must be at most 255 characters)
 * @property {string} [optinMessage] - A message sent to users when they opt in to the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [optoutMessage] - A message sent to users when they opt out of the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} privacyPolicyLink - A URL linking to the privacy policy for the campaign (required, must be at most 2048 characters)
 * @property {string} termsAndConditionsLink - A URL linking to the terms and conditions for the campaign (required, must be at most 2048 characters)
 * @property {string} [embeddedLinkSample] - A sample of the embedded link used in the campaign (optional, must be at most 255 characters)
 * @property {string[]} [sampleMediaIds] - Up to 5 mediaIds from uploadSampleMedia: sample MMS media shown to carrier and TCR reviewers (10DLC only)
 * @property {Array<string>} phoneNumbers - An array of phone numbers associated with the campaign (required, each number must be at least 10 digits and contain only digits, a maximum of 5000 numbers is allowed)
 */

/**
 * @typedef {Object} UpdateCampaignData
 * @property {string} [usecase] - The use case for the campaign (2FA, ACCOUNT_NOTIFICATION, AGENTS_FRANCHISES, CARRIER_EXEMPT, CHARITY, CUSTOMER_CARE, DELIVERY_NOTIFICATION, EMERGENCY, FRAUD_ALERT, HIGHER_EDUCATION, K12_EDUCATION, LOW_VOLUME, M2M, MARKETING, MIXED, POLITICAL, POLLING_VOTING, PROXY, PUBLIC_SAFETY_RESTRICTED, PUBLIC_SERVICE_ANNOUNCEMENT, SECURITY_ALERT, SOCIAL, SOLE_PROPRIETOR, SWEEPSTAKE, TRIAL, UCAAS_HIGH, UCAAS_LOW)
 * @property {Array<string>} [subUsecases] - An array of sub-use cases for the campaign (2FA, ACCOUNT_NOTIFICATION, AGENTS_FRANCHISES, CARRIER_EXEMPT, CHARITY, CUSTOMER_CARE, DELIVERY_NOTIFICATION, EMERGENCY, FRAUD_ALERT, HIGHER_EDUCATION, K12_EDUCATION, LOW_VOLUME, M2M, MARKETING, MIXED, POLITICAL, POLLING_VOTING, PROXY, PUBLIC_SAFETY_RESTRICTED, PUBLIC_SERVICE_ANNOUNCEMENT, SECURITY_ALERT, SOLE_PROPRIETOR, SWEEPSTAKE, TRIAL, UCAAS_HIGH, UCAAS_LOW — NOT SOCIAL, which TCR rejects as a sub-usecase for every parent usecase even though it is valid as the top-level `usecase`)
 * @property {string} [description] - A detailed description of the campaign (optional, must be between 40 and 4096 characters if provided)
 * @property {boolean} [embeddedLink] - Whether the campaign includes an embedded link (optional)
 * @property {boolean} [embeddedPhone] - Whether the campaign includes an embedded phone number (optional)
 * @property {boolean} [termsAndConditions] - Whether the campaign includes terms and conditions (optional)
 * @property {boolean} [numberPool] - Whether the campaign uses a number pool (optional)
 * @property {boolean} [ageGated] - Whether the campaign is age-gated (optional)
 * @property {boolean} [directLending] - Whether the campaign uses direct lending (optional)
 * @property {boolean} [subscriberOptIn] - Whether the campaign requires subscriber opt-in (optional)
 * @property {boolean} [subscriberOptOut] - Whether the campaign allows subscriber opt-out (optional)
 * @property {boolean} [subscriberHelp] - Whether the campaign provides subscriber help (optional)
 * @property {string} [sample1] - Sample message 1 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample2] - Sample message 2 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample3] - Sample message 3 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample4] - Sample message 4 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [sample5] - Sample message 5 for the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [messageFlow] - A detailed description of the message flow for the campaign (optional, must be between 40 and 4096 characters if provided)
 * @property {string} [helpMessage] - A message providing help information for the campaign (optional)
 * @property {boolean} [autoRenewal] - Whether the campaign should auto-renew (optional)
 * @property {string} [tag] - A tag for the campaign (optional, must be at most 255 characters)
 * @property {string} [optinKeywords] - A comma-separated list of keywords for opting in to the campaign (optional, must be at most 255 characters)
 * @property {string} [optoutKeywords] - A comma-separated list of keywords for opting out of the campaign (optional, must be at most 255 characters)
 * @property {string} [helpKeywords] - A comma-separated list of keywords for getting help with the campaign (optional, must be at most 255 characters)
 * @property {string} [optinMessage] - A message sent to users when they opt in to the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [optoutMessage] - A message sent to users when they opt out of the campaign (optional, must be between 20 and 1024 characters if provided)
 * @property {string} [privacyPolicyLink] - A URL linking to the privacy policy for the campaign (optional, must be at most 2048 characters if provided)
 * @property {string} [termsAndConditionsLink] - A URL linking to the terms and conditions for the campaign (optional, must be at most 2048 characters if provided)
 * @property {string} [embeddedLinkSample] - A sample of the embedded link used in the campaign (optional, must be at most 255 characters if provided)
 * @property {string[]} [sampleMediaIds] - Up to 5 mediaIds from uploadSampleMedia: sample MMS media shown to carrier and TCR reviewers (10DLC only)
 * @property {Object} [tollFree] - Toll-Free editable fields, used when updating a Toll-Free campaign. Mirrors the CreateTollFreeCampaignData `tollFree` object with every field optional (useCase, messageVolume, programSummary (40-500), exampleMessage (≤1000), customerCareEmail, optInImageURLs, optIns, multiNumberReason (≤500), useCases, channels, landingId). Phone numbers cannot be changed via update — Toll-Free numbers are locked to their campaign.
 */

/**
 * @typedef {Object} TollFreeOptIn
 * @property {string} [callToAction] - The opt-in call-to-action text for this channel (optional, 20-1024 characters when provided)
 * @property {string} [url] - The opt-in web URL (web channel only, optional, at most 2048 characters)
 * @property {Array<string>} [keywords] - The opt-in keywords (keyword channel only, optional)
 */

/**
 * @typedef {Object} TollFreeCampaignDetails
 * @property {string} useCase - The Toll-Free use case (required, e.g. TWO_FA, GENERAL_MARKETING, HEALTHCARE, MIXED — one of the Toll-Free use-case values)
 * @property {string} messageVolume - The estimated monthly message volume tier (required, one of TEN, HUNDRED, THOUSAND, TEN_THOUSAND, HUNDRED_THOUSAND, TWO_HUNDRED_FIFTY_THOUSAND, FIVE_HUNDRED_THOUSAND, SEVEN_HUNDRED_FIFTY_THOUSAND, ONE_MILLION, FIVE_MILLION, TEN_MILLION_PLUS)
 * @property {string} programSummary - A summary of the messaging program (required, 40-500 characters)
 * @property {string} exampleMessage - An example message (required, at most 1000 characters; holds one sample per use case, stored verbatim, no STOP/HELP appended by the server)
 * @property {string} customerCareEmail - A customer-care contact email (required, valid email)
 * @property {Array<string>} optInImageURLs - URLs to opt-in proof images (required, at least one, each at most 2048 characters)
 * @property {Object} [optIns] - Opt-in method details. Each channel is optional.
 * @property {TollFreeOptIn} [optIns.verbal] - Verbal opt-in details
 * @property {TollFreeOptIn} [optIns.web] - Online (web) opt-in details
 * @property {TollFreeOptIn} [optIns.keyword] - Keyword opt-in details
 * @property {TollFreeOptIn} [optIns.interactiveVoiceResponse] - IVR opt-in details
 * @property {string} [multiNumberReason] - Internally-stored reason the customer requested more than one Toll-Free number on the campaign (optional, at most 500 characters). Required when more than one phone number is assigned; captured for Signal House review only and never sent to the carrier.
 * @property {string[]} [useCases] - The sender's real use-case picks (optional). `useCase` above carries the single value the carrier accepts (MIXED when there is more than one); these are what a Signal House landing page renders a consent checkbox per. Carriers that need specific use cases rather than MIXED take them from here when present; other carriers never receive them.
 * @property {string[]} [channels] - The channels consent covers ("SMS", "MMS", "VOICE") (optional). Never forwarded to the carrier.
 * @property {string} [landingId] - The Signal House landing page whose consent boxes this campaign's call-to-action describes (optional). Must be an ACTIVE page owned by the same brand and group.
 */

/**
 * @typedef {Object} CreateTollFreeCampaignData
 * @property {string} brandId - The ID of the Toll-Free brand associated with the campaign (required, at least 7 characters)
 * @property {TollFreeCampaignDetails} tollFree - The Toll-Free campaign details (required)
 * @property {string} [privacyPolicyLink] - A URL linking to the privacy policy (at most 2048 characters). Required when the brand's `tollFree.requiresPrivacyPolicy` is true and the brand has no `privacyPolicyLink` of its own; optional otherwise.
 * @property {string} [termsAndConditionsLink] - A URL linking to the terms and conditions (at most 2048 characters). Required when the brand's `tollFree.requiresTermsAndConditions` is true and the brand has no `termsAndConditionsLink` of its own; optional otherwise.
 * @property {string} [tag] - A tag for the campaign (optional, at most 255 characters)
 * @property {boolean} [autoRenewal=true] - Whether the campaign should auto-renew (optional, defaults to true)
 * @property {Array<string>} phoneNumbers - The Toll-Free numbers to assign to the campaign (required, 1 up to the brand's tollFree.maxNumbersPerCampaign and at most 5, each at least 10 digits and digits only). The numbers must be on the brand's toll-free carrier, or the campaign is refused. Numbers are locked to the campaign once assigned and cannot be moved or added afterward.
 */

/**
 * @typedef {Object} ShortCodeDetails
 * @property {Array<string>} useCases - Selected use cases (required, at least 1; ALERTS, CHAT, DONATION, FRAUD_ALERTS, PROMOTIONAL_MARKETING, PUBLIC_SERVICE_ANNOUNCEMENT, SWEEPSTAKES_CONTEST, TWO_FACTOR_AUTHENTICATION, VOTING_POLLING, POLITICAL, EMERGENCY_NOTIFICATIONS, DELIVERY_NOTIFICATIONS, SECURITY_ALERTS)
 * @property {Array<string>} optInMethods - Selected opt-in methods (required, at least 1; IVR_POS, WEB, TV, PRINT, KEYWORD, VERBAL, RADIO)
 * @property {Object<string, string>} optInMethodDescriptions - Generated-but-editable description per selected opt-in method, keyed by the method value (each 20-2048 characters, required for every selected method)
 * @property {string} messageFrequency - "RECURRING" or "SINGLE" (required)
 * @property {string} pricingTier - "STANDARD" or "FTEU" (required)
 * @property {boolean} [adultContent=false] - Whether the campaign contains adult (SHAFT) content
 * @property {string} [doubleOptInMessage] - Required when adultContent is true (20-1024 characters)
 * @property {string} programSummary - Generated-but-editable campaign/program summary (required, 40-2048 characters)
 * @property {string} optInConfirmationMessage - The opt-in confirmation message (required, 20-1024 characters)
 * @property {string} optInUrl - Public HTTPS URL for the live opt-in experience, shown to reviewers as a link (required; private, local, and credentialed URLs are rejected)
 * @property {string} screenshotUrl - Hosted opt-in proof screenshot URL returned by `uploadOptInImage` (required). Must be a Signal House-hosted opt-in image owned by your group; external URLs are rejected
 */

/**
 * @typedef {Object} CreateShortCodeCampaignData
 * @property {string} brandId - The ID of the approved (VERIFIED) Short Code brand (required, at least 7 characters)
 * @property {string} privacyPolicyLink - A URL linking to the privacy policy (required, at most 2048 characters)
 * @property {string} termsAndConditionsLink - A URL linking to the terms and conditions (required, at most 2048 characters)
 * @property {string} optinMessage - Opt-in response message (required, 20-1024 characters)
 * @property {string} optoutMessage - Opt-out response message (required, 20-1024 characters)
 * @property {string} helpMessage - HELP response message (required, 20-1024 characters)
 * @property {string} sample1 - Sample message 1 (required, 20-1024 characters)
 * @property {string} sample2 - Sample message 2 (required, 20-1024 characters)
 * @property {string} sample3 - Sample message 3 (required, 20-1024 characters)
 * @property {string} [tag] - A tag for the campaign (optional, at most 255 characters)
 * @property {ShortCodeDetails} shortCode - The Short Code campaign details (required)
 */

export class Campaigns {
  constructor(client, multipartClient, enableAdmin) {
    this.client = client;
    this.multipartClient = multipartClient;
    this.enableAdmin = enableAdmin;

    if (enableAdmin) {
      this.admin = {
        /**
         * Approve a campaign that is pending approval
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for approving the campaign
         * @param {string} params.campaignId - The ID of the campaign to approve
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @throws {Error} Throws an error if the campaignId parameter is missing
         * @returns {Promise<SdkResponse<any>>} The response from the server
         */
        approveCampaign: async ({ campaignId, options = {} }) => {
          this.client._require({ campaignId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/approve/${safeCampaignId}`, { method: 'POST', ...options });
        },
        /**
         * Reject a campaign that is pending approval
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for rejecting the campaign
         * @param {string} params.campaignId - The ID of the campaign to reject
         * @param {RequestOptions} [params.options] - Additional options for the request (body should include { rejectionReason })
         * @throws {Error} Throws an error if the campaignId parameter is missing
         * @returns {Promise<SdkResponse<any>>} The response from the server
         */
        rejectCampaign: async ({ campaignId, options = {} }) => {
          this.client._require({ campaignId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/reject/${safeCampaignId}`, { method: 'POST', ...options });
        },
        /**
         * Get CNP campaigns shared with Signal House
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for retrieving CNP campaigns
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @returns {Promise<SdkResponse<Array>>} The response from the server
         */
        getCNPCampaigns: async ({ options = {} } = {}) => {
          return this.client(`/campaign/cnp`, { method: 'GET', ...options });
        },
        /**
         * Transition a Short Code campaign's review status. A customer-visible reason is
         * required for both rejection states ("REJECTED" = Signal House Rejected, "DCA_REJECTED" =
         * Rejected). Selecting "PENDING_DCA_APPROVAL" runs the guarded carrier-review transition;
         * fulfillment remains a separate staff operation.
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for the status transition
         * @param {string} params.campaignId - The ID of the campaign to transition
         * @param {string} params.status - The target status: "PENDING_REVIEW", "REJECTED", "PENDING_DCA_APPROVAL", "DCA_REJECTED", or "ACTIVE". "PENDING_DCA_APPROVAL" requires a Signal House-approved Short Code brand, issued code, and captured opt-in proof.
         * @param {string} [params.rejectionReason] - Required, nonblank reason for "REJECTED"/"DCA_REJECTED" (max 1024 characters)
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @throws {Error} Throws an error if the campaignId or status parameter is missing
         * @returns {Promise<SdkResponse<any>>} The updated campaign
         */
        updateShortCodeCampaignStatus: async ({ campaignId, status, rejectionReason, options = {} }) => {
          this.client._require({ campaignId, status });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/status`, {
            method: 'PUT',
            body: { status, rejectionReason },
            ...options,
          });
        },
        /**
         * Fulfill a campaign-bound Signal House Short Code request.
         * @async
         * @roles signalhouse
         * @param {Object} params - Fulfillment parameters.
         * @param {string} params.campaignId - Campaign identifier.
         * @param {string} params.actualCode - Issued five- or six-digit Short Code.
         * @param {string} params.leaseEndDate - Fixed future lease end date. A YYYY-MM-DD value expires at 23:59:59 UTC; timestamps retain their supplied time.
         * @param {string} [params.internalNotes] - Staff-only fulfillment notes.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The updated campaign.
         */
        fulfillShortCodeCampaign: async ({ campaignId, actualCode, leaseEndDate, internalNotes, options = {} }) => {
          this.client._require({ campaignId, actualCode, leaseEndDate });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/fulfill`, {
            method: 'POST',
            body: { actualCode, leaseEndDate, internalNotes },
            ...options,
          });
        },
        /**
         * Submit an internally approved Short Code campaign to carrier review.
         * @async
         * @roles signalhouse
         * @param {Object} params - Submission parameters.
         * @param {string} params.campaignId - Campaign identifier.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The updated campaign.
         */
        submitShortCodeCampaignToCarrier: async ({ campaignId, options = {} }) => {
          this.client._require({ campaignId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/submit-to-carrier`, {
            method: 'POST',
            ...options,
          });
        },
        /**
         * Confirm Registry offboarding and complete a pending Short Code cancellation.
         * @async
         * @param {Object} params - Request parameters.
         * @param {string} params.campaignId - Campaign identifier.
         * @param {string} params.requestId - The pending cancellation request to complete.
         * @param {string} [params.note] - Operator note recorded with the completion.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The updated campaign.
         */
        completeShortCodeCancellation: async ({ campaignId, requestId, note, options = {} }) => {
          this.client._require({ campaignId, requestId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/cancellation/complete`, {
            method: 'POST',
            body: { requestId, note },
            ...options,
          });
        },
        /**
         * Dismiss a pending Short Code cancellation and restore its prior lifecycle state.
         * @async
         * @param {Object} params - Request parameters.
         * @param {string} params.campaignId - Campaign identifier.
         * @param {string} params.requestId - The pending cancellation request to dismiss.
         * @param {string} [params.note] - Operator note recorded with the dismissal.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The updated campaign.
         */
        dismissShortCodeCancellation: async ({ campaignId, requestId, note, options = {} }) => {
          this.client._require({ campaignId, requestId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/cancellation/dismiss`, {
            method: 'POST',
            body: { requestId, note },
            ...options,
          });
        },
        /**
         * Read expired Short Code leases awaiting manual Registry offboarding.
         * @async
         * @param {Object} [params] - Request parameters.
         * @param {number} [params.page] - Page number for pagination.
         * @param {number} [params.limit] - Results per page.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The expired leases page.
         */
        getExpiredShortCodeLeases: async ({ page, limit, options = {} } = {}) => {
          const query = this.client._getQueryString({ page, limit });
          return this.client(`/campaign/short-code/expired-leases${query}`, { method: 'GET', ...options });
        },
        /**
         * Confirm Registry offboarding and mark an expired Short Code released.
         * @async
         * @param {Object} params - Request parameters.
         * @param {string} params.campaignId - Campaign identifier.
         * @param {string} [params.note] - Operator note recorded with the release.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} The updated campaign.
         */
        releaseExpiredShortCodeLease: async ({ campaignId, note, options = {} }) => {
          this.client._require({ campaignId });
          const safeCampaignId = encodeURIComponent(campaignId);
          return this.client(`/campaign/short-code/${safeCampaignId}/expired-lease/release`, {
            method: 'POST', body: { note }, ...options,
          });
        },
      };
    }
  }

  /**
   * Get a list of campaigns with optional filters
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for filtering the campaigns
   * @param {string} [params.id] - The ID of the campaign to filter by
   * @param {string} [params.brandId] - The ID of the brand to filter by
   * @param {string} [params.subgroupId] - The ID of the subgroup to filter by
   * @param {string} [params.groupId] - The ID of the group to filter by
   * @param {number} [params.page] - The page number for pagination
   * @param {number} [params.limit] - The number of items per page
   * @param {string} [params.status] - The status of the campaign to filter by
   * @param {string} [params.search] - Search term to filter campaigns by campaignId or brandId
   * @param {string} [params.sortBy] - Field to sort by (e.g. "createdAt", "campaignId", "brandId", "groupId", "subgroupId", "usecase", "status")
   * @param {string} [params.sortOrder] - Sort direction ("asc" or "desc")
   * @param {string} [params.registrationType] - Filter by registration type ("TEN_DLC", "TOLL_FREE", or "SHORT_CODE")
   * @param {RequestOptions} [params.options] - Additional options for the request
   *
   * Every record carries a `sentiment` object -- trailing 7-day and 30-day inbound reply sentiment,
   * refreshed periodically from analytics rather than computed per request: `{ sevenDay, thirtyDay,
   * updatedAt }`, each window being `{ score, label, scoredCount, positive, neutral, negative }`. The
   * object is always present and fully populated, so it can be read without a presence check.
   * `score` is a volume-weighted average in -100..100 and is null when nothing was scored in the
   * window, which is not the same as a score of 0 -- null means nobody replied, 0 means replies
   * averaged neutral. `updatedAt` is null until the first rollup writes the record, and it tracks when
   * the figures last CHANGED, not when the job last ran.
   *
   * Every record also carries a `health` object -- trailing 7-day and 30-day delivery/opt-out health from
   * the same periodic refresh: `{ sevenDay, thirtyDay, updatedAt }`, each window being `{ score,
   * deliveryRate, optOutRate, deliveryScore, optOutScore, messagesSent, messagesDelivered, messagesFailed,
   * optOuts }`. `score` is 1.0..10.0 (the mean of the two bucket scores) and is null when nothing was sent
   * in the window; the volumes say how much traffic sits behind it. A campaign's figure is scored from the
   * campaign's own summed counters, never averaged from its numbers. For a live figure use GET /number/health
   * or GET /campaign/health.
   *
   * Every record also carries a `carrierSuspensions` array -- one entry per carrier suspension of the
   * campaign: `{ mnoId, mnoName, source, suspensionCategory, reason, tcrEventType, suspendedAt, liftedAt }`.
   * An entry is active while `liftedAt` is null. `mnoId` is the TCR carrier network id (same ids as `mnoIds`);
   * `source` is CARRIER, UPSTREAM or BRAND (the carrier suspended the whole brand). A suspension applies to one
   * carrier, so `status` stays ACTIVE. Subscribe to the CAMPAIGN_SUSPENDED / CAMPAIGN_UNSUSPENDED webhook events
   * to be told when an entry opens or is lifted.
   * @returns {Promise<SdkResponse<Array|Object>>} The response from the server - array when unpaginated, or { data, total, page, limit, totalPages } when paginated
   */
  async getCampaigns({
    id,
    brandId,
    subgroupId,
    groupId,
    page,
    limit,
    status,
    search,
    sortBy,
    sortOrder,
    registrationType,
    options = {},
  }) {
    const filters = {
      id,
      brandId,
      subgroupId,
      groupId,
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
      registrationType,
    };
    const queryString = this.client._getQueryString(filters);
    return this.client(`/campaign${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get aggregated campaign health (7-day and 30-day windows) for a campaign.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - Parameters for reading campaign health
   * @param {string} params.campaignId - Campaign identifier
   * @param {boolean} [params.includeNumbers=false] - When true, include per-number health entries
   * @param {RequestOptions} [params.options] - Additional request options
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ campaignId, sevenDay, thirtyDay, numbers? }`
   */
  async getCampaignHealth({ campaignId, includeNumbers = false, options = {} }) {
    this.client._require({ campaignId });
    const queryString = this.client._getQueryString({ campaignId, includeNumbers });
    return this.client(`/campaign/health${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get the carrier throughput ceilings a campaign is currently sending under: the AT&T per-minute limit
   * (per campaign, held 10% under the published ceiling) and the T-Mobile daily cap (per brand), each with
   * its current tier and the next rung on the ladder, plus today's T-Mobile usage. Resolved from the same
   * brand status / brand score rules the send path enforces with.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - Parameters for reading campaign throughput limits
   * @param {string} params.campaignId - Campaign identifier
   * @param {RequestOptions} [params.options] - Additional request options
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ campaignId, brandId, usecase, brand: { status, brandScore, entityType }, att: { tier, scope, unit, sms: { limit }, mms: { limit }, marginPercent, nextTier }, tmobile: { tier, scope, unit, dailyLimit, thresholds, nextTier, usedToday: { date, segments, resetsAt } | null } }`. A null tier/limit means the carrier ladder does not apply (unverified brand, GOVERNMENT entity, PUBLIC_SAFETY_RESTRICTED usecase); a null nextTier means the top rung or a usecase-capped (LOW_VOLUME) campaign.
   */
  async getCampaignThroughputLimits({ campaignId, options = {} }) {
    this.client._require({ campaignId });
    const queryString = this.client._getQueryString({ campaignId });
    return this.client(`/campaign/throughput-limits${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Create a new campaign
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for creating the campaign (see CreateCampaignData typedef for details)
   * @param {CreateCampaignData} params.campaignData - The data for the campaign to be created (see CreateCampaignData typedef for details)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignData parameter is missing or if required fields in campaignData are missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async createCampaign({ campaignData, options = {} }) {
    this.client._require({ campaignData: campaignData });
    return this.client(`/campaign`, { method: 'POST', body: campaignData, ...options });
  }

  /**
   * Create a new Toll-Free (TFN) campaign and submit it for Signal House review
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for creating the toll-free campaign
   * @param {CreateTollFreeCampaignData} params.campaignData - The data for the toll-free campaign to be created (see CreateTollFreeCampaignData typedef for details)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignData parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async createTollFreeCampaign({ campaignData, options = {} }) {
    this.client._require({ campaignData });
    return this.client(`/campaign/toll-free`, { method: 'POST', body: campaignData, ...options });
  }

  /**
   * Create a new Short Code campaign and submit it for Signal House review. Requires an
   * approved (VERIFIED) Short Code brand. Upload the opt-in proof screenshot first with `uploadOptInImage`
   * and pass the returned URL as `campaignData.shortCode.screenshotUrl` (required). Request or register the
   * campaign's Short Code separately through `numbers.requestShortCodeAcquisition` after creation.
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for creating the Short Code campaign
   * @param {CreateShortCodeCampaignData} params.campaignData - The Short Code campaign data (see CreateShortCodeCampaignData typedef for details)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignData parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async createShortCodeCampaign({ campaignData, options = {} }) {
    this.client._require({ campaignData });
    const formData = new FormData();
    formData.append('campaignData', JSON.stringify(campaignData));
    return this.multipartClient(`/campaign/short-code`, { method: 'POST', body: formData, ...options });
  }

  /**
   * Update a Short Code campaign's editable fields. Only permitted while the campaign is in
   * Signal House Review or Signal House Rejected status; the number source cannot be changed once submitted.
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for updating the Short Code campaign
   * @param {string} params.campaignId - The ID of the campaign to update
   * @param {Object} params.updateData - The fields to update (top-level campaign fields plus an optional `shortCode` object of editable Short Code fields; pass a new `uploadOptInImage` URL as `shortCode.screenshotUrl` to replace the opt-in proof)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The updated campaign
   */
  async updateShortCodeCampaign({ campaignId, updateData, options = {} }) {
    this.client._require({ campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/short-code/${safeCampaignId}`, { method: 'PUT', body: updateData, ...options });
  }

  /**
  * Cancel a Short Code campaign. A customer cancellation for an issued Short Code returns
  * PENDING_DELETE (displayed as Cancellation Pending) until Signal House confirms Registry offboarding.
  * Unissued RANDOM/VANITY requests, plus staff-confirmed cancellations, return EXPIRED immediately.
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for cancelling the campaign
   * @param {string} params.campaignId - The ID of the campaign to cancel
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The cancelled campaign
   */
  async cancelShortCodeCampaign({ campaignId, options = {} }) {
    this.client._require({ campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/short-code/${safeCampaignId}/cancel`, { method: 'POST', ...options });
  }

  /**
   * Download a private Short Code external lease receipt. Opt-in screenshots are public at the
   * `shortCode.screenshotUrl` returned on the campaign. Authorized receipt users should pass
   * `options: { responseType: "blob" }` (browser) or an equivalent binary response type for your HTTP
   * client to receive the raw file bytes instead of attempting to parse them as JSON.
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for downloading the artifact
   * @param {string} params.artifactId - The receipt identifier from `numberSource.externalLease.receiptArtifactId`
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the artifactId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server (raw file bytes as `data` when a binary responseType is used)
   */
  async readCampaignArtifact({ artifactId, options = {} }) {
    this.client._require({ artifactId });
    const safeArtifactId = encodeURIComponent(artifactId);
    return this.client(`/campaign/short-code/artifact/${safeArtifactId}`, { method: 'GET', ...options });
  }

  /**
   * Upload a sample media file (JPEG, PNG, GIF, MP4 or MP3, up to 5MB) for a 10DLC campaign. Reference the
   * returned mediaId in sampleMediaIds on campaign create or update; it is attached to the TCR campaign for
   * carrier review
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for uploading the sample media
   * @param {Blob|File} params.file - The media file to upload, provided as a Blob/File
   * @param {string} [params.groupId] - The group the file belongs to. Required with a staff (signalhouse_*) key, which has no active group; otherwise optional and must be your own group
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the file parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server containing the mediaId, fileName, mimeType and size
   */
  async uploadSampleMedia({ file, groupId, options = {} }) {
    this.client._require({ file });
    const formData = new FormData();
    if (groupId) formData.append('groupId', groupId);
    formData.append('file', file);
    return this.multipartClient(`/campaign/sample-media`, { method: 'POST', body: formData, ...options });
  }

  /**
   * Download a campaign sample media file your group owns
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for downloading the sample media
   * @param {string} params.mediaId - The mediaId returned by uploadSampleMedia
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the mediaId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server containing the file bytes
   */
  async readSampleMedia({ mediaId, options = {} }) {
    this.client._require({ mediaId });
    const safeMediaId = encodeURIComponent(mediaId);
    return this.client(`/campaign/sample-media/${safeMediaId}`, { method: 'GET', ...options });
  }

  /**
   * Upload an opt-in proof image to be hosted on-platform, returning a publicly-fetchable URL suitable for a
   * Toll-Free campaign's optInImageURLs or a Short Code campaign's shortCode.screenshotUrl
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for uploading the opt-in image
   * @param {Blob|File} params.file - The image file to upload, provided as a Blob/File
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the file parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server containing the hosted image's id and URL
   */
  async uploadOptInImage({ file, options = {} }) {
    this.client._require({ file });
    const formData = new FormData();
    formData.append('file', file);
    return this.multipartClient(`/campaign/opt-in-image`, { method: 'POST', body: formData, ...options });
  }

  /**
   * Auto-capture an opt-in proof image from a brand's generated landing page and host it on-platform,
   * returning a publicly-fetchable URL suitable for a Toll-Free campaign's optInImageURLs
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for capturing the opt-in image
   * @param {string} params.brandId - The ID of the brand whose generated landing page should be captured
   * @param {string} [params.landingId] - The specific page to capture. Required for Toll-Free brands, which have
   *   one page per campaign — omitted, the request is refused rather than guessing which page to shoot. A 10DLC
   *   brand has a single page, so it may be omitted there
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server containing the hosted image's id and URL
   */
  async captureOptInImageFromLanding({ brandId, landingId, options = {} }) {
    this.client._require({ brandId });
    const body = { brandId };
    if (landingId) body.landingId = landingId;
    return this.client(`/campaign/opt-in-image/from-landing`, { method: 'POST', body, ...options });
  }

  /**
   * Update an existing campaign
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for updating the campaign (see UpdateCampaignData typedef for details)
   * @param {string} params.campaignId - The ID of the campaign to update
   * @param {UpdateCampaignData} params.campaignData - The data for the campaign to be updated (see UpdateCampaignData typedef for details)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId parameter is missing or if required fields in campaignData are missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async updateCampaign({ campaignId, campaignData, options = {} }) {
    this.client._require({ campaignId: campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/${safeCampaignId}`, { method: 'PUT', body: campaignData, ...options });
  }

  /**
   * Add an internal comment/note to a campaign
   * @async
   * @roles signalhouse_admin, signalhouse_user
   * @param {Object} params - The parameters for adding the comment
   * @param {string} params.campaignId - The ID of the campaign
   * @param {string} params.comment - The comment/note text
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId or comment parameter is missing
   * @returns {Promise<SdkResponse<any>>} The updated campaign object
   */
  async addCampaignComment({ campaignId, comment, options = {} }) {
    this.client._require({ campaignId, comment });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/${safeCampaignId}/comments`, { method: 'POST', body: { comment }, ...options });
  }

  /**
   * Delete an existing campaign (mark it as EXPIRED). The campaign will still be retrievable
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for deleting the campaign
   * @param {string} params.campaignId - The ID of the campaign to delete
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async deleteCampaign({ campaignId, options = {} }) {
    this.client._require({ campaignId: campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/${safeCampaignId}`, { method: 'DELETE', ...options });
  }

  /**
   * Appeal a DCA-rejected campaign
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for appealing the campaign rejection
   * @param {string} params.campaignId - The ID of the campaign to appeal
   * @param {RequestOptions} [params.options] - Additional options for the request (body should include { reason })
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async appealDcaRejection({ campaignId, options = {} }) {
    this.client._require({ campaignId: campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/appealDcaRejection/${safeCampaignId}`, { method: 'POST', ...options });
  }

  /**
   * Nudge a connectivity partner to prioritize review of a campaign in PENDING_DCA_APPROVAL status
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for nudging the campaign
   * @param {string} params.campaignId - The ID of the campaign to nudge
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async nudgeDcaForCampaign({ campaignId, options = {} }) {
    this.client._require({ campaignId: campaignId });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/campaign/nudge/${safeCampaignId}`, { method: 'POST', ...options });
  }
}
