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

				/**
				 * Turn off two-factor authentication for a user who has lost every factor (lockout recovery).
				 * Clears their methods, backup codes and trusted devices. Audited.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params - The parameters for resetting a user's two-factor authentication
				 * @param {string} params.userId - The id of the user to reset
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the userId parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - The response ({ reset: true })
				 */
				resetUserTwoFactor: async ({ userId, options = {} }) => {
					this.client._require({ userId });
					return this.client(`/auth/2fa/users/${encodeURIComponent(userId)}`, { method: "DELETE", ...options });
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
	 * @param {string} [params.deviceToken] - A trusted-device token from an earlier verifyTwoFactorChallenge; skips 2FA while valid
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} The response from the server: { token }, or { mfaRequired: true, challengeId, methods, primaryMethod, hasBackupCodes } when the account has 2FA on; or { token, twoFactorSetupRequired: true } (a setup-only session) when the user's group requires 2FA and they haven't turned it on
	 */
	async login({ email, password, deviceToken, options = {} }) {
		return this.client(`/auth`, { method: "POST", body: { email, password, deviceToken }, ...options });
	}

	/**
	 * Register a new account (creates a group and its owner user) and receive a JWT Bearer token
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.businessName - The business / group name
	 * @param {string} params.fullName - The owner's full name
	 * @param {string} params.email - The owner's work email
	 * @param {string} [params.password] - The owner's password (min 8 characters). Required unless `oauthTicket` is provided
	 * @param {string} [params.oauthTicket] - A `signup` ticket from a provider sign-in (see readOAuthTicket). Replaces the password; `email` must match the provider's email
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
	async register({ businessName, fullName, email, password, oauthTicket, phone, dialCode, country, volume, products, acceptedTermsOfService, psXid, psPartnerKey, attribution, options = {} }) {
		return this.client(`/auth/register`, {
			method: "POST",
			body: { businessName, fullName, email, password, oauthTicket, phone, dialCode, country, volume, products, acceptedTermsOfService, psXid, psPartnerKey, attribution },
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
	 * the account is inactive/ineligible, or the account has two-factor authentication on, since the
	 * link is not a second factor); `verified` is still true in that case, so treat a missing token as
	 * "verified, ask them to log in" rather than as a failure.
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

	/**
	 * List the OAuth sign-in providers enabled on this API (only providers with credentials configured)
	 * @async
	 * @roles public
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ([{ id, label }])
	 */
	async getOAuthProviders({ options = {} } = {}) {
		return this.client(`/auth/oauth/providers`, { method: "GET", ...options });
	}

	/**
	 * Build the URL that starts an OAuth sign-in. Navigate the browser to it (it is a redirect, not an
	 * API call); the API returns the user to the portal's /auth/callback with a single-use ticket.
	 * With a `linkTicket` (from createOAuthLink) it links the provider to the signed-in account instead,
	 * and the API returns the user to /Settings/Security with `pendingLink` (finish with confirmOAuthLink) or `linkError`.
	 * With a `reauthTicket` (from createOAuthReauth) the signed-in user signs in again with a linked provider to
	 * confirm it's them, and the API returns them to /Settings/Security with a single-use `pendingReauth` (the session that started it redeems it with confirmOAuthReauth) or `reauthError`.
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.provider - The provider id ("google", "microsoft", "apple" or "sso" for Enterprise SSO)
	 * @param {string} [params.next] - A same-site path (e.g. "/oauth/consent?request=abc") to return the user to
	 *   after sign-in. The API hands it back on the /auth/callback redirect as `next`; anything that isn't a
	 *   rooted path on the portal is dropped
	 * @param {string} [params.email] - Required for "sso" sign-in: the user's work email, whose domain picks the organization's identity provider. Not needed with a reauthTicket
	 * @param {string} [params.linkTicket] - Link the provider to the signed-in account that requested this ticket
	 * @param {string} [params.reauthTicket] - Sign in again with a linked provider to confirm it's the account that requested this ticket
	 * @returns {string} The absolute authorization URL
	 */
	getOAuthAuthorizationUrl({ provider, next, email, linkTicket, reauthTicket }) {
		this.client._require({ provider });
		const base = String(this.client._baseUrl).replace(/\/+$/, "");
		const query = new URLSearchParams();
		if (email) query.set("email", email);
		if (linkTicket) query.set("linkTicket", linkTicket);
		if (reauthTicket) query.set("reauthTicket", reauthTicket);
		if (next) query.set("next", next);
		const queryString = query.toString();
		return `${base}/auth/oauth/${encodeURIComponent(provider)}${queryString ? `?${queryString}` : ""}`;
	}

	/**
	 * List the caller's sign-in methods: whether they chose their own password (`passwordKnown` is false for
	 * an account created through a provider or Enterprise SSO), and every provider linked to the account
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ passwordKnown, links: [{ provider, email, linkedAt, lastLoginAt }] })
	 */
	async getOAuthLinks({ options = {} } = {}) {
		return this.client(`/auth/oauth/links`, { method: "GET", ...options });
	}

	/**
	 * Start linking Google, Microsoft or Apple to the caller's account. Returns a single-use link ticket
	 * (valid 2 minutes): navigate the browser to getOAuthAuthorizationUrl({ provider, linkTicket }).
	 * Requires a fresh confirmTwoFactorIdentity from the same session, which this spends.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.provider - "google", "microsoft" or "apple"
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ linkTicket, expiresInSeconds })
	 */
	async createOAuthLink({ provider, options = {} }) {
		this.client._require({ provider });
		return this.client(`/auth/oauth/${encodeURIComponent(provider)}/link`, { method: "POST", ...options });
	}

	/**
	 * Start signing in again with a provider already linked to the caller's account, to confirm it's them.
	 * Returns a single-use ticket (valid 2 minutes): navigate the browser to getOAuthAuthorizationUrl({ provider, reauthTicket }).
	 * The provider is asked for a fresh sign-in, and the API returns the browser to /Settings/Security with
	 * a single-use `pendingReauth` (the session that started it redeems it with confirmOAuthReauth) or `reauthError` (reauth_wrong_account, reauth_unsupported, reauth_stale, invalid_state,
	 * sso_not_configured, access_denied or provider_error). Spends nothing.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.provider - "google", "microsoft", "apple" or "sso"; must be linked to the account
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ reauthTicket, reauthSecret, expiresInSeconds }). Keep
	 *   `reauthSecret` in the client that started the flow: it is returned only here, and confirmOAuthReauth needs it
	 */
	async createOAuthReauth({ provider, options = {} }) {
		this.client._require({ provider });
		return this.client(`/auth/oauth/${encodeURIComponent(provider)}/reauth`, { method: "POST", ...options });
	}

	/**
	 * Finish signing in again with a linked provider. The round trip started with createOAuthReauth returns the
	 * browser to /Settings/Security with a single-use `pendingReauth` (valid 5 minutes); this redeems it, but only
	 * for the same account and the same session that called createOAuthReauth, so a re-sign-in completed in
	 * someone else's browser confirms nothing. Fails with 400 when it expired or was used, 403 for another account or session.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.pendingReauth - The `pendingReauth` query parameter from the redirect
	 * @param {string} params.reauthSecret - The `reauthSecret` createOAuthReauth returned; a wrong or missing secret is refused (403) and uses up the pending re-sign-in
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server: { identityConfirmed } (true when 2FA is off, so it counts as a confirmed identity)
	 */
	async confirmOAuthReauth({ pendingReauth, reauthSecret, options = {} }) {
		this.client._require({ pendingReauth, reauthSecret });
		return this.client(`/auth/oauth/reauth/confirm`, { method: "POST", body: { pendingReauth, reauthSecret }, ...options });
	}

	/**
	 * Finish linking a provider. The provider round trip started with createOAuthLink returns the browser to
	 * /Settings/Security with a single-use `pendingLink`; this links it, but only for the account the link was
	 * started for, so a link URL opened in someone else's browser can't attach their provider to your account.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.pendingLink - The `pendingLink` query parameter from the redirect
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server: the caller's { passwordKnown, links }
	 */
	async confirmOAuthLink({ pendingLink, options = {} }) {
		this.client._require({ pendingLink });
		return this.client(`/auth/oauth/links/confirm`, { method: "POST", body: { pendingLink }, ...options });
	}

	/**
	 * Unlink a provider from the caller's account. Refused when it is the account's only way to sign in.
	 * Requires a fresh confirmTwoFactorIdentity from the same session.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.provider - "google", "microsoft", "apple" or "sso"
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server: the remaining { passwordKnown, links }
	 */
	async deleteOAuthLink({ provider, options = {} }) {
		this.client._require({ provider });
		return this.client(`/auth/oauth/${encodeURIComponent(provider)}/link`, { method: "DELETE", ...options });
	}

	/**
	 * Read what a single-use OAuth ticket resolves to, without consuming it: a `session` (ready to
	 * exchange), a `select` (pick one of several accounts) or a `signup` (finish registration)
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.ticket - The ticket from the OAuth callback redirect
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ kind, provider, profile?, accounts? })
	 */
	async readOAuthTicket({ ticket, options = {} }) {
		this.client._require({ ticket });
		return this.client(`/auth/oauth/ticket`, { method: "POST", body: { ticket }, ...options });
	}

	/**
	 * Exchange a single-use `session` or `select` OAuth ticket for a JWT Bearer token. Consumes the ticket.
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.ticket - The ticket from the OAuth callback redirect
	 * @param {string} [params.userId] - Required for a `select` ticket: the chosen account from `accounts`
	 * @param {string} [params.deviceToken] - A trusted-device token from an earlier verifyTwoFactorChallenge; skips 2FA while valid
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server: { token }, or { mfaRequired: true, challengeId, ... } when the account has 2FA on; or { token, twoFactorSetupRequired: true } (a setup-only session) when the user's group requires 2FA and they haven't turned it on
	 */
	async exchangeOAuthTicket({ ticket, userId, deviceToken, options = {} }) {
		this.client._require({ ticket });
		return this.client(`/auth/oauth/exchange`, { method: "POST", body: { ticket, userId, deviceToken }, ...options });
	}

	/**
	 * Get the caller's two-factor authentication settings: enrolled methods (targets masked), the default
	 * method, backup-code counts and trusted devices. Never returns secrets or codes.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server (the settings object)
	 */
	async getTwoFactorSettings({ options = {} } = {}) {
		return this.client(`/auth/2fa`, { method: "GET", ...options });
	}

	/**
	 * Confirm it's really the account owner before a sensitive change: startTwoFactorEnrollment,
	 * removeTwoFactorMethod, regenerateBackupCodes, disableTwoFactor, createOAuthLink, deleteOAuthLink, or
	 * groups.saveSsoConnection / groups.deleteSsoConnection. With 2FA on, pass a current `code` (or a backup
	 * code); with 2FA off, pass the account `password`, or, for an account without a password of its own
	 * (getOAuthLinks returns passwordKnown: false), the `code` from sendTwoFactorIdentityCode({ method: "email" })
	 * with method "email". A confirmation lasts 5 minutes, belongs to the session that made it, and unlocks
	 * exactly one change.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {string} [params.password] - The account password. Required while 2FA is off
	 * @param {string} [params.code] - A code from an enrolled method, or a backup code. Required while 2FA is on
	 * @param {string} [params.method] - The method the code came from; defaults to the primary method
	 * @param {boolean} [params.usingBackupCode] - True when `code` is a backup code
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ confirmed: true, expiresInSeconds })
	 */
	async confirmTwoFactorIdentity({ password, code, method, usingBackupCode, options = {} } = {}) {
		return this.client(`/auth/2fa/confirm-identity`, { method: "POST", body: { password, code, method, usingBackupCode }, ...options });
	}

	/**
	 * Send a code by text or email to use with confirmTwoFactorIdentity. An authenticator app needs no send.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.method - An enrolled "sms" or "email" method, or "email" for an account without a password of its own
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ sent, target, expiresInSeconds? })
	 */
	async sendTwoFactorIdentityCode({ method, options = {} }) {
		this.client._require({ method });
		return this.client(`/auth/2fa/confirm-identity/send`, { method: "POST", body: { method }, ...options });
	}

	/**
	 * Start enrolling a two-factor method. For "app" the response carries the setup secret and otpauth URI
	 * (render it as a QR code); for "sms" and "email" a code is sent to the given phone or address.
	 * Requires a fresh confirmTwoFactorIdentity from the same session (403 otherwise); each confirmation unlocks one change.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.method - "app", "sms" or "email"
	 * @param {string} [params.phone] - Required for "sms": the mobile number to send codes to
	 * @param {string} [params.address] - Required for "email": the address to send codes to
	 * @param {string} [params.deviceName] - Optional label for an authenticator app
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ enrollmentId, secret?, otpauthUri?, sentTo? })
	 */
	async startTwoFactorEnrollment({ method, phone, address, deviceName, options = {} }) {
		this.client._require({ method });
		return this.client(`/auth/2fa/enroll`, { method: "POST", body: { method, phone, address, deviceName }, ...options });
	}

	/**
	 * Confirm a pending enrollment with the code from the app, text or email. The first method enrolled turns
	 * 2FA on and returns a set of backup codes, shown only this once.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.enrollmentId - From startTwoFactorEnrollment
	 * @param {string} params.code - The 6-digit code
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ settings, backupCodes })
	 */
	async confirmTwoFactorEnrollment({ enrollmentId, code, options = {} }) {
		this.client._require({ enrollmentId, code });
		return this.client(`/auth/2fa/enroll/${encodeURIComponent(enrollmentId)}/verify`, { method: "POST", body: { code }, ...options });
	}

	/**
	 * Choose which enrolled method is offered first at sign-in
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.method - An enrolled method: "app", "sms" or "email"
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server (the settings object)
	 */
	async setTwoFactorPrimaryMethod({ method, options = {} }) {
		this.client._require({ method });
		return this.client(`/auth/2fa/primary`, { method: "PUT", body: { method }, ...options });
	}

	/**
	 * Remove an enrolled two-factor method. Removing the last one turns 2FA off.
	 * Requires a fresh confirmTwoFactorIdentity from the same session (403 otherwise); each confirmation unlocks one change.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.method - "app", "sms" or "email"
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server (the settings object)
	 */
	async removeTwoFactorMethod({ method, options = {} }) {
		this.client._require({ method });
		return this.client(`/auth/2fa/methods/${encodeURIComponent(method)}`, { method: "DELETE", ...options });
	}

	/**
	 * Replace all backup codes with a new set. The previous codes stop working; the new ones are shown only once.
	 * Requires a fresh confirmTwoFactorIdentity from the same session (403 otherwise); each confirmation unlocks one change.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ codes, settings })
	 */
	async regenerateBackupCodes({ options = {} } = {}) {
		return this.client(`/auth/2fa/backup-codes`, { method: "POST", ...options });
	}

	/**
	 * Stop trusting a device, so its next sign-in asks for the second factor again
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} params
	 * @param {string} params.deviceId - The trusted device's id from getTwoFactorSettings
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server (the settings object)
	 */
	async revokeTrustedDevice({ deviceId, options = {} }) {
		this.client._require({ deviceId });
		return this.client(`/auth/2fa/trusted-devices/${encodeURIComponent(deviceId)}`, { method: "DELETE", ...options });
	}

	/**
	 * Turn two-factor authentication off: removes every method, backup code and trusted device.
	 * Requires a fresh confirmTwoFactorIdentity from the same session (403 otherwise); each confirmation unlocks one change.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server (the settings object)
	 */
	async disableTwoFactor({ options = {} } = {}) {
		return this.client(`/auth/2fa`, { method: "DELETE", ...options });
	}

	/**
	 * Whether the "secure your account" enrollment prompt is due for the caller
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ due })
	 */
	async getTwoFactorPrompt({ options = {} } = {}) {
		return this.client(`/auth/2fa/prompt`, { method: "GET", ...options });
	}

	/**
	 * Dismiss the enrollment prompt ("Set up later") until the next sign-in. It stops for good after three dismissals.
	 * @async
	 * @roles admin, developer, billing, user
	 * @param {Object} [params]
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ due: false })
	 */
	async dismissTwoFactorPrompt({ options = {} } = {}) {
		return this.client(`/auth/2fa/prompt/dismiss`, { method: "POST", ...options });
	}

	/**
	 * Send a sign-in code by text or email for a pending two-factor challenge. Not needed for "app".
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.challengeId - From the mfaRequired login or exchange response
	 * @param {string} params.method - "sms" or "email"
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ sent, target, expiresInSeconds })
	 */
	async sendTwoFactorChallengeCode({ challengeId, method, options = {} }) {
		this.client._require({ challengeId, method });
		return this.client(`/auth/2fa/challenge/${encodeURIComponent(challengeId)}/send`, { method: "POST", body: { method }, ...options });
	}

	/**
	 * Verify a sign-in code (or a backup code) for a pending two-factor challenge and receive the session JWT.
	 * With rememberDevice the response also carries a deviceToken to pass on later logins.
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.challengeId - From the mfaRequired login or exchange response
	 * @param {string} params.code - The 6-digit code, or a backup code (xxxx-xxxx)
	 * @param {string} [params.method] - The method the code came from ("app", "sms" or "email"); defaults to the primary method
	 * @param {boolean} [params.usingBackupCode] - True when code is a backup code
	 * @param {boolean} [params.rememberDevice] - Trust this device for 30 days
	 * @param {string} [params.deviceName] - Label for the trusted device (e.g. "Chrome on Windows")
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ token, deviceToken? })
	 */
	async verifyTwoFactorChallenge({ challengeId, code, method, usingBackupCode, rememberDevice, deviceName, options = {} }) {
		this.client._require({ challengeId, code });
		return this.client(`/auth/2fa/challenge/${encodeURIComponent(challengeId)}/verify`, {
			method: "POST",
			body: { code, method, usingBackupCode, rememberDevice, deviceName },
			...options,
		});
	}

	/**
	 * Cancel a pending two-factor challenge (e.g. "Back to sign in")
	 * @async
	 * @roles public
	 * @param {Object} params
	 * @param {string} params.challengeId - From the mfaRequired login or exchange response
	 * @param {import('../SignalHouseSDK.js').RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<Object>} The response from the server ({ cancelled: true })
	 */
	async cancelTwoFactorChallenge({ challengeId, options = {} }) {
		this.client._require({ challengeId });
		return this.client(`/auth/2fa/challenge/${encodeURIComponent(challengeId)}`, { method: "DELETE", ...options });
	}
}
