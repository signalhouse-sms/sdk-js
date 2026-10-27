/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Numbers {
  constructor(client, multipartClient, enableAdmin) {
    this.client = client;
    this.multipartClient = multipartClient;
    this.enableAdmin = enableAdmin;

    if (enableAdmin) {
      this.admin = {
        /**
         * Update a port-in request's status (signalhouse only). Infobip exposes no porting-status
         * API or webhook, so ON_HOLD and its reason are always staff-entered here.
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for updating the status
         * @param {string} params.portingId - The _id of the port-in request
         * @param {string} params.status - The new status (PENDING, IN_PROGRESS, ON_HOLD, REJECTED)
         * @param {string} [params.description] - Optional description for the status change
         * @param {string} [params.onHoldReason] - Required when status is ON_HOLD (DOCUMENTATION_MISMATCH, ACCOUNT_INFO_INCORRECT, CARRIER_REJECTED, PENDING_CUSTOMER_ACTION, OTHER)
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated port-in request
         */
        changePortingStatus: async ({ portingId, status, description, onHoldReason, options = {} }) => {
          this.client._require({ portingId, status });
          const safeId = encodeURIComponent(portingId);
          return this.client(`/number/portin/${safeId}/status`, {
            method: 'PUT',
            body: { status, description, onHoldReason },
            ...options,
          });
        },

        /**
         * Approve a port-in request, setting its status to SUCCESS (signalhouse only)
         * @async
         * @roles signalhouse
         * @param {Object} params - The parameters for approving the request
         * @param {string} params.portingId - The _id of the port-in request
         * @param {RequestOptions} [params.options] - Additional options for the request
         * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated port-in request
         */
        approvePortRequest: async ({ portingId, options = {} }) => {
          this.client._require({ portingId });
          const safeId = encodeURIComponent(portingId);
          return this.client(`/number/portin/${safeId}/approve`, {
            method: 'POST',
            ...options,
          });
        },
        /**
         * List campaign-bound Short Code acquisition requests for staff.
         * @async
         * @roles signalhouse
         * @param {Object} [params] - Queue filter parameters.
         * @param {string} [params.status] - PENDING, FULFILLED, or CANCELLED.
         * @param {string} [params.search] - Request or associated identifier search.
         * @param {number} [params.page] - One-based page number.
         * @param {number} [params.limit] - Page size.
         * @param {RequestOptions} [params.options] - Additional options.
         * @returns {Promise<SdkResponse<any>>} Paginated acquisition requests.
         */
        getShortCodeAcquisitionRequests: async ({ status, search, page, limit, options = {} } = {}) => {
          const queryString = this.client._getQueryString({ status, search, page, limit });
          return this.client(`/number/short-code/requests${queryString}`, { method: 'GET', ...options });
        },
      };
    }
  }

  /**
   * Get a list of phone numbers with optional filters such as campaignId, brandId, subgroupId, groupId, and pagination parameters
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for filtering the phone numbers
   * @param {string} [params.phoneNumber] - Filter by phone number (partial match)
   * @param {string} [params.campaignId] - Filter by campaign ID
   * @param {string} [params.registrationId] - Filter to numbers provisioned under this registration.
   * @param {string} [params.brandId] - Filter by brand ID
   * @param {string} [params.subgroupId] - Filter by subgroup ID
   * @param {string} [params.groupId] - Filter by group ID
   * @param {boolean} [params.currentTollFreeCarrier] - With subgroupId or groupId: when true, return only toll-free numbers that a new toll-free campaign in that group can use (those on the group's current toll-free carrier)
   * @param {number} [params.page] - The page number for pagination (default: 1)
   * @param {number} [params.limit] - The number of items per page for pagination (default: 20)
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
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the list of phone numbers
   */
  async getPhoneNumbers({ phoneNumber, campaignId, registrationId, brandId, subgroupId, groupId, currentTollFreeCarrier, page, limit, options = {} }) {
    const filters = { phoneNumber, campaignId, registrationId, brandId, subgroupId, groupId, currentTollFreeCarrier, page, limit };
    const queryString = this.client._getQueryString(filters);
    return this.client(`/number${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get the health score, the same one the portal shows, (1–10) for an owned phone number over 7-day and 30-day windows
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for reading number health
   * @param {string} params.phoneNumber - Owned phone number to score (11 digits, no + prefix)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumber parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ phoneNumber, groupId, sevenDay, thirtyDay }`
   */
  async getNumberHealth({ phoneNumber, options = {} }) {
    this.client._require({ phoneNumber });
    const queryString = this.client._getQueryString({ phoneNumber });
    return this.client(`/number/health${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get a list of available phone numbers for purchase with optional filters
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for filtering the available phone numbers
   * @param {boolean} [params.smsEnabled] - Filter for phone numbers that are SMS enabled
   * @param {boolean} [params.mmsEnabled] - Filter for phone numbers that are MMS enabled
   * @param {boolean} [params.voiceEnabled] - Filter for phone numbers that are voice enabled
   * @param {string} [params.country] - Filter by country code (e.g., "US")
   * @param {string} [params.state] - Filter by state code (e.g., "CA")
   * @param {string} [params.city] - City prefix; requires country US and state.
   * @param {string} [params.npa] - Filter by NPA (area code)
   * @param {string} [params.nxx] - Filter by NXX (central office code) - the first three digits of the local phone number after the area code
   * @param {string} [params.phoneNumber] - Filter by phone number
   * @param {number} [params.limit] - The number of items per page for pagination
   * @param {number} [params.page] - The page number for pagination
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the list of available phone numbers
   */
  async getAvailablePhoneNumbers({
    smsEnabled,
    mmsEnabled,
    voiceEnabled,
    country,
    state,
    city,
    npa,
    nxx,
    phoneNumber,
    limit,
    page,
    options = {},
  }) {
    const filters = { smsEnabled, mmsEnabled, voiceEnabled, country, state, city, npa, nxx, phoneNumber, limit, page };
    const queryString = this.client._getQueryString(filters);
    return this.client(`/number/available${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Purchase phone numbers by providing a list of phone numbers and the subgroup ID to assign them to.
   *
   * Each requested number is queued and processed independently. Per-number success or failure is
   * delivered via `NUMBER_PURCHASE_SUCCESSFUL` / `NUMBER_PURCHASE_FAILED` webhooks — not in this response.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for purchasing phone numbers
   * @param {string[]} params.phoneNumbers - The list of phone numbers to purchase
   * @param {string} params.subgroupId - The ID of the subgroup to assign the purchased phone numbers to
   * @param {string} [params.country='US'] - ISO-2 purchase country; US.
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumbers or subgroupId parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ message }` once the request is queued.
   */
  async purchasePhoneNumber({ phoneNumbers, subgroupId, country = 'US', options = {} }) {
    this.client._require({ phoneNumbers, subgroupId });
    return this.client(`/number`, { method: 'POST', body: { phoneNumbers, subgroupId, country }, ...options });
  }

  /**
   * Purchase one or more Toll-Free numbers via the asynchronous resource-request flow.
   *
   * Toll-Free numbers are ordered by quantity (not picked individually) and provisioned asynchronously;
   * per-number completion is delivered via webhook/polling, not in this response. The returned `orderId`
   * can be polled with {@link Numbers#getTollFreeOrderStatus} for the order's outcome.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for purchasing toll-free numbers
   * @param {number} params.quantity - The number of toll-free numbers to purchase (1-10)
   * @param {string} params.subgroupId - The subgroup the purchased numbers are assigned to
   * @param {string} [params.country='US'] - ISO-2 purchase country; US.
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the quantity or subgroupId parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ message, orderId }` once the request is queued.
   */
  async purchaseTollFreeNumbers({ quantity, subgroupId, country = 'US', options = {} }) {
    this.client._require({ quantity, subgroupId });
    return this.client(`/number/toll-free`, { method: 'POST', body: { quantity, subgroupId, country }, ...options });
  }

  /**
  * Request a campaign-bound Short Code acquisition or register a customer-owned Registry lease.
  * Random and vanity requests remain pending until Signal House staff fulfill them. An external lease creates a pending Short Code number immediately; it
  * becomes READY only when its campaign becomes ACTIVE.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - Short Code acquisition parameters.
   * @param {string} params.subgroupId - The owning subgroup ID.
   * @param {string} params.brandId - The owning Short Code brand ID.
   * @param {string} params.campaignId - The owning Short Code campaign ID.
  * @param {'RANDOM'|'VANITY'|'EXTERNAL_LEASE'} params.requestType - Acquisition path.
   * @param {number} [params.leaseTermMonths] - Required 3, 6, or 12-month term for RANDOM/VANITY.
   * @param {string} [params.requestedVanityCode] - Required five- or six-digit desired code for VANITY.
   * @param {string} [params.actualCode] - Required customer-owned five- or six-digit code for EXTERNAL_LEASE.
   * @param {string} [params.orderId] - Required Registry order ID for EXTERNAL_LEASE.
  * @param {string|Date} [params.leaseEndDate] - Required future Registry lease end date for EXTERNAL_LEASE. A YYYY-MM-DD value expires at 23:59:59 UTC.
  * @param {Blob|File} [params.leaseReceiptFile] - Required PNG, JPEG, or PDF lease receipt for EXTERNAL_LEASE.
   * @param {RequestOptions} [params.options] - Additional options for the request.
   * @returns {Promise<SdkResponse<any>>} A pending acquisition request or pending external-lease number.
   */
  async requestShortCodeAcquisition({
    subgroupId,
    brandId,
    campaignId,
    requestType,
    requestedVanityCode,
    leaseTermMonths,
    actualCode,
    orderId,
    leaseEndDate,
    leaseReceiptFile,
    options = {},
  }) {
    this.client._require({ subgroupId, brandId, campaignId, requestType });
    const formData = new FormData();
    formData.append(
      'acquisitionData',
      JSON.stringify({ subgroupId, brandId, campaignId, requestType, requestedVanityCode, leaseTermMonths, actualCode, orderId, leaseEndDate }),
    );
    if (leaseReceiptFile) formData.append('leaseReceipt', leaseReceiptFile);
    return this.multipartClient(`/number/short-code`, {
      method: 'POST',
      body: formData,
      ...options,
    });
  }

  /**
   * Read the outcome of a Toll-Free number purchase by the `orderId` returned from
   * {@link Numbers#purchaseTollFreeNumbers}. Reports per-number status as ready / provisioning / failed
   * counts (plus failure reasons) so a client can poll until the order reaches a terminal state, and
   * returns the provisioned phone numbers for the order so a client can act on exactly those numbers.
   * `numbers` is empty until each number is provisioned (it fills in as the order completes).
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for reading the order status
   * @param {string} params.orderId - The order id returned by `purchaseTollFreeNumbers`
   * @param {string} [params.groupId] - Staff and service callers only: the order's group, whose carrier the read follows.
   *   Their tokens carry no active group; every other caller's order is read by its active group, so a well-formed
   *   groupId is ignored and a malformed one gets a 400.
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the orderId parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ orderId, counts: { ready, provisioning, failed }, failures: [{ reason }], numbers: string[] }`.
   */
  async getTollFreeOrderStatus({ orderId, groupId, options = {} }) {
    this.client._require({ orderId });
    const safeOrderId = encodeURIComponent(orderId);
    const queryString = this.client._getQueryString({ groupId });
    return this.client(`/number/toll-free/order/${safeOrderId}${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Update an existing phone number's details (e.g., setting a friendly name)
   * @async
   * @roles api, admin, developer, user
   * @param {Object} params - The parameters for updating the phone number
   * @param {string} params.phoneNumber - The phone number to update
   * @param {Object} params.updateData - The data to update for the phone number
   * @param {string} [params.updateData.friendlyName] - An optional friendly name for the phone number
   * @param {string|null} [params.updateData.primaryInboundWebhookUrl] - Primary inbound voice webhook URL (http/https). When set, inbound calls to this number are driven by the SHML your webhook returns (programmable call control). Pass null or an empty string to clear.
   * @param {string|null} [params.updateData.secondaryInboundWebhookUrl] - Secondary inbound voice webhook URL (http/https), used for failover when the primary returns an error. Pass null or an empty string to clear.
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumber or updateData parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the updated phone number object
   */
  async updatePhoneNumber({ phoneNumber, updateData, options = {} }) {
    this.client._require({ phoneNumber, updateData });

    // Safely encode the phone number for the URL path
    const safePhoneNumber = encodeURIComponent(phoneNumber);

    return this.client(`/number/${safePhoneNumber}`, {
      method: 'PUT',
      body: updateData,
      ...options,
    });
  }

  /**
   * Get a phone number's outbound caller name (CNAM) - the name US carriers show for calls from it
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for the request
   * @param {string} params.phoneNumber - The phone number (E.164, leading + optional)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumber parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ phoneNumber, cnam, autoApply, eligible, ineligibleReason }`
   */
  async getCallerName({ phoneNumber, options = {} }) {
    this.client._require({ phoneNumber });
    const safePhoneNumber = encodeURIComponent(phoneNumber);
    return this.client(`/number/${safePhoneNumber}/cnam`, { method: 'GET', ...options });
  }

  /**
   * Set a phone number's outbound caller name (CNAM). The name may only remove characters from the
   * registered name of the number's brand (its campaign's brand, else `brandId`, else the subgroup's
   * default caller-ID brand), and must be 1-15 letters, digits, spaces, `-` or `_`.
   * @async
   * @roles api, admin, developer
   * @param {Object} params - The parameters for the request
   * @param {string} params.phoneNumber - The phone number (E.164, leading + optional)
   * @param {string} params.name - The caller name to show
   * @param {string} [params.brandId] - The verified brand the name comes from; only for numbers with no campaign
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumber or name parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ phoneNumber, cnam, autoApply, eligible, ineligibleReason }`
   */
  async setCallerName({ phoneNumber, name, brandId, options = {} }) {
    this.client._require({ phoneNumber, name });
    const safePhoneNumber = encodeURIComponent(phoneNumber);
    const body = brandId ? { name, brandId } : { name };
    return this.client(`/number/${safePhoneNumber}/cnam`, { method: 'PUT', body, ...options });
  }

  /**
   * Remove a phone number's own caller name (CNAM). If its subgroup has caller name auto-apply on, the
   * number goes back to the automatic name.
   * @async
   * @roles api, admin, developer
   * @param {Object} params - The parameters for the request
   * @param {string} params.phoneNumber - The phone number (E.164, leading + optional)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumber parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ phoneNumber, cnam, autoApply, eligible, ineligibleReason }`
   */
  async deleteCallerName({ phoneNumber, options = {} }) {
    this.client._require({ phoneNumber });
    const safePhoneNumber = encodeURIComponent(phoneNumber);
    return this.client(`/number/${safePhoneNumber}/cnam`, { method: 'DELETE', ...options });
  }

  /**
   * Submit a port-in request for one or more phone numbers from another provider
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for the port-in request
   * @param {Object} params.numberData - The port-in request data including owner info, address, phone numbers, and signature
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the numberData parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the created port-in request
   */
  async portInPhoneNumber({ numberData, options = {} }) {
    this.client._require({ numberData });
    return this.client(`/number/portin`, { method: 'POST', body: numberData, ...options });
  }

  /**
   * Get port-in requests with optional filters. Signal House staff can view all requests; regular users see only their group's requests.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} [params] - The parameters for filtering port-in requests
   * @param {string} [params.groupId] - Filter by group ID
   * @param {string} [params.phoneNumber] - Filter by phone number
   * @param {string} [params.status] - Filter by status (PENDING, IN_PROGRESS, ON_HOLD, REJECTED, SUCCESS)
   * @param {number} [params.page] - The page number for pagination (default: 1)
   * @param {number} [params.limit] - The number of items per page (default: 20)
   * @param {boolean} [params.excludeDocuments] - When true, leave signatureUrl and billingUrl out of each request (the inline LOA signature and billing statement). Fetch one request with getPortRequestById to read them.
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the paginated list of port-in requests
   */
  async getPortRequests({ groupId, phoneNumber, status, page, limit, excludeDocuments, options = {} } = {}) {
    const filters = { groupId, phoneNumber, status, page, limit, excludeDocuments };
    const queryString = this.client._getQueryString(filters);
    return this.client(`/number/portin${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Get a single port-in request by its ID
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for getting the port request
   * @param {string} params.id - The _id of the port-in request
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the port-in request object
   */
  async getPortRequestById({ id, options = {} }) {
    this.client._require({ id });
    const safeId = encodeURIComponent(id);
    return this.client(`/number/portin/${safeId}`, { method: 'GET', ...options });
  }

  /**
   * Get porting requests - fetches a single request by portingId, or delegates to getPortRequests for listing
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters
   * @param {string} [params.portingId] - If provided, fetches a single port request by ID
   * @param {number} [params.page] - Page number for pagination (used when listing)
   * @param {number} [params.limit] - Items per page (used when listing)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the port-in request(s)
   */
  async getPortingRequests({ portingId, page, limit, options = {} } = {}) {
    if (portingId) {
      return this.getPortRequestById({ id: portingId, options });
    }
    return this.getPortRequests({ page, limit, options });
  }

  /**
   * Assign phone numbers to a campaign by providing the campaign ID and a list of phone numbers to assign.
   * Numbers that are not found, already RELEASED, currently being released (transient PENDING_RELEASE
   * status), already assigned to a different campaign, on a mismatched DCA, or (for a 10DLC campaign
   * without a number pool) beyond the remaining 49-number-per-campaign limit are not queued - each is
   * reported back individually in `skipped` instead of failing the whole request. A Toll-Free campaign
   * whose brand reports `tollFree.maxNumbersPerCampaign` as 1 holds one number: a request that would give
   * it a second is refused with a 400 and nothing is queued.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for assigning phone numbers to a campaign
   * @param {string} params.campaignId - The ID of the campaign to assign phone numbers to
   * @param {string[]} params.phoneNumbers - The list of phone numbers to assign to the campaign
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the campaignId or phoneNumbers parameter is missing, if none of the phone numbers exist in the account, or if the campaign is not found or in a terminal state
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ Message, queued, skipped }` - `queued` numbers were sent for assignment; `skipped` numbers were rejected (not found, RELEASED, currently being released, already assigned to a campaign, cross-DCA mismatch, or over the 49-number limit).
   */
  async assignPhoneNumberToCampaign({ campaignId, phoneNumbers, options = {} }) {
    this.client._require({ campaignId, phoneNumbers });
    const safeCampaignId = encodeURIComponent(campaignId);
    return this.client(`/number/assign/${safeCampaignId}`, { method: 'POST', body: { phoneNumbers }, ...options });
  }

  /**
   * Unassign phone numbers from a campaign by providing a list of phone numbers to unassign. Note: This operation will unassign the specified phone numbers from any campaign they are currently assigned to.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for unassigning phone numbers from campaigns
   * @param {string[]} params.phoneNumbers - The list of phone numbers to unassign from campaigns
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumbers parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the result of the unassignment operation
   */
  async unassignPhoneNumbersFromCampaigns({ phoneNumbers, options = {} }) {
    this.client._require({ phoneNumbers });
    return this.client(`/number/unassign`, { method: 'POST', body: { phoneNumbers }, ...options });
  }

  /**
   * Delete a list of phone numbers (mark them as RELEASED). The phone numbers will no longer be active or usable but they will still be visible in the system with a status of "RELEASED". A number briefly shows a transient "PENDING_RELEASE" status while the deletion is being processed, before settling to "RELEASED". Note: This operation is irreversible and should be used with caution.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for deleting phone numbers
   * @param {string[]} params.phoneNumbers - The list of phone numbers to delete
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumbers parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the result of the deletion operation
   */
  async deletePhoneNumbers({ phoneNumbers, options = {} }) {
    this.client._require({ phoneNumbers });
    return this.client(`/number`, { method: 'DELETE', body: { phoneNumbers }, ...options });
  }

  /**
   * Deactivate one or more phone numbers. Numbers must be in READY status to be deactivated. Deactivated numbers will not be able to send or receive messages but will remain assigned to their subgroup and campaign.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for deactivating phone numbers
   * @param {string[]} params.phoneNumbers - The list of phone numbers to deactivate
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumbers parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to an array of updated phone number objects
   */
  async deactivatePhoneNumbers({ phoneNumbers, options = {} }) {
    this.client._require({ phoneNumbers });
    return this.client(`/number/deactivate`, { method: 'POST', body: { phoneNumbers }, ...options });
  }

  /**
   * Reactivate one or more previously deactivated phone numbers. Numbers must be in DEACTIVATED status to be reactivated. Reactivated numbers will return to PENDING or IN_PROGRESS status depending on their campaign assignment.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for reactivating phone numbers
   * @param {string[]} params.phoneNumbers - The list of phone numbers to reactivate
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @throws {Error} Throws an error if the phoneNumbers parameter is missing
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to an array of updated phone number objects
   */
  async reactivatePhoneNumbers({ phoneNumbers, options = {} }) {
    this.client._require({ phoneNumbers });
    return this.client(`/number/reactivate`, { method: 'POST', body: { phoneNumbers }, ...options });
  }

  /**
   * Transfer unassigned phone numbers from one subgroup to another.
   * @async
   * @param {Object} params - The parameters for transferring phone numbers
   * @param {string[]} params.phoneNumbers - The list of phone numbers to transfer
   * @param {string} params.newSubgroupId - The ID of the new subgroup to transfer the phone numbers to
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to the result of the transfer operation
   */
  async transferPhoneNumbers({ phoneNumbers, newSubgroupId, options = {} }) {
    this.client._require({ phoneNumbers, newSubgroupId });
    return this.client(`/number/transfer`, { method: 'POST', body: { phoneNumbers, newSubgroupId }, ...options });
  }

  /**
   * Search NPA/NXX lookup data with optional filters.
   * At least one search parameter is required.
   * Country may scope NPA/NXX filters; state and city cannot be combined with them.
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for searching NPA/NXX data
   * @param {string} [params.country] - Filter by country code
   * @param {string} [params.state] - Filter by state code (2 characters)
   * @param {string} [params.city] - Filter by city name (prefix match, case-insensitive; requires country and state)
   * @param {string} [params.npa] - Area code filter (1-3 digits; optional country, no state/city)
   * @param {string} [params.nxx] - Central office code filter (1-3 digits; optional country, no state/city)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to matching NPA/NXX records or unique NPA/NXX arrays
   */
  async searchNpaNxx({ country, state, city, npa, nxx, options = {} }) {
    const queryString = this.client._getQueryString({ country, state, city, npa, nxx });
    return this.client(`/number/lookup${queryString}`, { method: 'GET', ...options });
  }

  /**
   * Batch lookup city/state for NPA/NXX pairs
   * @async
   * @roles api, admin, developer, billing, user
   * @param {Object} params - The parameters for the lookup
   * @param {Array<{npa: string, nxx: string}>} params.entries - NPA/NXX pairs to look up (max 50)
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to an array of {npa, nxx, city, state} objects
   */
  async lookupLocations({ entries, options = {} }) {
    return this.client('/number/lookup/location', { method: 'POST', body: { entries }, ...options });
  }

  /**
   * Migrate a phone number (or all numbers in a campaign/group) from v1 to v2
   * @async
   * @roles api, admin, developer, billing, user, signalhouse_api, signalhouse_admin, signalhouse_user
   * @param {Object} params - The parameters for migration
   * @param {string} [params.phoneNumber] - The phone number to migrate
   * @param {string} [params.campaignId] - Campaign ID to migrate all numbers for
   * @param {string} [params.groupId] - Group ID to migrate all numbers for
   * @param {RequestOptions} [params.options] - Additional options for the request
   * @returns {Promise<SdkResponse<any>>} A promise that resolves to a confirmation with count of queued numbers
   */
  async migratePhoneNumberToV2({ phoneNumber, campaignId, groupId, options = {} }) {
    return this.client(`/number/migrate`, { method: 'POST', body: { phoneNumber, campaignId, groupId }, ...options });
  }
}
