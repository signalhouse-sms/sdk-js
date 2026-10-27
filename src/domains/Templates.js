/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * A version selector: a positive version number, "draft" or "published". Omitted means the published
 * version when one exists, otherwise the draft; an explicit selector never falls back (404 when missing).
 * @typedef {number|"draft"|"published"} VersionSelector
 */

/**
 * @typedef {Object} RcsVariable
 * @property {string} key - Placeholder key used as {{key}} (/^[a-z][a-z0-9_]{0,63}$/)
 * @property {string} [label] - Display label
 * @property {"text"|"number"|"dateTime"|"phoneNumber"|"url"} type - Value type
 * @property {boolean} required - Whether a send must supply a value
 * @property {string} [default] - Value used when none is supplied
 * @property {string} [sample] - Example value for previews
 */

/**
 * The raw RCS template body. Unknown keys are rejected at every level; see the API docs for the block,
 * suggestion and fallback shapes.
 * @typedef {Object} RcsTemplateBody
 * @property {"rcs"} channel - Always "rcs"
 * @property {"rcs.blocks.v1"} contentFormat - Always "rcs.blocks.v1"
 * @property {{ blocks: Object[] }} content - Ordered blocks of kind text, richCard, video, carousel, suggestions or attachment
 * @property {RcsVariable[]} [variables] - Declared placeholders; omitted means []
 * @property {{ trafficType?: string, ttlSeconds?: number }} [defaults] - Send defaults; omitted means {}
 * @property {{ delivery?: { channel: "sms"|"mms", campaignId?: string, phoneNumber?: string, content: Object }, validitySeconds?: number }} [fallback] - SMS/MMS sent when RCS cannot be delivered; no delivery means no fallback
 */

/**
 * @typedef {Object} TemplateHead
 * @property {string} templateId - "TPL" + 10 characters
 * @property {string} groupId - Owning group
 * @property {"rcs"} channel - Template channel
 * @property {string} name - 1-120 characters, unique per group and channel
 * @property {string|null} tag - Tag (1-60 characters) or null
 * @property {string|null} archivedAt - When the template was archived
 * @property {number|null} draftVersion - The current draft version
 * @property {number|null} publishedVersion - The current published version
 * @property {number} revision - Head revision, incremented on every write; starts at 1
 * @property {string} createdBy - Creating user
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * @typedef {TemplateHead & { state: "DRAFT"|"PUBLISHED"|"ARCHIVED", hasUnpublishedChanges: boolean }} TemplateSummary
 */

/**
 * @typedef {Object} VersionSummary
 * @property {string} templateId - The template ID
 * @property {string} groupId - Owning group
 * @property {number} version - Version number
 * @property {"DRAFT"|"PUBLISHED"} state - Version state
 * @property {string} contentHash - Hex SHA-256 of the canonical body JSON
 * @property {string} createdBy - Creating user
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 * @property {string|null} publishedAt - ISO timestamp
 */

/**
 * @typedef {VersionSummary & { body: RcsTemplateBody }} TemplateVersion
 */

/**
 * @typedef {Object} TemplateDetail
 * @property {TemplateSummary} head - The template head
 * @property {TemplateVersion} version - The selected version
 */

/**
 * @template T
 * @typedef {{ data: T[], total: number, page: number, limit: number }} Page
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {"error"|"warning"} severity - Issue severity
 * @property {string} path - JSON path of the offending field
 * @property {string} code - Machine-readable code
 * @property {string} message - Human-readable message
 * @property {string} [blockId] - The block the issue belongs to
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the body is publishable
 * @property {string} contentHash - Hex SHA-256 of the canonical body JSON
 * @property {string} validatorVersion - The validator that produced the result
 * @property {ValidationIssue[]} errors - Publication errors
 * @property {ValidationIssue[]} warnings - Non-blocking warnings
 */

/**
 * @typedef {Object} MediaAsset
 * @property {string} mediaId - "MED" + 10 characters
 * @property {string} groupId - Owning group
 * @property {string} url - Public HTTPS URL to reference from a template body
 * @property {number} bytes - File size
 * @property {string} mimeType - MIME type
 * @property {"image"|"video"|"audio"|"file"} kind - Media kind
 * @property {number|null} width - Pixel width, when known
 * @property {number|null} height - Pixel height, when known
 * @property {string} createdAt - ISO timestamp
 */

/**
 * Server-defined channel capabilities; values come from the server and drive client-side editors.
 * @typedef {Object} Capabilities
 * @property {"rcs"} channel - The channel described
 * @property {"rcs.blocks.v1"} contentFormat - The body format
 * @property {string} validatorVersion - The validator version
 * @property {string[]} blockKinds - Allowed block kinds
 * @property {string[]} actionTypes - Allowed suggestion types
 * @property {string[]} variableTypes - Allowed variable types
 * @property {string[]} trafficTypes - Allowed traffic types
 * @property {string[]} cardWidths - Allowed carousel card widths
 * @property {string[]} mediaHeights - Allowed card media heights
 * @property {Object<string, number>} limits - Length and count limits (maxBlocks, maxTextLength, maxCarouselCards, ...)
 * @property {{ maxUploadBytes: number, mimeTypes: string[] }} media - Upload constraints
 * @property {{ provider: "infobip"|"sinch", adapterVersion: string, limits: Object<string, number>, unsupported: Array<{ feature: string, code: string, message: string }> }|null} provider - Provider-specific limits when a provider was requested
 */

/**
 * Build the client-side validation error the SDK throws for a malformed request.
 * @param {string} message - The error message
 * @returns {Error & { status?: number }} - An error named SignalHouseValidationError with status 400
 */
function validationError(message) {
	const error = /** @type {Error & { status?: number }} */ (new Error(message));
	error.name = "SignalHouseValidationError";
	error.status = 400;
	return error;
}

/**
 * Build the update request body; a null tag stays on the wire, an undefined one is dropped.
 * @param {Object} params - The update fields
 * @param {string} params.groupId - The owning group
 * @param {string} [params.name] - New name
 * @param {string|null} [params.tag] - New tag; null clears it, undefined leaves it unchanged
 * @param {RcsTemplateBody} [params.body] - Full replacement body
 * @returns {Object} - The request body
 */
export function templateUpdateBody({ groupId, name, tag, body }) {
	return { groupId, name, tag, body };
}

/**
 * Build the validate request body from exactly one of body or version.
 * @param {Object} params - The validate fields
 * @param {string} params.groupId - The owning group
 * @param {RcsTemplateBody} [params.body] - An unsaved body to validate
 * @param {VersionSelector} [params.version] - A stored version to validate
 * @throws {Error} Throws a SignalHouseValidationError unless exactly one of body or version is given
 * @returns {Object} - The request body
 */
export function templateValidateBody({ groupId, body, version }) {
	const hasBody = body !== undefined && body !== null;
	const hasVersion = version !== undefined && version !== null;
	if (hasBody === hasVersion) throw validationError("Pass exactly one of body or version");
	return hasBody ? { groupId, body } : { groupId, version };
}

/**
 * Build the multipart form for a media upload.
 * @param {Object} params - The upload fields
 * @param {string} params.groupId - The owning group
 * @param {Blob|File} params.file - The file to upload
 * @param {string} [params.fileName] - File name to send with the file
 * @returns {FormData} - The form with file and groupId fields
 */
export function templateMediaForm({ groupId, file, fileName }) {
	const formData = new FormData();
	if (fileName) formData.append("file", file, fileName);
	else formData.append("file", file);
	formData.append("groupId", groupId);
	return formData;
}

/**
 * Channel-generic message templates under /template. Templates keep an immutable published version and
 * at most one editable draft; writes apply directly (last write wins). 404 while the environment's RCS
 * switch is off.
 */
export class Templates {
	constructor(client, multipartClient, enableAdmin) {
		this.client = client;
		this.multipartClient = multipartClient;
		this.enableAdmin = enableAdmin;
	}

	/**
	 * Create a template with draft version 1
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for creating a template
	 * @param {string} params.groupId - The owning group
	 * @param {string} params.name - Template name (1-120 characters, unique per group and channel)
	 * @param {string} [params.tag] - Tag (1-60 characters)
	 * @param {RcsTemplateBody} params.body - The raw template body
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<TemplateDetail>>} A promise that resolves to the new template and its draft (201)
	 */
	async create({ groupId, name, tag, body, options = {} }) {
		this.client._require({ groupId, name, body });
		return this.client(`/template`, {
			method: "POST",
			body: { groupId, name, tag, body },
			...options,
		});
	}

	/**
	 * List a group's templates
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing templates
	 * @param {string} params.groupId - The owning group
	 * @param {("DRAFT"|"PUBLISHED"|"ARCHIVED")} [params.state] - Filter by state
	 * @param {"rcs"} [params.channel] - Filter by channel
	 * @param {string} [params.tag] - Filter by tag
	 * @param {string} [params.search] - Search template names
	 * @param {("name"|"createdAt"|"updatedAt")} [params.sortBy] - Sort field
	 * @param {("asc"|"desc")} [params.sortOrder] - Sort direction
	 * @param {number} [params.page] - Page number (default 1)
	 * @param {number} [params.limit] - Templates per page (default 25, max 100)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Page<TemplateSummary>>>} A promise that resolves to { data, total, page, limit }
	 */
	async list({ groupId, state, channel, tag, search, sortBy, sortOrder, page, limit, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, state, channel, tag, search, sortBy, sortOrder, page, limit });
		return this.client(`/template${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Get a template with one of its versions
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting a template
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {VersionSelector} [params.version] - Version to return; defaults to published, else draft
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<TemplateDetail>>} A promise that resolves to { head, version }
	 */
	async get({ templateId, groupId, version, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		const queryString = this.client._getQueryString({ groupId, version });
		return this.client(`/template/${safeId}${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Update a template's name, tag or draft body; editing the body of a published template opens a new draft
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for updating a template
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {string} [params.name] - New name
	 * @param {string|null} [params.tag] - New tag; null clears it, omitted leaves it unchanged
	 * @param {RcsTemplateBody} [params.body] - Full replacement body
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<TemplateDetail>>} A promise that resolves to { head, version }
	 */
	async update({ templateId, groupId, name, tag, body, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		return this.client(`/template/${safeId}`, {
			method: "PUT",
			body: templateUpdateBody({ groupId, name, tag, body }),
			...options,
		});
	}

	/**
	 * Publish a template's current draft; no draft returns 409 NO_DRAFT, a draft changed mid-publish returns 409 DRAFT_CHANGED (publish again) and an incomplete draft returns 400 TEMPLATE_INVALID
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for publishing a template
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<TemplateDetail>>} A promise that resolves to { head, version } for the published version
	 */
	async publish({ templateId, groupId, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		return this.client(`/template/${safeId}/publish`, {
			method: "POST",
			body: { groupId },
			...options,
		});
	}

	/**
	 * Archive a template
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for archiving a template
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<TemplateHead>>} A promise that resolves to the archived template head
	 */
	async archive({ templateId, groupId, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		return this.client(`/template/${safeId}/archive`, {
			method: "POST",
			body: { groupId },
			...options,
		});
	}

	/**
	 * List a template's versions without their bodies
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for listing versions
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {number} [params.page] - Page number (default 1)
	 * @param {number} [params.limit] - Versions per page (default 25, max 100)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Page<VersionSummary>>>} A promise that resolves to { data, total, page, limit }
	 */
	async versions({ templateId, groupId, page, limit, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		const queryString = this.client._getQueryString({ groupId, page, limit });
		return this.client(`/template/${safeId}/versions${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Validate an unsaved body or a stored version without writing anything
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for validation; pass exactly one of body or version
	 * @param {string} params.templateId - The template ID
	 * @param {string} params.groupId - The owning group
	 * @param {RcsTemplateBody} [params.body] - An unsaved body to validate
	 * @param {VersionSelector} [params.version] - A stored version to validate
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @throws {Error} Throws a SignalHouseValidationError unless exactly one of body or version is given
	 * @returns {Promise<SdkResponse<ValidationResult>>} A promise that resolves to { valid, contentHash, validatorVersion, errors, warnings }
	 */
	async validate({ templateId, groupId, body, version, options = {} }) {
		this.client._require({ templateId, groupId });
		const safeId = encodeURIComponent(templateId);
		return this.client(`/template/${safeId}/validate`, {
			method: "POST",
			body: templateValidateBody({ groupId, body, version }),
			...options,
		});
	}

	/**
	 * Get a channel's template capabilities: allowed blocks, actions, limits and upload constraints
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The parameters for getting capabilities
	 * @param {string} params.groupId - The owning group
	 * @param {"rcs"} [params.channel] - The channel (default "rcs")
	 * @param {("infobip"|"sinch")} [params.provider] - Include this provider's limits and unsupported features
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<Capabilities>>} A promise that resolves to the capabilities
	 */
	async capabilities({ groupId, channel, provider, options = {} }) {
		this.client._require({ groupId });
		const queryString = this.client._getQueryString({ groupId, channel, provider });
		return this.client(`/template/capabilities${queryString}`, { method: "GET", ...options });
	}

	/**
	 * Upload a media file for use in template bodies; returns its public URL. 503 when media storage is not configured
	 * @async
	 * @roles api, admin, developer
	 * @param {Object} params - The parameters for the upload
	 * @param {string} params.groupId - The owning group
	 * @param {Blob|File} params.file - The file to upload
	 * @param {string} [params.fileName] - File name to send with the file
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<MediaAsset>>} A promise that resolves to the stored media asset (201)
	 */
	async uploadMedia({ groupId, file, fileName, options = {} }) {
		this.client._require({ groupId, file });
		return this.multipartClient(`/template/media`, {
			method: "POST",
			body: templateMediaForm({ groupId, file, fileName }),
			...options,
		});
	}
}
