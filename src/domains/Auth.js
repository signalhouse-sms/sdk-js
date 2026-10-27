/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

export class Auth {
	constructor(client, enableAdmin) {
		this.client = client;
        this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Force-log-out every human user in a specific group - for account-takeover
				 * response, independent of the automatic Rejected-lockout trigger.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for forcing a group logout
				 * @param {string} params.groupId - The ID of the group whose users should be force-logged-out
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the groupId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The response containing loggedOutCount
				 */
				forceLogoutGroupUsers: async ({ groupId, options = {} }) => {
					this.client._require({ groupId });
					const safeGroupId = encodeURIComponent(groupId);
					return this.client(`/auth/groups/${safeGroupId}/logout-all`, { method: "POST", ...options });
				},
			};
		}
	}

	/**
	 * Login with email and password
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.email - The user's email address
	 * @param {string} params.password - The user's password
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async login({ email, password, options = {} }) {
		return this.client(`/auth`, { method: "POST", body: { email, password }, ...options });
	}

	/**
	 * Register a new account (creates a group and its owner user) and receive a JWT Bearer token
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.businessName - The business / group name
	 * @param {string} params.fullName - The owner's full name
	 * @param {string} params.email - The owner's work email
	 * @param {string} params.password - The owner's password (min 8 characters)
	 * @param {string} [params.phone] - National phone number
	 * @param {string} [params.dialCode] - Country dial code (e.g. "1")
	 * @param {string} [params.country] - Country ISO code (e.g. "US")
	 * @param {string} [params.volume] - Estimated monthly message volume
	 * @param {string[]} [params.products] - Products the account intends to integrate
	 * @param {boolean} [params.acceptedTermsOfService] - Whether the user accepted the Terms of Service
	 * @param {string} [params.psXid] - PartnerStack click id (ps_xid) captured from a referral link
	 * @param {string} [params.psPartnerKey] - PartnerStack partner key (ps_partner_key) captured from a referral link
	 * @param {Object} [params.attribution] - Marketing attribution captured at signup
	 * @param {string} [params.attribution.posthogDistinctId] - PostHog distinct id of the registering visitor
	 * @param {Object} [params.attribution.firstTouch] - First-ever visit: utmSource, utmMedium, utmCampaign, utmTerm, utmContent, gclid, gbraid, wbraid, fbclid, msclkid, referrer, landingUrl, timestamp
	 * @param {Object} [params.attribution.lastTouch] - Visit that registered, same keys as firstTouch
	 * @param {string} [params.attribution.shLanding] - Marketing-site landing page passed on the register link (sh_landing)
	 * @param {string} [params.attribution.shCta] - Marketing-site CTA that sent the visitor (sh_cta)
	 * @param {string} [params.attribution.shGuide] - Marketing-site guide the CTA was on (sh_guide)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server (contains the JWT token)
	 */
	async register({ businessName, fullName, email, password, phone, dialCode, country, volume, products, acceptedTermsOfService, psXid, psPartnerKey, attribution, options = {} }) {
		return this.client(`/auth/register`, {
			method: "POST",
			body: { businessName, fullName, email, password, phone, dialCode, country, volume, products, acceptedTermsOfService, psXid, psPartnerKey, attribution },
			...options,
		});
	}

	/**
	 * Verify an account email using the single-use token from the verification link, signing the
	 * account in on success.
	 *
	 * The response carries a session JWT (`token`) for the user the link was emailed to, so a click
	 * from any device establishes a session — use it exactly as you would the token from `login`.
	 * `token` is omitted when the link cannot establish a session (issued before auto-login shipped,
	 * or the account is inactive/ineligible); `verified` is still true in that case, so treat a
	 * missing token as "verified, ask them to log in" rather than as a failure.
	 *
	 * Rate limited per source IP. The token is single-use and expires 24 hours after it is issued.
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.token - The verification token from the email link
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ verified: true, token?: string })
	 */
	async verifyEmail({ token, options = {} }) {
		this.client._require({ token });
		return this.client(`/auth/verify-email`, { method: "POST", body: { token }, ...options });
	}

	/**
	 * Request a password-reset link be emailed to the given address (public). Always resolves
	 * successfully regardless of whether an account exists for the email, so it cannot be used to
	 * enumerate registered emails.
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.email - The email address to send a reset link to
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ success: true })
	 */
	async forgotPassword({ email, options = {} }) {
		this.client._require({ email });
		return this.client(`/auth/forgot-password`, { method: "POST", body: { email }, ...options });
	}

	/**
	 * Reset a password using the single-use token from a password-reset email link (public)
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.token - The single-use reset token from the email link
	 * @param {string} params.password - The new password to set (min 8 characters)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ success: true })
	 */
	async resetPasswordWithToken({ token, password, options = {} }) {
		this.client._require({ token, password });
		return this.client(`/auth/reset-password`, { method: "POST", body: { token, password }, ...options });
	}

	/**
	 * Resend the account verification email to the authenticated caller.
	 *
	 * Rate limited per user; issuing a new link invalidates the previous one.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ sent: true })
	 */
	async sendVerificationEmail({ options = {} } = {}) {
		return this.client(`/auth/send-verification-email`, { method: "POST", ...options });
	}

	/**
	 * Reset a user's password
	 * @async
	 * @roles api, admin, self
	 * @param {Object} params
	 * @param {string} params.userId - The id of the user
	 * @param {string} params.newPassword - The new password to set for the user
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async resetPassword({ userId, newPassword, options = {} }) {
        this.client._require({ userId, newPassword });
		const safeUserId = encodeURIComponent(userId);
		return this.client(`/auth/resetpassword/${safeUserId}`, { method: "PUT", body: { newPassword }, ...options });
	}

	/**
	 * Get token login history for a group or user
	 * @async
	 * @roles signalhouse_admin, signalhouse_api, signalhouse_user, admin, api (groupId query); self (userId query)
	 * @param {Object} params
	 * @param {string} [params.groupId] - Returns history for all users in the group (one of groupId/userId required)
	 * @param {string} [params.userId] - Returns history for a specific user (one of groupId/userId required)
	 * @param {number} [params.page] - Page number (min 1, default 1)
	 * @param {number} [params.limit] - Results per page (min 1, max 100, default 20)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server
	 */
	async getAuthHistory({ groupId, userId, page, limit, options = {} }) {
		this.client._require({ "groupId or userId": groupId ?? userId });
		const queryString = this.client._getQueryString({ groupId, userId, page, limit });
		return this.client(`/auth/history${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Log out all other users in the caller's active group
	 * @async
	 * @roles admin
	 * @param {Object} [params]
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response containing loggedOutCount
	 */
	async logoutAll({ options = {} } = {}) {
		return this.client(`/auth/logout-all`, { method: "POST", ...options });
	}

	/**
	 * Get the Group ID associated with the caller's JWT (the caller's active group). Useful for
	 * discovering your own groupId, which is required on most other API requests.
	 * @async
	 * @roles admin, developer, billing, user, api
	 * @param {Object} [params]
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response containing { groupId }
	 */
	async getGroupId({ options = {} } = {}) {
		return this.client(`/auth/group-id`, { method: "GET", ...options });
	}

	/**
	 * Mint a single-use, short-lived external-link token for the authenticated caller. The token is
	 * handed to the GHL/Shopify backend so it can link the caller's existing V2 group to its tenant.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.product - The external system to link to ("ghl" or "shopify")
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server ({ token })
	 */
	async requestExternalLinkToken({ product, options = {} }) {
		this.client._require({ product });
		return this.client(`/auth/external-link-token`, { method: "POST", body: { product }, ...options });
	}
}
