/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {Object} TollFreeConsentBox
 * @property {string} useCase - The use case the checkbox covers
 * @property {string} channel - The channel the checkbox covers ("SMS" or "MMS")
 * @property {string} text - The wording rendered beside the checkbox
 */

/**
 * @typedef {Object} TollFreeLandingData
 * @property {string[]} useCases - The campaign's real use cases; one consent box is rendered per use case per channel
 * @property {string[]} channels - The channels consent covers ("SMS", "MMS", "VOICE")
 * @property {string} consentDisclosure - The shared disclosure rendered once above the consent boxes (max 1024 characters)
 * @property {TollFreeConsentBox[]} consentBoxes - The consent boxes the page renders (max 16; each text max 512 characters)
 */

/**
 * @typedef {Object} CreateLandingData
 * @property {string} brandId - The ID of the brand to associate with the landing page
 * @property {string} description - A description of the landing page
 * @property {string} primaryBackgroundColor - The primary background color for the landing page (e.g., "#FFFFFF")
 * @property {string} secondaryBackgroundColor - The secondary background color for the landing page (e.g., "#F0F0F0")
 * @property {string} primaryTextColor - The primary text color for the landing page (e.g., "#000000")
 * @property {string} secondaryTextColor - The secondary text color for the landing page (e.g., "#333333")
 * @property {Buffer} logo - A logo image file for the landing page, provided as a Buffer
 * @property {string} [registrationType] - Which page type to build: "TEN_DLC" (default) or "TOLL_FREE"
 * @property {TollFreeLandingData} [tollFree] - Toll-Free consent content; required when registrationType is "TOLL_FREE"
 * @property {boolean} [useBrandTemplate] - Toll-Free only. Build the page from the brand's landing page template,
 *   taking its colors, logo and webhook URL from there. When set, no logo file is required. `description` is
 *   still sent by the caller, since the About paragraph names the services this campaign's use cases cover.
 */

/**
 * @typedef {Object} UpdateLandingData
 * @property {string} [description] - A description of the landing page
 * @property {string} [primaryBackgroundColor] - The primary background color for the landing page (e.g., "#FFFFFF")
 * @property {string} [secondaryBackgroundColor] - The secondary background color for the landing page (e.g., "#F0F0F0")
 * @property {string} [primaryTextColor] - The primary text color for the landing page (e.g., "#000000")
 * @property {string} [secondaryTextColor] - The secondary text color for the landing page (e.g., "#333333")
 * @property {Buffer} [logo] - A logo image file for the landing page, provided as a Buffer
 * @property {string} [registrationType] - Which page type to build: "TEN_DLC" or "TOLL_FREE"
 * @property {TollFreeLandingData} [tollFree] - Replaces the whole Toll-Free consent subdocument when set
 * @property {boolean} [useBrandTemplate] - Toll-Free only. Re-copy the brand's landing page template into this
 *   page, so a corrected logo or color reaches a page that already exists instead of creating a second one.
 */

/**
 * @typedef {Object} LandingTemplateData
 * @property {string} userDescription - The customer's own sentence about their business. Not the finished About
 *   paragraph: the services clause is added per campaign when a page is generated
 * @property {string} [primaryBackgroundColor] - The primary background color (e.g., "#FFFFFF")
 * @property {string} [secondaryBackgroundColor] - The secondary background color (e.g., "#F0F0F0")
 * @property {string} [primaryTextColor] - The primary text color (e.g., "#000000")
 * @property {string} [secondaryTextColor] - The secondary text color (e.g., "#333333")
 * @property {string} [webhookUrl] - Where generated pages post opt-in submissions
 */

export class Landings {
	constructor(client, multipartClient, enableAdmin) {
		this.client = client;
		this.multipartClient = multipartClient;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Get details of a landing page by its ID
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a landing page
	 * @param {string} params.landingId - The ID of the landing page to retrieve
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the landingId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The landing page object returned from the server
	 */
	async getLandings({ landingId, options = {} }) {
		this.client._require({ landingId });
		const safeLandingId = encodeURIComponent(landingId);
		return this.client(`/landing/${safeLandingId}`, { method: "GET", ...options });
	}

	/**
	 * Get a public (published) landing page by its ID. This endpoint is public and does not require authentication.
	 * @async
	 * @param {Object} params - The parameters for getting a public landing page
	 * @param {string} params.landingId - The ID of the public landing page to retrieve
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the landingId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The public landing page object returned from the server
	 */
	async getPublicLanding({ landingId, options = {} }) {
		this.client._require({ landingId });
		const safeLandingId = encodeURIComponent(landingId);
		return this.client(`/landing/public/${safeLandingId}`, { method: "GET", ...options });
	}

	/**
	 * Create a new landing page with the specified landing data and logo file
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for creating a new landing page (see CreateLandingData typedef for details)
	 * @param {CreateLandingData} params.landingData - The data for the new landing page, including required fields such as brandId and description
	 * @param {Blob|File} params.file - A logo image file for the landing page, provided as a Blob/File
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} - The newly created landing page object returned from the server
	 */
	async createLanding({ landingData, file, options = {} }) {
		const formData = new FormData();

		if (file) {
			formData.append("file", file);
		}

		Object.entries(landingData).forEach(([key, value]) => {
			if (value !== undefined) {
				formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
			}
		});

		return this.multipartClient(`/landing`, { method: "POST", body: formData, ...options });
	}

	/**
	 * Update an existing landing page with the specified landing data and logo file
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for updating a landing page (see UpdateLandingData typedef for details)
	 * @param {string} params.landingId - The ID of the landing page to update
	 * @param {UpdateLandingData} params.landingData - The data for the landing page, including required fields such as brandId and description
	 * @param {Blob|File} params.file - A logo image file for the landing page, provided as a Blob/File
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the landingId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The updated landing page object returned from the server
	 */
	async updateLanding({ landingId, landingData, file, options = {} }) {
		this.client._require({ landingId });
		const safeLandingId = encodeURIComponent(landingId);
		const formData = new FormData();

		if (file) {
			formData.append("file", file);
		}

		Object.entries(landingData).forEach(([key, value]) => {
			if (value !== undefined) {
				formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
			}
		});

		return this.multipartClient(`/landing/${safeLandingId}`, { method: "PUT", body: formData, ...options });
	}

	/**
	 * Get a landing page by its associated brand ID
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a landing page by brand
	 * @param {string} params.brandId - The brand ID to look up the landing page for
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the brandId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The landing page object returned from the server
	 */
	async getLandingByBrandId({ brandId, options = {} }) {
		this.client._require({ brandId });
		const safeBrandId = encodeURIComponent(brandId);
		return this.client(`/landing/brand/${safeBrandId}`, { method: "GET", ...options });
	}

	/**
	 * Get a brand's Toll-Free landing page template — the reusable look every page the brand generates
	 * snapshots. Returns an empty array when the brand has no template.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a landing page template
	 * @param {string} params.brandId - The brand ID to look up the template for
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the brandId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The template returned from the server
	 */
	async getLandingTemplate({ brandId, options = {} }) {
		this.client._require({ brandId });
		const safeBrandId = encodeURIComponent(brandId);
		return this.client(`/landing/template/${safeBrandId}`, { method: "GET", ...options });
	}

	/**
	 * Create or replace a brand's Toll-Free landing page template. Editing a template never alters a page
	 * that already exists, so a URL already given to a carrier keeps rendering what was declared.
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for saving a landing page template
	 * @param {string} params.brandId - The brand the template belongs to
	 * @param {LandingTemplateData} params.templateData - The template fields (see LandingTemplateData typedef)
	 * @param {Blob|File} [params.file] - A logo image file, provided as a Blob/File. Required the first time only;
	 *   omit it on a later save to keep the stored logo
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the brandId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The saved template returned from the server
	 */
	async upsertLandingTemplate({ brandId, templateData, file, options = {} }) {
		this.client._require({ brandId });
		const safeBrandId = encodeURIComponent(brandId);
		const formData = new FormData();

		if (file) {
			formData.append("file", file);
		}

		Object.entries(templateData).forEach(([key, value]) => {
			if (value !== undefined) {
				formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
			}
		});

		return this.multipartClient(`/landing/template/${safeBrandId}`, { method: "PUT", body: formData, ...options });
	}

	/**
	 * Delete a landing page by its ID
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for deleting a landing page
	 * @param {string} params.landingId - The ID of the landing page to delete
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws an error if the landingId parameter is missing
	 * @returns {Promise<SdkResponse<any>>} - The response from the server after deleting the landing page
	 */
	async deleteLanding({ landingId, options = {} }) {
		this.client._require({ landingId });
		const safeLandingId = encodeURIComponent(landingId);
		return this.client(`/landing/${safeLandingId}`, { method: "DELETE", ...options });
	}
}
