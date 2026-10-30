/** @typedef {import('../../SignalHouseSDK.js').RequestOptions} RequestOptions */
/**
 * @template T
 * @typedef {import('../../SignalHouseSDK.js').SdkResponse<T>} SdkResponse
 */

/**
 * @typedef {"GROUP"|"SUBGROUP"|"NUMBER"|"TRUNK"|"SIP_PROFILE"|"WEBRTC_IDENTITY"} OutboundScopeType
 */

const BASE_PATH = "/voice/api/v1/outbound-voice";

/**
 * Outbound voice policy: Signal House staff switches that turn outbound calling off for a group,
 * subgroup, number, SIP trunk, SIP endpoint or softphone user, plus a group's AI-outbound
 * authorization. Staff only; every method lives under the hidden `admin` namespace.
 * Accessed via `sdk.voice.outboundVoice.admin`.
 */
export class OutboundVoice {
	constructor(client, enableAdmin) {
		this.client = client;
		this.enableAdmin = enableAdmin;

		// Hidden Admin namespace INSIDE the domain
		if (enableAdmin) {
			this.admin = {
				/**
				 * Get the switches that are off in a group, and its AI-outbound authorization.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api, signalhouse_user
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The group to read.
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ groupId, outboundAiAuthorized, aiAuthorization, blocks: [...] }`.
				 */
				getGroupPolicy: async ({ groupId, options = {} }) => {
					this.client._require({ groupId });
					return this.client(`${BASE_PATH}/groups/${encodeURIComponent(groupId)}`, { method: "GET", ...options });
				},

				/**
				 * List a group's outbound policy changes, newest first.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api, signalhouse_user
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The group to read.
				 * @param {number} [params.limit] - Most rows to return (1-200, default 50).
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ groupId, events: [...] }`.
				 */
				listHistory: async ({ groupId, limit, options = {} }) => {
					this.client._require({ groupId });
					const queryString = this.client._getQueryString({ limit });
					return this.client(`${BASE_PATH}/groups/${encodeURIComponent(groupId)}/history${queryString}`, { method: "GET", ...options });
				},

				/**
				 * Check whether a call with this context may go out, and which switch blocks it if not.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api, signalhouse_user
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The calling group.
				 * @param {string} [params.subgroupId] - The calling subgroup, when known.
				 * @param {string} [params.e164] - The caller ID, in E.164.
				 * @param {string} [params.sipTrunkId] - The SIP trunk the call comes from.
				 * @param {string} [params.sipProfileId] - The SIP endpoint the call comes from.
				 * @param {string} [params.webrtcIdentity] - The softphone user's requested identity.
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ allowed, blockedBy }`.
				 */
				resolve: async ({ groupId, subgroupId, e164, sipTrunkId, sipProfileId, webrtcIdentity, options = {} }) => {
					this.client._require({ groupId });
					return this.client(`${BASE_PATH}/resolve`, {
						method: "POST",
						body: { groupId, subgroupId, e164, sipTrunkId, sipProfileId, webrtcIdentity },
						...options,
					});
				},

				/**
				 * Turn outbound calling off for one scope. A scope that is already off keeps its original switch.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The group that owns the scope.
				 * @param {OutboundScopeType} params.scopeType - What kind of thing is being turned off.
				 * @param {string} params.scopeId - The group, subgroup, number, trunk, endpoint or softphone identity.
				 * @param {string} params.reason - Why (3-500 characters).
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId, scopeType, scopeId or reason is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ created, block }`.
				 */
				block: async ({ groupId, scopeType, scopeId, reason, options = {} }) => {
					this.client._require({ groupId, scopeType, scopeId, reason });
					return this.client(`${BASE_PATH}/groups/${encodeURIComponent(groupId)}/blocks/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}`, {
						method: "PUT",
						body: { reason },
						...options,
					});
				},

				/**
				 * Turn outbound calling back on for one scope.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The group that owns the scope.
				 * @param {OutboundScopeType} params.scopeType - What kind of thing is being turned on.
				 * @param {string} params.scopeId - The switch's scope id.
				 * @param {string} [params.reason] - Optional note for the history.
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId, scopeType or scopeId is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ removed, block }`.
				 */
				unblock: async ({ groupId, scopeType, scopeId, reason, options = {} }) => {
					this.client._require({ groupId, scopeType, scopeId });
					return this.client(`${BASE_PATH}/groups/${encodeURIComponent(groupId)}/blocks/${encodeURIComponent(scopeType)}/${encodeURIComponent(scopeId)}`, {
						method: "DELETE",
						...(reason ? { body: { reason } } : {}),
						...options,
					});
				},

				/**
				 * Set or clear a group's authorization to place outbound AI-agent calls.
				 * @async
				 * @roles signalhouse_admin, signalhouse_api
				 * @param {Object} params - Request parameters.
				 * @param {string} params.groupId - The group to change.
				 * @param {boolean} params.authorized - The new value.
				 * @param {string} params.reason - Why (3-500 characters).
				 * @param {RequestOptions} [params.options] - Additional options for the request.
				 * @throws {Error} If groupId, authorized or reason is missing.
				 * @returns {Promise<SdkResponse<any>>} `{ groupId, outboundAiAuthorized, changed }`.
				 */
				setAiAuthorization: async ({ groupId, authorized, reason, options = {} }) => {
					this.client._require({ groupId, authorized, reason });
					return this.client(`${BASE_PATH}/groups/${encodeURIComponent(groupId)}/ai-authorization`, {
						method: "PUT",
						body: { authorized, reason },
						...options,
					});
				},
			};
		}
	}
}
