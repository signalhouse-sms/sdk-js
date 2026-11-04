/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {string} BrandLookupId - Carrier Brand ID (B…, TFNB…, or SCB…), record `_id`, or internal reference UUID.
 * Use on update, delete, revet, vetting, appeal, and transfer routes. Pending brands return `brandId: null`
 * in read/create responses — poll `GET /brand?id=<record _id>` until a carrier Brand ID is assigned.
 */

/**
 * @typedef {Object} CreateBrandData
 * @property {string} subgroupId - The ID of the subgroup to create the brand under
 * @property {string} entityType - The type of entity for the brand (PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT)
 * @property {string} displayName - The display name for the brand
 * @property {string} companyName - The company name for the brand
 * @property {string} ein - The EIN (Employer Identification Number) for the brand
 * @property {string} [einIssuingCountry] - The country that issued the EIN for the brand
 * @property {string} [altBusinessId] - An alternative business identifier for the brand (e.g., DUNS number)
 * @property {string} [altBusinessIdType] - The type of the alternative business identifier ("NONE", "DUNS", "LEI", "GIIN")
 * @property {string} [firstName] - The first name of the primary contact for the brand
 * @property {string} [lastName] - The last name of the primary contact for the brand
 * @property {string} phone - The phone number of the primary contact for the brand
 * @property {string} street - The street address of the primary contact for the brand
 * @property {string} city - The city of the primary contact for the brand
 * @property {string} state - The state of the primary contact for the brand
 * @property {string} postalCode - The postal code of the primary contact for the brand
 * @property {string} country - The country code of the primary contact for the brand (e.g., "US")
 * @property {string} email - The email address of the primary contact for the brand
 * @property {string} [mobilePhone] - The mobile phone number of the primary contact for the brand
 * @property {string} [stockSymbol] - The stock symbol for the brand if it is a publicly traded company
 * @property {string} [stockExchange] - The stock exchange where the brand is listed if it is a publicly traded company
 * @property {string} [website] - The website URL for the brand
 * @property {string} vertical - The vertical for the brand (PROFESSIONAL, REAL_ESTATE, HEALTHCARE, HUMAN_RESOURCES, ENERGY, ENTERTAINMENT, RETAIL, TRANSPORTATION, AGRICULTURE, INSURANCE, POSTAL, EDUCATION, HOSPITALITY, FINANCIAL, POLITICAL, GAMBLING, LEGAL, CONSTRUCTION, NGO, MANUFACTURING, GOVERNMENT, TECHNOLOGY, COMMUNICATION)
 * @property {string} [referenceId] - A unique reference for the brand
 * @property {Array<string>} [tag] - An array of tags to associate with the brand
 * @property {boolean} [mock] - Whether to register the brand in TCR's mock environment instead of the live registry. TCR is still called and the mock brand auto-approves, so it does not exercise the rejection states a live registration can hit. Brand creation is not billed; campaign registration and number purchase are still billed as normal
 * @property {string} [businessContactEmail] - The email address of the business contact for the brand (required if entityType is PUBLIC_PROFIT or NON_PROFIT)
 */

/**
 * @typedef {Object} UpdateBrandData
 * @property {string} [companyName] - The company name for the brand
 * @property {string} [ein] - The EIN (Employer Identification Number) for the brand
 * @property {string} [einIssuingCountry] - The country that issued the EIN for the brand
 * @property {string} [entityType] - The type of entity for the brand (PRIVATE_PROFIT, PUBLIC_PROFIT, NON_PROFIT, GOVERNMENT)
 * @property {string} [firstName] - The first name of the primary contact for the brand
 * @property {string} [lastName] - The last name of the primary contact for the brand
 * @property {string} [displayName] - The display name for the brand
 * @property {string} [website] - The website URL for the brand
 * @property {string} [street] - The street address of the primary contact for the brand
 * @property {string} [city] - The city of the primary contact for the brand
 * @property {string} [state] - The state of the primary contact for the brand
 * @property {string} [postalCode] - The postal code of the primary contact for the brand
 * @property {string} [country] - The country code of the primary contact for the brand (e.g., "US")
 * @property {string} [email] - The email address of the primary contact for the brand
 * @property {string} [referenceId] - A unique reference for the brand
 * @property {string} [phone] - The phone number of the primary contact for the brand
 * @property {string} [vertical] - The vertical for the brand (PROFESSIONAL, REAL_ESTATE, HEALTHCARE, HUMAN_RESOURCES, ENERGY, ENTERTAINMENT, RETAIL, TRANSPORTATION, AGRICULTURE, INSURANCE, POSTAL, EDUCATION, HOSPITALITY, FINANCIAL, POLITICAL, GAMBLING, LEGAL, CONSTRUCTION, NGO, MANUFACTURING, GOVERNMENT, TECHNOLOGY, COMMUNICATION)
 * @property {string} [stockSymbol] - The stock symbol for the brand if it is a publicly traded company
 * @property {string} [stockExchange] - The stock exchange where the brand is listed if it is a publicly traded company
 * @property {string} [altBusinessId] - An alternative business identifier for the brand (e.g., DUNS number)
 * @property {string} [altBusinessIdType] - The type of the alternative business identifier ("NONE", "DUNS", "LEI", "GIIN")
 * @property {string} [brandRelationship] - Not in use - reserved for future use
 * @property {string} [businessContactEmail] - The email address of the business contact for the brand (required if entityType is PUBLIC_PROFIT or NON_PROFIT)
 * @property {Object} [tollFree] - Toll-Free editable fields, used when updating a Toll-Free brand. Optional sub-fields: legalEntityType, businessRegistrationType, taxId, countryCode, supportPhone, taxIdIssuingCountry, businessDBA, businessWebsite. supportPhone must be E.164 with an optional leading "+" and no spaces, parentheses or hyphens (e.g. "17025550100"). (Toll-Free brands sync to Infobip; only DCA_PENDING/DCA_ACTIVE brands are editable and subgroupId is immutable.)
 */

/**
 * @typedef {Object} TollFreeBrandDetails
 * @property {string} businessRegistrationType - The business registration type (required, one of EIN, CBN, NEQ, PROVINCIAL_NUMBER, CRN, VAT, ACN, ABN, BRN, SIREN, SIRET, NZBN, UST_IDNR, CIF, NIF, CNPJ, UID, OTHER)
 * @property {string} legalEntityType - The legal entity type (required, one of PRIVATE_COMPANY, PUBLIC_COMPANY, NON_PROFIT, GOVERNMENT, SOLE_PROPRIETOR)
 * @property {string} taxId - The business tax identifier (required, at most 50 characters)
 * @property {string} countryCode - The business country code (required, 2-letter ISO code; "US" or "CA" when the group's toll-free brands are reviewed on submit)
 * @property {string} supportPhone - The customer-support phone number (required, E.164 with an optional leading "+" and no spaces, parentheses or hyphens, e.g. "17025550100")
 * @property {string} [taxIdIssuingCountry] - The country that issued the tax ID (optional, 2-letter ISO code)
 * @property {string} [businessDBA] - The business "doing business as" name (optional, at most 255 characters)
 * @property {string} [businessWebsite] - The customer's real website, sent to the toll-free carrier for verification (optional, valid URL, at most 255 characters; distinct from the top-level website / landing URL)
 * @property {string} [businessStructure] - The business structure (one of CO_OPERATIVE, CORPORATION, LIMITED_LIABILITY_CORPORATION, NON_PROFIT_CORPORATION, PARTNERSHIP). Required when the group's toll-free brands are reviewed on submit; refused (400) otherwise
 * @property {string} [industry] - The business industry (one of AGRICULTURE, AUTOMOTIVE, BANKING, CONSTRUCTION, CONSUMER, EDUCATION, ELECTRONICS, ENGINEERING, ENERGY, FAST_MOVING_CONSUMER_GOODS, FINANCIAL, FINTECH, FOOD_AND_BEVERAGE, GOVERNMENT, HEALTHCARE, HOSPITALITY, INSURANCE, JEWELRY, LEGAL, MANUFACTURING, MEDIA, NOT_FOR_PROFIT, OIL_AND_GAS, ONLINE, PROFESSIONAL_SERVICES, RAW_MATERIALS, REAL_ESTATE, RELIGION, RETAIL, TECHNOLOGY, TELECOMMUNICATIONS, TRANSPORTATION, TRAVEL). Required when the group's toll-free brands are reviewed on submit; refused (400) otherwise
 * @property {string} [contactEmail] - The email address of the contact named by firstName and lastName (valid email, at most 100 characters). Required when the group's toll-free brands are reviewed on submit; refused (400) otherwise
 * @property {string} [contactJobTitle] - The contact's job title (at most 100 characters). Required when the group's toll-free brands are reviewed on submit; refused (400) otherwise
 * @property {string} [contactJobLevel] - The contact's job level (one of DIRECTOR, GM, VP, CEO, CFO, GENERAL_COUNSEL, OTHER). Required when the group's toll-free brands are reviewed on submit; refused (400) otherwise
 */

/**
 * @typedef {Object} TollFreeIsvAccount
 * @property {string} groupId - The group the account is registered to
 * @property {string} accountSid - The SID of the group's own top-level account at the toll-free provider
 * @property {string} apiKeySid - The SID of the API key Signal House uses in that account (its secret is never returned)
 * @property {string} primaryProfileSid - The SID of the account's approved primary business profile, found when the account was registered
 * @property {string} createdAt - When the account was first registered (ISO date)
 * @property {string} updatedAt - When the account or its API key was last saved (ISO date)
 */

/**
 * Toll-free brand data. When the group's toll-free brands are reviewed on submit (see getTollFreeRequirements), tollFree
 * also needs businessStructure, industry, contactEmail, contactJobTitle and contactJobLevel, tollFree.countryCode must be
 * "US" or "CA", and state must be a 2-letter state or province code. Any other group is refused those five fields.
 * Such a brand's business details can't be changed after it's submitted: companyName, street, city, state, postalCode,
 * country, firstName, lastName and tollFree's businessRegistrationType, taxId, countryCode, taxIdIssuingCountry,
 * businessStructure, industry, contactEmail, contactJobTitle and contactJobLevel.
 * @typedef {Object} CreateTollFreeBrandData
 * @property {string} subgroupId - The ID of the subgroup to create the brand under (required, exactly 8 characters)
 * @property {string} displayName - The display name for the brand (required, at most 255 characters)
 * @property {string} companyName - The company name for the brand (required, at most 255 characters)
 * @property {string} street - The street address of the primary contact for the brand (required, at most 255 characters)
 * @property {string} city - The city of the primary contact for the brand (required, at most 100 characters)
 * @property {string} state - The state of the primary contact for the brand (required, at most 20 characters; must be a valid 2-letter US state code when country is "US", and a 2-letter state or province code when the group's toll-free brands are reviewed on submit)
 * @property {string} postalCode - The postal code of the primary contact for the brand (required, at most 10 characters)
 * @property {string} email - The brand's support email address (required, valid email, at most 100 characters)
 * @property {string} firstName - The first name of the primary contact for the brand (required, at most 100 characters)
 * @property {string} lastName - The last name of the primary contact for the brand (required, at most 100 characters)
 * @property {string} website - The website URL for the brand (required, valid URL, at most 255 characters)
 * @property {TollFreeBrandDetails} tollFree - The Toll-Free brand details (required)
 * @property {string} [referenceId] - A unique reference for the brand (optional, at most 50 characters)
 * @property {Array<string>} [tag] - An array of tags to associate with the brand (optional)
 * @property {boolean} [mock] - Accepted and stored, but has no effect on Toll-Free registration: Toll-Free does not use TCR and is already free
 * @property {string} [optInLink] - A URL linking to the opt-in flow for the brand (optional, valid URL, at most 255 characters)
 * @property {string} [privacyPolicyLink] - A URL linking to the privacy policy for the brand (optional, valid URL, at most 255 characters)
 * @property {string} [termsAndConditionsLink] - A URL linking to the terms and conditions for the brand (optional, valid URL, at most 255 characters)
 * @property {string} [landingId] - The ID of the landing page associated with the brand (optional)
 * @property {string} [country] - The country code of the primary contact for the brand (optional, 2-letter code; when "US", state must be a valid 2-letter US state code)
 */

/**
 * @typedef {Object} TollFreeRequirements
 * @property {string} groupId - The group the requirements are for
 * @property {boolean} reviewsBusinessOnSubmit - Whether the group's new toll-free brands are reviewed when they're submitted. When true, a new toll-free brand needs tollFree.businessStructure, industry, contactEmail, contactJobTitle and contactJobLevel, a tollFree.countryCode of "US" or "CA" and a 2-letter state or province code; it stays DCA_PENDING until it's reviewed, and its business details can't be changed after it's submitted. When false, those five fields are refused
 */

/**
 * @typedef {Object} CreateShortCodeBrandData
 * @property {string} subgroupId - The ID of the subgroup to create the brand under.
 * @property {string} displayName - The Short Code brand display name.
 * @property {string} companyName - The official company name.
 * @property {string} street - The street address.
 * @property {string} city - The city.
 * @property {string} state - The state or province.
 * @property {string} postalCode - The postal code.
 * @property {string} country - The 2-letter country code.
 * @property {string} email - The support email address.
 * @property {string} firstName - The contact's first name.
 * @property {string} lastName - The contact's last name.
 * @property {string} website - The company website URL.
 * @property {{ businessRegistrationType: string, legalEntityType: string, taxId: string, countryCode: string, supportPhone: string }} shortCode - Short Code registration details.
 */

export class Brands {
  constructor(client, multipartClient, enableAdmin) {
    this.client = client;
    this.multipartClient = multipartClient;
    this.enableAdmin = enableAdmin;

    if (enableAdmin) {
      this.admin = {
        /**
         * Get a group's toll-free ISV account: the group's own top-level account at the toll-free provider, used when its
         * subgroups are separate businesses. Each subgroup gets an account of its own under it. Staff only.
         * @async
         * @roles signalhouse_api, signalhouse_admin, signalhouse_user
         * @param {Object} params - The parameters for getting the toll-free ISV account
         * @param {string} params.groupId - The ID of the group whose toll-free ISV account to get
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @throws {Error} Throws an error if the groupId parameter is missing
         * @returns {Promise<SdkResponse<TollFreeIsvAccount|null>>} The group's toll-free ISV account, or null when it has none. The API key secret is never returned. The API returns 404 when the group does not exist or is not active.
         */
        getTollFreeIsvAccount: async ({ groupId, options = {} }) => {
          this.client._require({ groupId });
          return this.client(`/brand/toll-free-isv-account/${encodeURIComponent(groupId)}`, { method: 'GET', ...options });
        },

        /**
         * Register a group's toll-free ISV account, or replace the API key of the account it already has. Staff only. The
         * toll-free provider checks the account and key before they are stored. Register it before the group has any toll-free
         * records at the provider; after that, only the API key of the same account can be replaced.
         * @async
         * @roles signalhouse_admin
         * @param {Object} params - The parameters for setting the toll-free ISV account
         * @param {string} params.groupId - The ID of the group whose toll-free ISV account to set
         * @param {string} params.accountSid - The SID of the group's own top-level account at the toll-free provider (AC followed by 32 lowercase hexadecimal characters)
         * @param {string} params.apiKeySid - The SID of a Main API key in that account, which can create subaccounts (SK followed by 32 lowercase hexadecimal characters)
         * @param {string} params.apiKeySecret - The API key's secret (1 to 128 characters), stored encrypted and never returned
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @throws {Error} Throws an error if the groupId, accountSid, apiKeySid or apiKeySecret parameter is missing
         * @returns {Promise<SdkResponse<TollFreeIsvAccount>>} The stored toll-free ISV account, without the API key secret. The API returns 400 when the provider refuses the account or its key, and 404 when the group does not exist or is not active.
         */
        setTollFreeIsvAccount: async ({ groupId, accountSid, apiKeySid, apiKeySecret, options = {} }) => {
          this.client._require({ groupId, accountSid, apiKeySid, apiKeySecret });
          return this.client(`/brand/toll-free-isv-account/${encodeURIComponent(groupId)}`, {
            method: 'PUT',
            body: { accountSid, apiKeySid, apiKeySecret },
            ...options,
          });
        },
      };
    }
  }

  /**
   * Get a list of brands with optional filters
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for filtering the brands
   * @param {string} [params.id] - Brand lookup id (carrier Brand ID, record _id, or internal reference)
   * @param {string} [params.subgroupId] - The ID of the subgroup to filter by
   * @param {string} [params.groupId] - The ID of the group to filter by
   * @param {number} [params.page] - The page number for pagination
   * @param {number} [params.limit] - The number of items per page
   * @param {string} [params.status] - The status of the brand to filter by (PENDING_CREATION, PENDING_APPROVAL, UNVERIFIED, VERIFIED, VETTED_VERIFIED, PENDING_DELETE, DELETED)
   * @param {string} [params.registrationType] - Filter by registration type ("TEN_DLC", "TOLL_FREE", or "SHORT_CODE")
   * @param {boolean} [params.currentTollFreeCarrier] - With subgroupId or groupId: when true, return only toll-free brands that a new toll-free campaign in that group can use (those on the group's current toll-free carrier)
   * @param {string} [params.search] - Staff-only (no id/subgroupId/groupId): case-insensitive substring over brandId, names, EIN, email, group, subgroup and reference ID
   * @param {string} [params.sortBy] - Staff-only: createdAt, brandId, displayName, groupId, subgroupId, status, entityType or country
   * @param {"asc"|"desc"} [params.sortOrder] - Staff-only: sort direction (default asc)
   * @param {string} [params.entityType] - Staff-only: exact entity type filter
   * @param {string} [params.ein] - Staff-only: EIN substring filter
   * @param {string} [params.email] - Staff-only: support email substring filter
   * @param {string} [params.referenceId] - Staff-only: reference ID substring filter
   * @param {string|Array<string>} [params.groupIds] - Staff-only: restrict to these group IDs (sent comma-separated)
   * @param {string} [params.createdFrom] - Staff-only: inclusive createdAt lower bound (ISO date)
   * @param {string} [params.createdTo] - Staff-only: inclusive createdAt upper bound (ISO date)
   * @param {boolean} [params.excludeDeleted] - Staff-only: hide DELETED brands when no status is given
   * @param {boolean} [params.includeTotal] - Staff-only: with page and limit, return `{ data, total, page, limit, totalPages }` instead of the array
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<Array<{ _id: string, brandId: string|null, status: string, registrationType: string, tollFree?: { isBrandReady?: boolean, maxNumbersPerCampaign?: number, maxOptInMethods?: number, requiresPrivacyPolicy?: boolean, requiresTermsAndConditions?: boolean, maxAppealReasonLength?: number, labelsSamples?: boolean, supportsMms?: boolean, reviewsBusinessOnSubmit?: boolean, businessStructure?: string|null, industry?: string|null, contactEmail?: string|null, contactJobTitle?: string|null, contactJobLevel?: string|null, rejectionReason?: string|null, [key: string]: any }, [key: string]: any }>|{ data: Array<Object>, total: number, page: number, limit: number, totalPages: number }>>} Brand records. For 10DLC brands in PENDING_CREATION (or rejected before carrier assignment), brandId is null — poll by _id until status advances and brandId is assigned. Toll-free brands carry `tollFree.isBrandReady` (whether the brand can host campaigns), `tollFree.maxNumbersPerCampaign` (the most numbers one of its campaigns can hold), `tollFree.maxOptInMethods` (the most opt-in methods one of its campaigns can declare), `tollFree.requiresPrivacyPolicy` (whether its campaigns need a privacy policy URL), `tollFree.requiresTermsAndConditions` (whether its campaigns need a terms and conditions URL), `tollFree.maxAppealReasonLength` (the longest appeal reason its campaigns may give), `tollFree.labelsSamples` (whether its campaigns' sample messages each start with their use case's name), `tollFree.supportsMms` (whether its numbers can send MMS and group messages) and `tollFree.reviewsBusinessOnSubmit` (whether it's reviewed when it's submitted and keeps its business details from then on). A brand reviewed on submit also carries its `tollFree.businessStructure`, `tollFree.industry`, `tollFree.contactEmail`, `tollFree.contactJobTitle` and `tollFree.contactJobLevel`, and `tollFree.rejectionReason` (why its review rejected it, in plain English, or null). On other toll-free brands these are null or absent. The staff-only list (no id/subgroupId/groupId) returns the `{ data, total, page, limit, totalPages }` envelope only when includeTotal is sent with page and limit. Each brand carries `carrierSuspensions` (carrier brand suspension rules; active while liftedAt is null).
   */
  async getBrands({
    id,
    subgroupId,
    groupId,
    page,
    limit,
    status,
    registrationType,
    currentTollFreeCarrier,
    search,
    sortBy,
    sortOrder,
    entityType,
    ein,
    email,
    referenceId,
    groupIds,
    createdFrom,
    createdTo,
    excludeDeleted,
    includeTotal,
    options = {},
  }) {
    const filters = {
      id,
      subgroupId,
      groupId,
      page,
      limit,
      status,
      registrationType,
      currentTollFreeCarrier,
      search,
      sortBy,
      sortOrder,
      entityType,
      ein,
      email,
      referenceId,
      groupIds: Array.isArray(groupIds) ? (groupIds.length ? groupIds.join(',') : undefined) : groupIds,
      createdFrom,
      createdTo,
      excludeDeleted,
      includeTotal,
    };
    const queryString = this.client._getQueryString(filters);
    return this.client(`/brand${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get external vetting information for a brand
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for getting the external vetting information
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async getExternalVetting({ brandId, options = {} }) {
    this.client._require({ brandId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/externalvetting/${safeBrandId}`, { method: 'GET', ...options });
  }

  /**
   * Create a new brand
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for creating the brand (see CreateBrandData typedef for details)
   * @param {CreateBrandData} params.brandData - The data for the brand to be created
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandData parameter is missing or if required fields in brandData are missing
   * @returns {Promise<SdkResponse<any>>} Brand entity. `brandId` is `null` until the carrier assigns a Brand ID — use `_id` to poll status.
   */
  async createBrand({ brandData, options = {} }) {
    this.client._require({ brandData: brandData });
    return this.client(`/brand`, { method: 'POST', body: brandData, ...options });
  }

  /**
   * Create a new Toll-Free (TFN) brand. When the group's toll-free brands are reviewed on submit (see
   * getTollFreeRequirements), the brand stays DCA_PENDING until it's reviewed, then becomes DCA_ACTIVE, or DCA_REJECTED
   * with tollFree.rejectionReason saying why. Its business details can't be changed after it's submitted, so a rejected
   * brand is fixed by creating it again with the corrections.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for creating the toll-free brand
   * @param {CreateTollFreeBrandData} params.brandData - The data for the toll-free brand to be created (see CreateTollFreeBrandData typedef for details; TFN-specific fields live under brandData.tollFree, and registrationType is forced server-side by the route)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandData parameter is missing
   * @returns {Promise<SdkResponse<any>>} Brand entity. For Toll-Free, `brandId` is a TFNB-prefixed id when assigned; otherwise `null` — use `_id` to poll.
   */
  async createTollFreeBrand({ brandData, options = {} }) {
    this.client._require({ brandData });
    return this.client(`/brand/toll-free`, { method: 'POST', body: brandData, ...options });
  }

  /**
   * Get whether a group's new toll-free brands are reviewed when they're submitted, which decides the details
   * createTollFreeBrand needs.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for getting the toll-free requirements
   * @param {string} params.groupId - The ID of the group whose toll-free requirements to get
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the groupId parameter is missing
   * @returns {Promise<SdkResponse<TollFreeRequirements>>} The group's toll-free requirements (see TollFreeRequirements typedef for details). The API returns 403 when the caller can't view the group.
   */
  async getTollFreeRequirements({ groupId, options = {} }) {
    this.client._require({ groupId });
    const safeGroupId = encodeURIComponent(groupId);
    return this.client(`/brand/toll-free-requirements/${safeGroupId}`, { method: 'GET', ...options });
  }

  /**
   * Create a local Short Code brand for manual Signal House review.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The creation parameters.
   * @param {CreateShortCodeBrandData} params.brandData - The Short Code brand data. The route forces registrationType server-side.
   * @param {RequestOptions} [params.options] - Additional options for the request.
   * @returns {Promise<SdkResponse<any>>} A 201-created Short Code brand with a stable SCB-prefixed ID and PENDING_APPROVAL status.
   */
  async createShortCodeBrand({ brandData, options = {} }) {
    this.client._require({ brandData });
    return this.client(`/brand/short-code`, { method: 'POST', body: brandData, ...options });
  }

  /**
   * Approve a pending Short Code brand.
   * @async
   * @roles signalhouse_admin
   * @param {Object} params - The approval parameters.
   * @param {BrandLookupId} params.brandId - The pending Short Code brand lookup ID.
   * @param {RequestOptions} [params.options] - Additional options for the request.
   * @returns {Promise<SdkResponse<any>>} The verified Short Code brand.
   */
  async approveShortCodeBrand({ brandId, options = {} }) {
    this.client._require({ brandId });
    return this.client(`/brand/approve/${encodeURIComponent(brandId)}`, { method: 'POST', ...options });
  }

  /**
   * Reject a pending Short Code brand with a customer-visible reason.
   * @async
   * @roles signalhouse_admin
   * @param {Object} params - The rejection parameters.
   * @param {BrandLookupId} params.brandId - The pending Short Code brand lookup ID.
   * @param {string} params.internalRejectionReason - Required customer-visible rejection reason.
   * @param {RequestOptions} [params.options] - Additional options for the request.
   * @returns {Promise<SdkResponse<any>>} The rejected Short Code brand.
   */
  async rejectShortCodeBrand({ brandId, internalRejectionReason, options = {} }) {
    this.client._require({ brandId, internalRejectionReason });
    return this.client(`/brand/reject/${encodeURIComponent(brandId)}`, {
      method: 'POST',
      body: { internalRejectionReason },
      ...options,
    });
  }

  /**
   * Transfer one or more brands to a different subgroup
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for transferring the brands
   * @param {string} params.subgroupId - The ID of the subgroup to transfer the brands to
   * @param {BrandLookupId[]} params.brandIds - Brand lookup ids to transfer (carrier id, record `_id`, or internal reference).
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the subgroupId or brandIds parameters are missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async transferBrand({ subgroupId, brandIds, options = {} }) {
    this.client._require({ subgroupId, brandIds });
    const safeSubgroupId = encodeURIComponent(subgroupId);
    return this.client(`/brand/transfer/${safeSubgroupId}`, { method: 'POST', body: { brandIds }, ...options });
  }

  /**
   * Create external vetting for a brand
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for creating external vetting
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {string} params.vettingProviderId - The external vetting provider: AEGIS or WMC
   * @param {string} params.vettingClass - The vetting class: STANDARD, ENHANCED, AUTHPLUS, or RCS (AEGIS accepts all four; WMC accepts STANDARD only)
   * @param {Object} [params.additionalData] - Provider-specific additional data forwarded to TCR
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId, vettingProviderId, or vettingClass parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async createExternalVetting({ brandId, vettingProviderId, vettingClass, additionalData, options = {} }) {
    this.client._require({ brandId, vettingProviderId, vettingClass });
    const safeBrandId = encodeURIComponent(brandId);
    const body = { vettingProviderId, vettingClass };
    if (additionalData !== undefined) body.additionalData = additionalData;
    return this.client(`/brand/externalvetting/${safeBrandId}`, { method: 'POST', body, ...options });
  }

  /**
   * Import an existing external vetting record for a brand
   *
   * Unlike createExternalVetting (which orders a new, billable vetting), this attaches a vetting the
   * brand already completed directly with the provider, using the provider-issued vettingId and
   * vettingToken. It is synchronous and not billable.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for importing external vetting
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {string} params.vettingProviderId - The external vetting provider (AEGIS, WMC, CV)
   * @param {string} params.vettingId - The provider-issued vetting / transaction ID to import
   * @param {string} [params.vettingToken] - The provider-issued vetting token (required by some providers, e.g. AEGIS)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if brandId, vettingProviderId, or vettingId is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async importExternalVetting({ brandId, vettingProviderId, vettingId, vettingToken, options = {} }) {
    this.client._require({ brandId, vettingProviderId, vettingId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/externalvetting/import/${safeBrandId}`, {
      method: 'POST',
      body: { vettingProviderId, vettingId, vettingToken },
      ...options,
    });
  }

  /**
   * Update a brand's information
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for updating the brand (see UpdateBrandData typedef for details)
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {UpdateBrandData} params.brandData - The data for the brand to be updated
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async updateBrand({ brandId, brandData, options = {} }) {
    this.client._require({ brandId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/${safeBrandId}`, { method: 'PUT', body: brandData, ...options });
  }

  /**
   * Revet a brand that is in UNVERIFIED status due to an update afer it was previously VERIFIED or VETTED_VERIFIED
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for reverting the brand
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async revetBrand({ brandId, options = {} }) {
    this.client._require({ brandId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/revet/${safeBrandId}`, { method: 'PUT', ...options });
  }

  /**
   * Delete a brand (mark it as DELETED). The brand will still be retrievable
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for deleting the brand
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async deleteBrand({ brandId, options = {} }) {
    this.client._require({ brandId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/${safeBrandId}`, { method: 'DELETE', ...options });
  }

  /**
   * Get appeal history for a brand
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for getting the appeal history
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the brandId parameter is missing
   * @returns {Promise<SdkResponse<Array>>} Array of BrandAppeal objects
   */
  async getAppealHistory({ brandId, options = {} }) {
    this.client._require({ brandId });
    const safeBrandId = encodeURIComponent(brandId);
    return this.client(`/brand/appeal/${safeBrandId}`, { method: 'GET', ...options });
  }

  /**
   * Submit a brand identity status appeal with supporting documentation
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for submitting the appeal
   * @param {BrandLookupId} params.brandId - Brand lookup id (carrier Brand ID, record `_id`, or internal reference).
   * @param {Array<string>} params.appealCategories - Array of appeal categories (VERIFY_TAX_ID, VERIFY_NON_PROFIT, VERIFY_GOVERNMENT)
   * @param {string} params.explanation - Required explanation justifying the appeal
   * @param {File|Blob} params.file - The supporting document file
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if required parameters are missing
   * @returns {Promise<SdkResponse<any>>} The response from the server
   */
  async submitAppeal({ brandId, appealCategories, explanation, file, options = {} }) {
    this.client._require({ brandId, appealCategories, explanation, file });
    const safeBrandId = encodeURIComponent(brandId);
    const formData = new FormData();
    formData.append('appealCategories', JSON.stringify(appealCategories));
    formData.append('explanation', explanation);
    formData.append('file', file);
    return this.multipartClient(`/brand/appeal/${safeBrandId}`, { method: 'POST', body: formData, ...options });
  }
}
