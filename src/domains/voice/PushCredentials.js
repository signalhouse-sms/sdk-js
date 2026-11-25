/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} ApnsCredentialData
 * @property {"apns"} provider - Apple Push Notification service (iOS).
 * @property {string} [name] - A label, up to 100 characters.
 * @property {string} keyId - The 10-character key ID of the APNs auth key (.p8).
 * @property {string} teamId - Your 10-character Apple developer team ID.
 * @property {string} bundleId - Your app's bundle ID. VoIP pushes go to its `.voip` topic.
 * @property {string} privateKey - The contents of the .p8 file.
 */

/**
 * @typedef {Object} FcmCredentialData
 * @property {"fcm"} provider - Firebase Cloud Messaging (Android).
 * @property {string} [name] - A label, up to 100 characters.
 * @property {string|Object} serviceAccount - The Firebase service account key file, as its JSON text or the parsed object.
 */

/**
 * Mobile push credentials — the Apple APNs auth key and Firebase service account the Voice service
 * uses to wake your mobile app for incoming calls. One credential per app; secrets are encrypted and
 * never returned (responses show a `fingerprint`). Calls the Voice service mounted under /voice.
 * Accessed via `sdk.voice.pushCredentials`.
 */
export class PushCredentials {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * List the account's push credentials (metadata only).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Request parameters.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: [{ id, provider, name, appId, keyId, teamId, bundleId, projectId, clientEmail, fingerprint, createdAt, updatedAt }] }`.
	 */
	async list({ options = {} } = {}) {
		return this.client(`/voice/api/v1/push-credentials`, { method: "GET", ...options });
	}

	/**
	 * Get one push credential (metadata only).
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The credential ID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { ...credential } }`.
	 */
	async get({ id, options = {} }) {
		this.client._require({ id });
		return this.client(`/voice/api/v1/push-credentials/${encodeURIComponent(id)}`, { method: "GET", ...options });
	}

	/**
	 * Upload push credentials for one app: an Apple APNs auth key, or a Firebase service account. The
	 * key is checked on upload.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {ApnsCredentialData|FcmCredentialData} params.credentialData - The credential.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If credentialData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { ...credential } }` (201).
	 */
	async create({ credentialData, options = {} }) {
		this.client._require({ credentialData });
		return this.client(`/voice/api/v1/push-credentials`, { method: "POST", body: credentialData, ...options });
	}

	/**
	 * Replace a credential's key or service account (and name). Same body as create; the provider
	 * cannot change. Registered devices keep working with the new key.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The credential ID.
	 * @param {ApnsCredentialData|FcmCredentialData} params.credentialData - The replacement.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id or credentialData is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success, data: { ...credential } }`.
	 */
	async update({ id, credentialData, options = {} }) {
		this.client._require({ id, credentialData });
		return this.client(`/voice/api/v1/push-credentials/${encodeURIComponent(id)}`, { method: "PUT", body: credentialData, ...options });
	}

	/**
	 * Delete a credential and every device registered for that app.
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - Request parameters.
	 * @param {string} params.id - The credential ID.
	 * @param {RequestOptions} [params.options] - Additional options for the request.
	 * @throws {Error} If id is missing.
	 * @returns {Promise<SdkResponse<any>>} `{ success }`.
	 */
	async delete({ id, options = {} }) {
		this.client._require({ id });
		return this.client(`/voice/api/v1/push-credentials/${encodeURIComponent(id)}`, { method: "DELETE", ...options });
	}
}
