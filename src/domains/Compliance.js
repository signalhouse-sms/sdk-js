/** @typedef {import('../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * Compliance cases under /compliance. Signal House opens a case when a carrier suspends one of your objects, a carrier
 * escalates a message, or Signal House needs something from you. You read your cases, answer their requirements and
 * upload files; only Signal House opens, works and closes them. Staff methods are under `admin` (enableAdmin).
 */
export class Compliance {
	/**
	 * Keep the JSON and multipart clients every compliance request goes through.
	 * @param {any} client - The JSON request client
	 * @param {any} multipartClient - The multipart request client, for file uploads
	 * @param {boolean} [enableAdmin] - Whether the staff methods under `admin` are available
	 */
	constructor(client, multipartClient, enableAdmin) {
		this.client = client;
		this.multipartClient = multipartClient;
		this.enableAdmin = enableAdmin;

		if (enableAdmin) {
			this.admin = {
				/**
				 * Log an alert by hand: a reading, a notice or a block. Blocks (and a Sev-0 carrier ticket) need signalhouse_admin.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The alert
				 * @param {Object} params.data - `{ form, type, subject: { kind, id }, ... }`: the intake input without a raw payload
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ logged, recovered, updated, unmatched, duplicate }`
				 */
				logAlert: async ({ data, options = {} }) => {
					this.client._require({ data });
					return this.client(`/compliance/alerts`, { method: "POST", body: data, ...options });
				},

				/**
				 * Lift a block by hand. signalhouse_admin only.
				 * @async
				 * @roles signalhouse_admin
				 * @param {Object} params - The lift
				 * @param {string} params.alertId - The block alert (ALR-…)
				 * @param {string} [params.note] - Why it lifted
				 * @param {string} [params.occurredAt] - When the source says it lifted (ISO 8601)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ alertId, recoveredAt, caseId, caseClosed, closeReason }`
				 */
				liftBlock: async ({ alertId, note, occurredAt, options = {} }) => {
					this.client._require({ alertId });
					const body = { ...(note !== undefined && { note }), ...(occurredAt !== undefined && { occurredAt }) };
					return this.client(`/compliance/alerts/${encodeURIComponent(alertId)}/lift`, { method: "POST", body, ...options });
				},

				/**
				 * List alerts, with the inbox counts.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} [params] - Filters: type, form, severity, channel, source, subjectKind, subjectId, number, groupId, subgroupId, campaignId, caseId, inbox, open, blocks, slackPending, from, to, page, limit
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ data, total, page, limit, totalPages, counts: { inCase, inbox, noted } }`
				 */
				getAlerts: async ({ options = {}, ...filters } = {}) => {
					return this.client(`/compliance/alerts${this.client._getQueryString(filters)}`, { method: "GET", ...options });
				},

				/**
				 * Get one alert with its raw payload, escalation chain, case summary and timeline.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The lookup
				 * @param {string} params.alertId - The alert (ALR-…)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the alert with `chain`, `case` and `timeline`
				 */
				getAlert: async ({ alertId, options = {} }) => {
					this.client._require({ alertId });
					return this.client(`/compliance/alerts/${encodeURIComponent(alertId)}`, { method: "GET", ...options });
				},

				/**
				 * Work an inbox alert: `{ action: "assign", caseId }`, `{ action: "assign", object: { objectType, objectId } }` or `{ action: "note", note }`.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The action
				 * @param {string} params.alertId - The inbox alert (ALR-…)
				 * @param {Object} params.data - The action body
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the alert after the action
				 */
				triageAlert: async ({ alertId, data, options = {} }) => {
					this.client._require({ alertId, data });
					return this.client(`/compliance/alerts/${encodeURIComponent(alertId)}`, { method: "PUT", body: data, ...options });
				},

				/**
				 * Open a case by hand to send the customer a notice; its requirements go out at once. 409 when the object already has an open case.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The case
				 * @param {Object} params.data - `{ objectType, objectId, reasonTemplate, reason?, customerNote?, requirements: [{ kind, text }], fixByDays? }`
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				openCase: async ({ data, options = {} }) => {
					this.client._require({ data });
					return this.client(`/compliance/cases`, { method: "POST", body: data, ...options });
				},

				/**
				 * Take, give or release ownership (assigneeUserId, null to release), and edit reasonTemplate, reason and customerNote.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The change
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {Object} params.data - `{ assigneeUserId?, reasonTemplate?, reason?, customerNote? }`
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				updateCase: async ({ caseId, data, options = {} }) => {
					this.client._require({ caseId, data });
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}`, { method: "PUT", body: data, ...options });
				},

				/**
				 * Send requirements the first time, or add more; either hands the case to the customer.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The requirements
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {Array<{kind: string, text: string}>} params.requirements - RECORDS, CAMPAIGN_EDIT, NUMBER_ACTION or CONFIRM, with the text
				 * @param {number} [params.fixByDays] - Days until they are due, 1-14 (default 5)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				sendRequirements: async ({ caseId, requirements, fixByDays, options = {} }) => {
					this.client._require({ caseId, requirements });
					const body = { requirements, ...(fixByDays !== undefined && { fixByDays }) };
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/requirements`, { method: "PUT", body, ...options });
				},

				/**
				 * Record that the lift request went upstream. The case must hold an open carrier suspension or provider pause.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The request
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {string} [params.note] - What was sent
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				requestLift: async ({ caseId, note, options = {} }) => {
					this.client._require({ caseId });
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/lift-request`, { method: "POST", body: { ...(note !== undefined && { note }) }, ...options });
				},

				/**
				 * Close a case. Lift its open blocks first.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The close
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {string} params.closeReason - CUSTOMER_REMEDIATED, SUSPENDED_BY_CARRIER, LIFTED, LABEL_REMOVED, TRACEBACK_ANSWERED, FALSE_POSITIVE or CLEARED
				 * @param {string} [params.closeNote] - Why
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the closed case
				 */
				closeCase: async ({ caseId, closeReason, closeNote, options = {} }) => {
					this.client._require({ caseId, closeReason });
					const body = { closeReason, ...(closeNote !== undefined && { closeNote }) };
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/close`, { method: "POST", body, ...options });
				},

				/**
				 * Email the customer a reminder of the requirements still open.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The reminder
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				remindCase: async ({ caseId, options = {} }) => {
					this.client._require({ caseId });
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/reminder`, { method: "POST", body: {}, ...options });
				},

				/**
				 * Add a staff note, or an email to or from the upstream, to a case's history.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The note
				 * @param {string} params.caseId - The case (CASE-…)
				 * @param {string} params.kind - STAFF, EMAIL_IN or EMAIL_OUT
				 * @param {string} params.text - The note
				 * @param {{from?: string, to?: string, subject?: string, body?: string}} [params.email] - The email, on EMAIL_IN and EMAIL_OUT
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the staff view of the case
				 */
				addCaseNote: async ({ caseId, kind, text, email, options = {} }) => {
					this.client._require({ caseId, kind, text });
					const body = { kind, text, ...(email !== undefined && { email }) };
					return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/note`, { method: "POST", body, ...options });
				},

				/**
				 * Get a group's strikes in the last 90 days, the block periods behind them, and whether an open case carries the review flag.
				 * @async
				 * @roles signalhouse_admin, signalhouse_user
				 * @param {Object} params - The lookup
				 * @param {string} params.groupId - The group
				 * @param {RequestOptions} [params.options] - Additional options for the request
				 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ groupId, windowDays, strikes, reviewDue, periods }`
				 */
				getStrikes: async ({ groupId, options = {} }) => {
					this.client._require({ groupId });
					return this.client(`/compliance/strikes/${encodeURIComponent(groupId)}`, { method: "GET", ...options });
				},
			};
		}
	}

	/**
	 * List the compliance cases you can see, newest first. `counts.waitingOnYou` is the open cases with requirements still to answer
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} [params] - Filters
	 * @param {string} [params.groupId] - A group you can view; defaults to your active group
	 * @param {string} [params.status] - OPEN, LIFT_REQUESTED or CLOSED
	 * @param {string} [params.stage] - new, customer, ready, lift_requested or closed
	 * @param {string} [params.objectType] - CAMPAIGN, BRAND, NUMBER, RCS_AGENT or SUBGROUP
	 * @param {string} [params.objectId] - The object's id
	 * @param {string} [params.subgroupId] - Only cases in this subgroup
	 * @param {boolean} [params.suspended] - true for cases with an open suspension or hold, false for the rest
	 * @param {string} [params.from] - Opened on or after this ISO 8601 time
	 * @param {string} [params.to] - Opened on or before this ISO 8601 time
	 * @param {string} [params.sort] - createdAt (default), fixBy or severity
	 * @param {number} [params.page] - Page number, from 1
	 * @param {number} [params.limit] - Cases per page, 1-200
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ data, total, page, limit, totalPages, counts: { open, waitingOnYou } }`
	 */
	async getCases({ groupId, status, stage, objectType, objectId, subgroupId, suspended, from, to, sort, page, limit, options = {} } = {}) {
		const query = this.client._getQueryString({ groupId, status, stage, objectType, objectId, subgroupId, suspended, from, to, sort, page, limit });
		return this.client(`/compliance/cases${query}`, { method: "GET", ...options });
	}

	/**
	 * Get one compliance case: its stage, suspensions, tickets and requirements
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.caseId - The case (CASE-…)
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the case
	 */
	async getCase({ caseId, options = {} }) {
		this.client._require({ caseId });
		return this.client(`/compliance/cases/${encodeURIComponent(caseId)}`, { method: "GET", ...options });
	}

	/**
	 * Answer one requirement with a note, files, or both. A RECORDS requirement needs a file or a note
	 * @async
	 * @roles api, admin, developer, user
	 * @param {Object} params - The answer
	 * @param {string} params.caseId - The case (CASE-…)
	 * @param {string} params.requirementId - The requirement (CASE-…-n)
	 * @param {string} [params.answer] - What you did, up to 2,000 characters
	 * @param {string[]} [params.fileIds] - Up to 10 fileIds from uploadFile, on this case
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to the case
	 */
	async answerRequirement({ caseId, requirementId, answer, fileIds, options = {} }) {
		this.client._require({ caseId, requirementId });
		const body = { ...(answer !== undefined && { answer }), ...(fileIds !== undefined && { fileIds }) };
		return this.client(`/compliance/cases/${encodeURIComponent(caseId)}/requirements/${encodeURIComponent(requirementId)}`, { method: "PUT", body, ...options });
	}

	/**
	 * Upload a file to a compliance case (CSV, XLSX, PDF, PNG, JPG or TXT, up to 10 MB). Pass the returned fileId in
	 * fileIds when you answer the requirement
	 * @async
	 * @roles api, admin, developer, user
	 * @param {Object} params - The upload
	 * @param {string} params.caseId - The case the file answers
	 * @param {string} [params.requirementId] - The requirement the file answers
	 * @param {Blob|File} params.file - The file, as a Blob/File
	 * @param {string} [params.fileName] - Multipart filename; required for a CSV/TXT Blob without a name
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<any>>} A promise that resolves to `{ fileId, fileName, mimeType, size }`
	 */
	async uploadFile({ caseId, requirementId, file, fileName, options = {} }) {
		this.client._require({ caseId, file });
		const name = fileName ?? ("name" in file && typeof file.name === "string" ? file.name : undefined);
		if (!name && ["text/csv", "text/plain"].includes(file.type.split(";")[0])) {
			const error = new Error("CSV/TXT Blob uploads require fileName (for example records.csv), or a named File.");
			error.name = "SignalHouseValidationError";
			throw error;
		}
		const formData = new FormData();
		formData.append("caseId", caseId);
		if (requirementId) formData.append("requirementId", requirementId);
		if (name !== undefined) formData.append("file", file, name);
		else formData.append("file", file);
		return this.multipartClient(`/compliance/files`, { method: "POST", body: formData, ...options });
	}

	/**
	 * Download a compliance file
	 * @async
	 * @roles api, admin, developer, billing, user
	 * @param {Object} params - The lookup
	 * @param {string} params.fileId - The fileId uploadFile returned
	 * @param {RequestOptions} [params.options] - Additional options for the request
	 * @returns {Promise<SdkResponse<ArrayBuffer>>} A promise that resolves to the file bytes as an ArrayBuffer
	 */
	async getFile({ fileId, options = {} }) {
		this.client._require({ fileId });
		return this.client(`/compliance/files/${encodeURIComponent(fileId)}`, { method: "GET", responseType: "arraybuffer", ...options });
	}
}
