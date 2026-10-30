import { test } from "node:test";
import assert from "node:assert/strict";
import { OutboundVoice } from "../src/domains/voice/OutboundVoice.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a request-capturing client that reuses the real SDK helpers. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	return { client, calls };
}

test("admin namespace exists only on admin-enabled clients", () => {
	const { client } = captureClient();
	assert.equal(new OutboundVoice(client, false).admin, undefined);
	assert.equal(typeof new OutboundVoice(client, true).admin.block, "function");
	assert.ok(new SignalHouseSDK({ apiKey: "x", baseUrl: "https://example.invalid", enableAdmin: true }).voice.outboundVoice.admin);
});

test("getGroupPolicy and listHistory read the group's policy", async () => {
	const { client, calls } = captureClient();
	const { admin } = new OutboundVoice(client, true);
	await admin.getGroupPolicy({ groupId: "G0001234", options: { token: "session" } });
	await admin.listHistory({ groupId: "G0001234", limit: 5 });
	await admin.listHistory({ groupId: "G0001234" });
	assert.equal(calls[0].path, "/voice/api/v1/outbound-voice/groups/G0001234");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.token, "session");
	assert.equal(calls[1].path, "/voice/api/v1/outbound-voice/groups/G0001234/history?limit=5");
	assert.equal(calls[2].path, "/voice/api/v1/outbound-voice/groups/G0001234/history");
	await assert.rejects(admin.getGroupPolicy({}), /groupId/);
	await assert.rejects(admin.listHistory({}), /groupId/);
});

test("resolve posts the call context", async () => {
	const { client, calls } = captureClient();
	const { admin } = new OutboundVoice(client, true);
	await admin.resolve({ groupId: "G0001234", e164: "+15550102233", subgroupId: "S0000003" });
	assert.equal(calls[0].path, "/voice/api/v1/outbound-voice/resolve");
	assert.equal(calls[0].request.method, "POST");
	assert.equal(calls[0].request.body.groupId, "G0001234");
	assert.equal(calls[0].request.body.e164, "+15550102233");
	assert.equal(calls[0].request.body.subgroupId, "S0000003");
	await assert.rejects(admin.resolve({}), /groupId/);
});

test("block puts the switch with its reason, encoding the scope id", async () => {
	const { client, calls } = captureClient();
	const { admin } = new OutboundVoice(client, true);
	await admin.block({ groupId: "G0001234", scopeType: "NUMBER", scopeId: "+15550102233", reason: "Robocall report" });
	assert.equal(calls[0].path, "/voice/api/v1/outbound-voice/groups/G0001234/blocks/NUMBER/%2B15550102233");
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, { reason: "Robocall report" });
	await assert.rejects(admin.block({ groupId: "G0001234", scopeType: "NUMBER", scopeId: "+15550102233" }), /reason/);
});

test("unblock sends a body only with a note", async () => {
	const { client, calls } = captureClient();
	const { admin } = new OutboundVoice(client, true);
	await admin.unblock({ groupId: "G0001234", scopeType: "TRUNK", scopeId: "trk-1" });
	await admin.unblock({ groupId: "G0001234", scopeType: "TRUNK", scopeId: "trk-1", reason: "Reviewed" });
	assert.equal(calls[0].path, "/voice/api/v1/outbound-voice/groups/G0001234/blocks/TRUNK/trk-1");
	assert.equal(calls[0].request.method, "DELETE");
	assert.equal(calls[0].request.body, undefined);
	assert.deepEqual(calls[1].request.body, { reason: "Reviewed" });
	await assert.rejects(admin.unblock({ groupId: "G0001234", scopeType: "TRUNK" }), /scopeId/);
});

test("setAiAuthorization accepts false as a value", async () => {
	const { client, calls } = captureClient();
	const { admin } = new OutboundVoice(client, true);
	await admin.setAiAuthorization({ groupId: "G0001234", authorized: false, reason: "KYC lapsed" });
	assert.equal(calls[0].path, "/voice/api/v1/outbound-voice/groups/G0001234/ai-authorization");
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, { authorized: false, reason: "KYC lapsed" });
	await assert.rejects(admin.setAiAuthorization({ groupId: "G0001234", reason: "x" }), /authorized/);
});
