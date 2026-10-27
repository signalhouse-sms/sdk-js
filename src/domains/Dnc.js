/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Do Not Contact domain: the attested "Disable Automated Opt-Out" account setting. Signal House
 * suppresses sends to recipients who opted out of the sending campaign by default; an account may
 * disable that only by having an officer read and e-sign the Opt-Out Handling Attestation inside a
 * Signal House app: the portal (a customer login signs for its own account) or one of our apps running
 * as signalhouse_api (GHL, Shopify), which signs for the account it names on behalf of the customer user
 * it authenticated. Every method therefore lives under the admin namespace (present only when the SDK is
 * created with `enableAdmin: true`), and the API refuses the customer "api" (API key) role on the signing
 * routes, so attestation can never be performed by a third-party integration.
 */
export class Dnc {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Get the current Opt-Out Handling Attestation text for the session's account with every placeholder
				 * filled (account values, the session's email and role, blanks in the signature block for what only
				 * signing supplies), plus the version and template hash a signature must echo back. The app must
				 * render this text; it never ships its own copy.
				 * @async
				 * @roles admin, developer, billing (portal logins); signalhouse_* with groupId
				 * @param {Object} [params] - Optional parameters
				 * @param {string} [params.groupId] - Group to render for (apps and staff; customers always get their active group)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ version, templateSha256, text, checkboxText, groupId, accountName, customerLegalName }`
				 */
				getCurrentAttestation: async ({ groupId, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ groupId });
					return this.client(`/dnc/attestation/current${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Sign the attestation and disable automated opt-out suppression for the account and every subgroup,
				 * effective within about a minute on every API instance. Two callers: a portal login signs for its own
				 * account and the signer identity is taken from the session; a Signal House app running as
				 * signalhouse_api (GHL, Shopify) signs for the `groupId` it names and supplies the identity of the
				 * customer user it authenticated (`signerEmail`, optional `signerUserId`, `signedVia`, and the end
				 * user's `signerIpAddress` / `signerUserAgent`, which otherwise default to the app server's). Resolves
				 * 201 when this call created the record and 200 with the existing record on a repeat or concurrent
				 * call. A stale version or hash is refused with 409 and `details.code === "ATTESTATION_VERSION_MISMATCH"`;
				 * an unchecked box or blank field with 400. Human staff roles and customer API-key sessions are refused.
				 * @async
				 * @roles admin, developer, billing (portal logins); signalhouse_api (apps, with groupId)
				 * @param {Object} params
				 * @param {string} params.version - The version returned by getCurrentAttestation
				 * @param {string} params.templateSha256 - The template hash returned by getCurrentAttestation
				 * @param {boolean} params.checkboxAcknowledged - Must be true
				 * @param {boolean} params.scrolledToEnd - Must be true
				 * @param {string} params.customerLegalName - Company legal name
				 * @param {string} params.signerName - Signer's typed full legal name (the electronic signature)
				 * @param {string} params.signerTitle - Signer's title
				 * @param {string} [params.groupId] - App callers: the account being attested
				 * @param {string} [params.signerEmail] - App callers (required): the signer's email as authenticated by the app
				 * @param {string} [params.signerUserId] - App callers: the app's id for the signer
				 * @param {string} [params.signedVia] - App callers: the app name, e.g. "ghl" or "shopify"
				 * @param {string} [params.signerIpAddress] - App callers: the end user's IP address
				 * @param {string} [params.signerUserAgent] - App callers: the end user's user agent
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if a required parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - `{ attestation, created }`
				 */
				signAttestation: async ({ version, templateSha256, checkboxAcknowledged, scrolledToEnd, customerLegalName, signerName, signerTitle, groupId, signerEmail, signerUserId, signedVia, signerIpAddress, signerUserAgent, options = {} }) => {
					this.client._require({ version, templateSha256, customerLegalName, signerName, signerTitle });
					const appFields = Object.fromEntries(Object.entries({ groupId, signerEmail, signerUserId, signedVia, signerIpAddress, signerUserAgent }).filter(([, value]) => value !== undefined));
					return this.client(`/dnc/attestation`, {
						method: "POST",
						body: { version, templateSha256, checkboxAcknowledged, scrolledToEnd, customerLegalName, signerName, signerTitle, ...appFields },
						...options,
					});
				},

				/**
				 * Revoke the active attestation and re-enable automated opt-out suppression, effective within about a
				 * minute: a portal login for its own account, or an app (signalhouse_api) for the `groupId` it names.
				 * The record is retained as "revoked". 404 when nothing is active.
				 * @async
				 * @roles admin, developer, billing (portal logins); signalhouse_api (apps, with groupId)
				 * @param {Object} [params] - Optional parameters
				 * @param {string} [params.groupId] - App callers: the account
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ attestation }`
				 */
				revokeAttestation: async ({ groupId, options = {} } = {}) => {
					return this.client(`/dnc/attestation/revoke`, { method: "POST", ...(groupId ? { body: { groupId } } : {}), ...options });
				},

				/**
				 * Read an account's attestation state: whether automated opt-out is disabled, the active record
				 * (full stored text included), the full history, and whether the active record predates the
				 * current template and must be re-signed by `resignDeadline`.
				 * @async
				 * @roles admin, developer, billing (portal logins); signalhouse_* with groupId
				 * @param {Object} [params] - Optional parameters
				 * @param {string} [params.groupId] - Group to read (apps and staff; customers always get their active group)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ groupId, automatedOptOutDisabled, currentVersion, currentTemplateSha256, requiresResign, resignDeadline, active, history }`
				 */
				getAttestation: async ({ groupId, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ groupId });
					return this.client(`/dnc/attestation${queryString}`, { method: "GET", ...options });
				},

				/**
				 * List opt-out attestations across every account, newest first, with each group's trailing
				 * would-have-suppressed counts (7 and 30 days, recorded while attested) and 7-day opt-out count.
				 * The full attestation text is omitted from list rows. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} [params] - Optional parameters
				 * @param {("active"|"revoked"|"superseded")} [params.status] - Filter by status
				 * @param {string} [params.groupId] - Filter by group
				 * @param {number} [params.page] - Page number (default 1)
				 * @param {number} [params.limit] - Rows per page (default 50, max 500)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} - `{ rows, totalCount, page, limit }`
				 */
				listAttestations: async ({ status, groupId, page, limit, options = {} } = {}) => {
					const queryString = this.client._getQueryString({ status, groupId, page, limit });
					return this.client(`/dnc/attestations${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Read one attestation with its stored text, hashes, signer identity, IP and user agent, plus
				 * the group's full attestation history. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.id - The attestation id
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if the id parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - `{ attestation, history }`
				 */
				getAttestationById: async ({ id, options = {} }) => {
					this.client._require({ id });
					return this.client(`/dnc/attestations/${encodeURIComponent(id)}`, { method: "GET", ...options });
				},

				/**
				 * Revoke an active attestation with a reason and re-enable automated opt-out for the account.
				 * Emails the signer and account owner. There is no staff path that creates an attestation. Staff-only.
				 * @async
				 * @roles signalhouse
				 * @param {Object} params
				 * @param {string} params.id - The attestation id
				 * @param {("carrier_complaint"|"regulator_inquiry"|"legal_request"|"excessive_opt_out_rate"|"customer_request"|"other")} params.reasonCode - Why it is being revoked
				 * @param {string} params.reason - Free-text reason shown to the customer
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @throws {Error} Throws an error if a required parameter is missing
				 * @returns {Promise<SdkResponse<any>>} - `{ attestation }` (status "revoked", revokedByType "signalhouse_admin")
				 */
				revokeAttestationById: async ({ id, reasonCode, reason, options = {} }) => {
					this.client._require({ id, reasonCode, reason });
					return this.client(`/dnc/attestations/${encodeURIComponent(id)}/revoke`, { method: "POST", body: { reasonCode, reason }, ...options });
				},
			};
		}
	}
}
