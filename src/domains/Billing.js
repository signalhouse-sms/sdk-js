/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Billing {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		if (enableAdmin) {
			this.admin = {
				/**
				 * Issue a credit to a customer's wallet
				 * @async
				 * @roles signalhouse_admin, signalhouse_api, signalhouse_user
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID to credit
				 * @param {number} params.amount - Amount in microdollars
				 * @param {string} params.transactionType - Type of credit (e.g. "Goodwill Credit", "Billing Correction")
				 * @param {string} params.description - Reason for the credit (1-500 characters)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} The created transaction object
				 */
				issueCredit: async ({ groupId, amount, transactionType, description, options = {} }) => {
					this.client._require({ groupId, amount, transactionType, description });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/billing/wallet/credit/${safeGroupId}`, {
						method: "POST",
						body: { amount, transactionType, description },
						...options,
					});
				},

				/**
				 * Update fee schedule pricing for a customer group
				 * @async
				 * @roles signalhouse_admin, signalhouse_api, signalhouse_user
				 * @param {Object} params
				 * @param {string} params.groupId - The group ID to update fees for
				 * @param {Object} params.fees - Object of fee field names to microdollar values
				 * @param {boolean} [params.overrideActiveSubscription=false] - If true, also update the active subscription fees
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} The updated fee schedule
				 */
				updateFees: async ({ groupId, fees, overrideActiveSubscription, options = {} }) => {
					this.client._require({ groupId, fees });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/billing/fees/${safeGroupId}`, {
						method: "PUT",
						body: { fees, overrideActiveSubscription },
						...options,
					});
				},
			};
		}
	}

	/**
	 * Get transaction history with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for filtering the transaction history
	 * @param {string} [params.groupId] - The ID of the group to filter by
	 * @param {string} [params.subgroupId] - The ID of the subgroup to filter by
	 * @param {string} [params.brandId] - The brand ID to filter by
	 * @param {string} [params.campaignId] - The campaign ID to filter by
	 * @param {string} [params.entryType] - The type of entry to filter by
	 * @param {string} [params.transactionType] - The type of transaction to filter by
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; normalized to start-of-UTC-day (inclusive)
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; normalized to end-of-UTC-day (inclusive). Hourly resolution is not supported
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Array>>} The response from the server
	 */
	async getTransactionHistory({ groupId, subgroupId, brandId, campaignId, entryType, transactionType, startDate, endDate, options = {} }) {
		const filters = { groupId, subgroupId, brandId, campaignId, entryType, transactionType, startDate, endDate };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/billing/wallet/transactionHistory${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get payment history (wallet recharge transactions) with server-side pagination
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for filtering payment history
	 * @param {string} params.groupId - The ID of the group to filter by
	 * @param {string} params.startDate - Start date in YYYY-MM-DD format (inclusive)
	 * @param {string} params.endDate - End date in YYYY-MM-DD format (inclusive)
	 * @param {number} [params.page=1] - Page number (positive integer)
	 * @param {number} [params.limit=10] - Results per page (positive integer, max 10000)
	 * @param {string} [params.timezone] - IANA timezone (default: "UTC")
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<{data: Array<Object>, pagination: {page: number, limit: number, totalRecords: number, totalPages: number, totalAmount: number}}>>}
	 */
	async getPaymentHistory({ groupId, startDate, endDate, page, limit, timezone, options = {} }) {
		const filters = { groupId, startDate, endDate, page, limit, timezone };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/billing/wallet/paymentHistory${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get the wallet information for a specific group
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting the wallet information
	 * @param {string} params.groupId - The ID of the group to get the wallet information for
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getWallet({ groupId, options = {} }) {
		this.client._require({ groupId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/wallet/${safeGroupId}`, { method: "GET", ...options });
	}

	/**
	 * Update the wallet settings for a specific group
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for updating the wallet settings
	 * @param {string} params.groupId - The ID of the group to update the wallet settings for
	 * @param {boolean} [params.autoRechargeEnabled] - Whether auto-recharge is enabled for the wallet
	 * @param {number} [params.autoRechargeThreshold] - The threshold amount for auto-recharge to trigger
	 * @param {number} [params.autoRechargeToAmount] - The amount to recharge to when auto-recharge is triggered
	 * @param {string} [params.primaryPaymentMethodId] - The ID of the primary payment method to use for auto-recharge
	 * @param {string} [params.secondaryPaymentMethodId] - The ID of the secondary payment method to use for auto-recharge if the primary method fails
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async updateWallet({ groupId, autoRechargeEnabled, autoRechargeThreshold, autoRechargeToAmount, primaryPaymentMethodId, secondaryPaymentMethodId, options = {} }) {
		this.client._require({ groupId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/wallet/${safeGroupId}`, {
			method: "PUT",
			body: { autoRechargeEnabled, autoRechargeThreshold, autoRechargeToAmount, primaryPaymentMethodId, secondaryPaymentMethodId },
			...options,
		});
	}

	/**
	 * Get the payment methods for a specific group
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting the payment methods
	 * @param {string} params.groupId - The ID of the group to get the payment methods for
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId parameter is missing
	 * @returns {Promise<SdkResponse<Array>>} The response from the server
	 */
	async getPaymentMethods({ groupId, options = {} }) {
		this.client._require({ groupId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/wallet/paymentMethods/${safeGroupId}`, { method: "GET", ...options });
	}

	/**
	 * Add funds to a group's wallet
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for adding funds
	 * @param {string} params.groupId - The ID of the group to add funds to
	 * @param {number} params.amount - The amount to add to the group's wallet in microdollars (e.g., $10 would be 10000000)
	 * @param {string} [params.paymentMethodId] - The ID of the payment method to use for adding funds
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId or amount parameters are missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async addFunds({ groupId, amount, paymentMethodId = undefined, options = {} }) {
		this.client._require({ groupId, amount });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/wallet/addfunds/${safeGroupId}`, { method: "POST", body: { amount, paymentMethodId }, ...options });
	}

	/**
	 * Add a payment method to a group's wallet
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for adding a payment method
	 * @param {string} params.groupId - The ID of the group to add the payment method to
	 * @param {string} params.paymentMethodId - The ID of the payment method to add
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId or paymentMethodId parameters are missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async addPaymentMethod({ groupId, paymentMethodId, options = {} }) {
		this.client._require({ groupId, paymentMethodId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/wallet/paymentMethod/${safeGroupId}`, { method: "POST", body: { paymentMethodId }, ...options });
	}

	/**
	 * Remove a payment method from a group's wallet
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for removing a payment method
	 * @param {string} params.groupId - The ID of the group to remove the payment method from
	 * @param {string} params.paymentMethodId - The ID of the payment method to remove
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId or paymentMethodId parameters are missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async removePaymentMethod({ groupId, paymentMethodId, options = {} }) {
		this.client._require({ groupId, paymentMethodId });
		const safeGroupId = encodeURIComponent(groupId);
		const safePaymentMethodId = encodeURIComponent(paymentMethodId);
		return this.client(`/billing/wallet/paymentMethod/${safeGroupId}/${safePaymentMethodId}`, { method: "DELETE", ...options });
	}

	/**
	 * Get invoice details with optional filters
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for filtering the invoice details
	 * @param {string} [params.groupId] - The ID of the group to filter by
	 * @param {string} [params.subgroupId] - The ID of the subgroup to filter by
	 * @param {string} [params.startDate] - ISO-8601 date or timestamp; normalized to start-of-UTC-day (inclusive)
	 * @param {string} [params.endDate] - ISO-8601 date or timestamp; normalized to end-of-UTC-day (inclusive). Hourly resolution is not supported
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getInvoiceDetails({ groupId, subgroupId, startDate, endDate, options = {} }) {
		const filters = { groupId, subgroupId, startDate, endDate };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/billing/invoiceDetails${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get the ledger-backed invoice summary
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.groupId - The ID of the group to filter by
	 * @param {string} [params.subgroupId] - The ID of the subgroup to filter by
	 * @param {string} params.startDate - Start date in YYYY-MM-DD format (inclusive)
	 * @param {string} params.endDate - End date in YYYY-MM-DD format (inclusive)
	 * @param {string} [params.timezone] - IANA timezone (default: "UTC")
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Array<{entryType: string, transactionType: string, unitPrice: number, quantity: number, amount: number}>>>}
	 */
	async getInvoiceLedger({ groupId, subgroupId, startDate, endDate, timezone, options = {} }) {
		const filters = { groupId, subgroupId, startDate, endDate, timezone };
		const queryString = this.client._getQueryString(filters);
		return this.client(`/billing/invoiceDetails/ledger${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get the fee schedule for a specific group.
	 * When the group is on a custom volume-tiered plan, the response also includes volumePricing: tiers, the current period's dates, count and minimum, ramp, and current rate (rates in microdollars per segment).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting the fees
	 * @param {string} params.groupId - The ID of the group to get fees for
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the groupId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getFees({ groupId, options = {} }) {
		this.client._require({ groupId });
		const safeGroupId = encodeURIComponent(groupId);
		return this.client(`/billing/fees/${safeGroupId}`, { method: "GET", ...options });
	}
}
