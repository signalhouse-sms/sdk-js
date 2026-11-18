import { test } from "node:test";
import assert from "node:assert/strict";
import { CallFlows } from "../src/domains/voice/CallFlows.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

const ID = "0088947b-7821-4853-bfe6-744fce926de2";

/** Build a request-capturing client that reuses the real SDK helpers. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	return { client, calls };
}

test("is reachable as sdk.voice.callFlows", () => {
	const sdk = new SignalHouseSDK({ apiKey: "x", baseUrl: "https://example.invalid" });
	assert.equal(typeof sdk.voice.callFlows.publish, "function");
});

test("list sends only the filters that are set", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	await flows.list();
	await flows.list({ filters: { page: 2, limit: 10, q: "", subgroupId: "S0000001", includeDeleted: true, sortBy: undefined } });
	assert.equal(calls[0].path, "/voice/api/v1/call-flows");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[1].path, "/voice/api/v1/call-flows?page=2&limit=10&subgroupId=S0000001&includeDeleted=true");
});

test("catalog and get read the flow", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	await flows.catalog();
	await flows.get({ id: ID, options: { token: "session" } });
	assert.equal(calls[0].path, "/voice/api/v1/call-flows/catalog");
	assert.equal(calls[1].path, `/voice/api/v1/call-flows/${ID}`);
	assert.equal(calls[1].request.method, "GET");
	assert.equal(calls[1].request.token, "session");
	await assert.rejects(flows.get({}), /id/);
});

test("create posts the flow, and update patches it", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	await flows.create({ flowData: { name: "Main line", subgroupId: "S0000001" } });
	await flows.update({ id: ID, updateData: { status: "DISABLED" } });
	assert.equal(calls[0].path, "/voice/api/v1/call-flows");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { name: "Main line", subgroupId: "S0000001" });
	assert.equal(calls[1].path, `/voice/api/v1/call-flows/${ID}`);
	assert.equal(calls[1].request.method, "PATCH");
	assert.deepEqual(calls[1].request.body, { status: "DISABLED" });
	await assert.rejects(flows.create({}), /flowData/);
	await assert.rejects(flows.update({ id: ID }), /updateData/);
});

test("saveDraft replaces the whole draft with PUT", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	const draft = { nodes: [{ id: ID, type: "inbound", name: "Inbound Call" }], edges: [] };
	await flows.saveDraft({ id: ID, draft });
	assert.equal(calls[0].path, `/voice/api/v1/call-flows/${ID}/draft`);
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, draft);
	await assert.rejects(flows.saveDraft({ id: ID }), /draft/);
});

test("publish and restore send an empty JSON body, which the service requires", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	await flows.publish({ id: ID });
	await flows.restore({ id: ID });
	assert.equal(calls[0].path, `/voice/api/v1/call-flows/${ID}/publish`);
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, {});
	assert.equal(calls[1].path, `/voice/api/v1/call-flows/${ID}/restore`);
	assert.deepEqual(calls[1].request.body, {});
});

test("duplicate names the copy only when asked, and delete removes", async () => {
	const { client, calls } = captureClient();
	const flows = new CallFlows(client, false);
	await flows.duplicate({ id: ID });
	await flows.duplicate({ id: ID, name: "Main line (weekend)" });
	await flows.delete({ id: ID });
	assert.deepEqual(calls[0].request.body, {});
	assert.deepEqual(calls[1].request.body, { name: "Main line (weekend)" });
	assert.equal(calls[2].path, `/voice/api/v1/call-flows/${ID}`);
	assert.equal(calls[2].request.method, "DELETE");
});

test("ids are URL-encoded", async () => {
	const { client, calls } = captureClient();
	await new CallFlows(client, false).get({ id: "a/b" });
	assert.equal(calls[0].path, "/voice/api/v1/call-flows/a%2Fb");
});
