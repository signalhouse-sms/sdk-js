import axios from "axios";

// Bounds every request made by this SDK. Chosen well above typical p99 latency so it only trips on
// a genuinely hung connection, not a slow-but-completing request.
const REQUEST_TIMEOUT_MS = 30000;

/**
 * @typedef {Object} RequestOptions
 * @property {string} [token] - An optional bearer token to include in the request for authentication
 * @property {object} [headers] - Additional headers to include in the request
 * @property {string} [idempotencyKey] - Sent as the Idempotency-Key header; a retry with the same key and request replays the first response instead of repeating it
 */

/**
 * @typedef {Object} SignalHouseSDKConfig
 * @property {string} apiKey - The API key for authenticating requests to the SignalHouse API
 * @property {string} baseUrl - The base URL for the SignalHouse API (e.g., "https://v2.signalhouse.io")
 * @property {boolean} [enableAdmin=false] - Enable admin-scoped behaviors on domains that support them
 */

/**
 * The envelope every domain method resolves to. Non-2xx responses never reject; check `success` first.
 * @template T
 * @typedef {{ success: true, data: T, status: number } | { success: false, error: string|Object, status: number|null }} SdkResponse
 */

// Main SDK Class (SignalHouseSDK.js)
import { Auth } from "./domains/Auth.js";
import { Billing } from "./domains/Billing.js";
import { Brands } from "./domains/Brands.js";
import { Campaigns } from "./domains/Campaigns.js";
import { Groups } from "./domains/Groups.js";
import { Landings } from "./domains/Landings.js";
import { Messages } from "./domains/Messages.js";
import { Templates } from "./domains/Templates.js";
import { Numbers } from "./domains/Numbers.js";
import { Registrations } from "./domains/Registrations.js";
import { Onboarding } from "./domains/Onboarding.js";
import { Dnc } from "./domains/Dnc.js";
import { Shortlinks } from "./domains/Shortlinks.js";
import { Subgroups } from "./domains/Subgroups.js";
import { Subscriptions } from "./domains/Subscriptions.js";
import { Tickets } from "./domains/Tickets.js";
import { Users } from "./domains/Users.js";
import { Notifications } from "./domains/Notifications.js";
import { Webhooks } from "./domains/Webhooks.js";
import { Voice } from "./domains/Voice.js";
import { Agents } from "./domains/Agents.js";

export class SignalHouseSDK {
	/**
	 * Initialize the SignalHouseSDK with the required configuration
	 * @param {SignalHouseSDKConfig} config - The configuration object for initializing the SDK
	 * @throws {Error} Throws an error if the API key or base URL is missing from the configuration
	 */
	constructor(config) {
		// Validate required config parameters
		if (!config?.apiKey) {
			throw new Error("API key is required to initialize SignalHouseSDK");
		}
		if (!config?.baseUrl) {
			throw new Error("Base URL is required to initialize SignalHouseSDK");
		}

		// Set instance properties
		this.baseUrl = config.baseUrl;
		this.apiKey = config.apiKey;
		this.enableAdmin = config.enableAdmin || false;

		// Shared internal request helper
		const client = this._createClient(false);
		const multipartClient = this._createClient(true);

		// API Domains
		this.auth = new Auth(client, this.enableAdmin);
		this.billing = new Billing(client, this.enableAdmin);
		this.brands = new Brands(client, multipartClient, this.enableAdmin);
		this.campaigns = new Campaigns(client, multipartClient, this.enableAdmin);
		this.groups = new Groups(client, this.enableAdmin);
		this.landings = new Landings(client, multipartClient, this.enableAdmin);
		this.messages = new Messages(client, multipartClient, this.enableAdmin);
		this.templates = new Templates(client, multipartClient, this.enableAdmin);
		this.numbers = new Numbers(client, multipartClient, this.enableAdmin);
		this.registrations = new Registrations(client, this.enableAdmin);
		this.onboarding = new Onboarding(client, this.enableAdmin);
		this.dnc = new Dnc(client, this.enableAdmin);
		this.shortlinks = new Shortlinks(client, this.enableAdmin);
		this.subgroups = new Subgroups(client, this.enableAdmin);
		this.subscriptions = new Subscriptions(client, this.enableAdmin);
		this.tickets = new Tickets(client, this.enableAdmin);
		this.users = new Users(client, this.enableAdmin);
		this.notifications = new Notifications(client, this.enableAdmin);
		this.webhooks = new Webhooks(client, this.enableAdmin);
		// Voice domain targets the Voice service under /voice. Available
		// like any other domain; gating (if any) will be decided later.
		this.voice = new Voice(client, this.enableAdmin);
		// AI Agents domain — customer-facing agent config under /agent.
		this.agents = new Agents(client, this.enableAdmin);
	}

	/**
	 * Client for API requests
	 * @private
	 * @param {boolean} isMultipart - Whether to set the Content-Type header for multipart requests
	 * @throws {Error} Throws an error if the API key or base URL is missing
	 * @returns {Function} A function to make API requests
	 */
	_createClient(isMultipart = false) {
		// Create an Axios instance with the base URL and default headers. `timeout` bounds every
		// request so a hung connection (server-side lock contention, a stalled upstream call) rejects
		// instead of leaving the caller's promise unsettled forever with no error and no feedback.
		const instance = axios.create({ baseURL: this.baseUrl, timeout: REQUEST_TIMEOUT_MS, headers: isMultipart ? {} : { "Content-Type": "application/json" } });

		// Add a request interceptor to include the API key in the Authorization header
		instance.interceptors.request.use((/** @type {import('axios').InternalAxiosRequestConfig & { token?: string, idempotencyKey?: string }} */ config) => {
			const token = config.token || this.apiKey;
			config.headers.Authorization = `Bearer ${token}`;
			if (config.idempotencyKey) config.headers["Idempotency-Key"] = config.idempotencyKey;
			delete config.token; // Remove token from config to avoid sending it as a header
			delete config.idempotencyKey;
			return config;
		});

		// Standardize responses. The fulfilled handler deliberately replaces the AxiosResponse with the
		// SdkResponse envelope, which axios's interceptor typing does not model; the cast keeps that intent visible.
		instance.interceptors.response.use(
			// Standard 2xx responses
			/** @type {(response: import('axios').AxiosResponse) => any} */
			((response) => {
				return { success: true, data: response.data, status: response.status };
			}),

			// Non-2xx responses, plus timeouts and network failures (no `error.response` at all) - those
			// get a clear message here rather than surfacing axios's internal error.message verbatim.
			(error) => {
				if (!error.response) {
					const isTimeout = error.code === "ECONNABORTED" || /timeout/i.test(error.message || "");
					return {
						success: false,
						error: isTimeout ? "Request timed out. Please try again." : "Network error. Please check your connection and try again.",
						status: null,
					};
				}
				return {
					success: false,
					error: error.response?.data?.message || error.response?.data || error.message || 500,
					status: error.response?.status || error.response?.data || null,
				};
			},
		);

		const client = async (url, options = {}) => {
			// Extract the body from options and keep the rest as axios config
			const { body, ...axiosConfig } = options;
			return instance({ url, data: body, ...axiosConfig });
		};

		// Attach helpers to the client
		client._getQueryString = this._getQueryString.bind(this);
		client._require = this._require.bind(this);
		client._baseUrl = this.baseUrl;

		return client;
	}

	/**
	 * Helper method to convert an object to a query string, excluding undefined values and the 'options' key
	 * @private
	 * @param {Object} obj - The object to convert to a query string
	 * @returns {string} The query string
	 */
	_getQueryString(obj) {
		const params = new URLSearchParams();
		Object.entries(obj).forEach(([key, value]) => {
			if (value !== undefined && key !== "options") {
				if (Array.isArray(value)) {
					value.forEach((v) => params.append(key, v));
				} else {
					params.append(key, value);
				}
			}
		});
		return params.toString() ? `?${params.toString()}` : "";
	}

	/**
	 * Helper method to validate required fields necessary for a request parameter
	 * @private
	 * @param {Object} fields - An object where keys are field names and values are the corresponding values to check
	 * @throws {Error} Throws an error if any required field is missing or empty
	 */
	_require(fields) {
		for (const [name, value] of Object.entries(fields)) {
			if (value === undefined || value === null || value === "") {
				const error = /** @type {Error & { status?: number }} */ (new Error(`Missing required parameter: ${name}`));
				error.name = "SignalHouseValidationError";
				error.status = 400; // Match API validation code
				throw error;
			}
		}
	}
}
