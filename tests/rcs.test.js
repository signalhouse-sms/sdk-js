import { test } from "node:test";
import assert from "node:assert/strict";
import { Rcs, RcsAgents } from "../src/domains/Rcs.js";
import { Registrations } from "../src/domains/Registrations.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build JSON and multipart capture clients that reuse the real SDK validation and query serializer. */
function captureClients() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const make = (kind) => {
		const fn = async (path, request) => { calls.push({ kind, path, request }); return { success: true, data: {} }; };
		fn._require = sdk._require.bind(sdk);
		fn._getQueryString = sdk._getQueryString.bind(sdk);
		return fn;
	};
	return { client: make("json"), multipartClient: make("multipart"), calls };
}

const params = (path) => Object.fromEntries(new URL(path, "https://example.com").searchParams);
const pathname = (path) => new URL(path, "https://example.com").pathname;
const wire = (body) => JSON.parse(JSON.stringify(body));
const AGENT = "RCSA7K2M1QZ8RP";

test("the SDK exposes rcs.agents with the multipart client wired in", () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	assert.ok(sdk.rcs instanceof Rcs);
	assert.ok(sdk.rcs.agents instanceof RcsAgents);
	assert.equal(typeof sdk.rcs.agents.multipartClient, "function");
});

test("create posts the agent body with the brand link and requires brandId", async () => {
	const { client, multipartClient, calls } = captureClients();
	const agents = new RcsAgents(client, multipartClient);
	await agents.create({ brandId: "BXYZ123", campaignId: "CABC123", agent: { name: "Acme" }, useCase: "TRANSACTIONAL", options: { idempotencyKey: "k1" } });
	assert.equal(calls[0].path, "/rcs/agent");
	assert.equal(calls[0].request.method, "POST");
	assert.equal(calls[0].request.idempotencyKey, "k1");
	assert.deepEqual(wire(calls[0].request.body), { brandId: "BXYZ123", campaignId: "CABC123", agent: { name: "Acme" }, useCase: "TRANSACTIONAL" });
	await assert.rejects(agents.create({ agent: { name: "Acme" } }), /brandId/);
});

test("list forwards the link and status filters", async () => {
	const { client, multipartClient, calls } = captureClients();
	await new RcsAgents(client, multipartClient).list({ brandId: "BXYZ123", campaignId: "CABC123", status: "DRAFT", page: 2, limit: 50 });
	assert.equal(pathname(calls[0].path), "/rcs/agent");
	assert.deepEqual(params(calls[0].path), { brandId: "BXYZ123", campaignId: "CABC123", status: "DRAFT", page: "2", limit: "50" });
});

test("get, update, validate, submit and archive address the agent", async () => {
	const { client, multipartClient, calls } = captureClients();
	const agents = new RcsAgents(client, multipartClient);
	await agents.get({ agentId: AGENT });
	await agents.update({ agentId: AGENT, campaignId: null, agent: { description: "Alerts" }, contact: { firstName: "Ada" } });
	await agents.validate({ agentId: AGENT });
	await agents.submit({ agentId: AGENT });
	await agents.launch({ agentId: AGENT });
	await agents.archive({ agentId: AGENT });
	assert.deepEqual(calls.map(({ path, request }) => [request.method, path]), [
		["GET", `/rcs/agent/${AGENT}`], ["PUT", `/rcs/agent/${AGENT}`], ["POST", `/rcs/agent/${AGENT}/validate`],
		["POST", `/rcs/agent/${AGENT}/submit`], ["POST", `/registration/${AGENT}/launch`], ["POST", `/rcs/agent/${AGENT}/archive`],
	]);
	assert.deepEqual(wire(calls[1].request.body), { campaignId: null, agent: { description: "Alerts" }, contact: { firstName: "Ada" } });
	await assert.rejects(agents.submit({}), /agentId/);
	await assert.rejects(agents.launch({}), /agentId/);
});

test("resendTesterInvite addresses the tester and needs the number", async () => {
	const { client, multipartClient, calls } = captureClients();
	const agents = new RcsAgents(client, multipartClient);
	await agents.resendTesterInvite({ agentId: AGENT, phoneNumber: "+15125550199" });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", `/rcs/agent/${AGENT}/testers/%2B15125550199/resend`]);
	await assert.rejects(agents.resendTesterInvite({ agentId: AGENT }), /phoneNumber/);
});

test("uploadAsset posts kind and file through the multipart client", async () => {
	const { client, multipartClient, calls } = captureClients();
	await new RcsAgents(client, multipartClient).uploadAsset({ agentId: AGENT, kind: "logo", file: new Blob(["png"]), fileName: "logo.png" });
	assert.equal(calls[0].kind, "multipart");
	assert.equal(calls[0].path, `/rcs/agent/${AGENT}/asset`);
	assert.equal(calls[0].request.body.get("kind"), "logo");
	assert.ok(calls[0].request.body.get("file"));
});

test("registrations gain draft update, validate and submit, and the RCS link filters", async () => {
	const { client, calls } = captureClients();
	const registrations = new Registrations(client);
	await registrations.updateRegistration({ registrationId: AGENT, data: { useCase: "OTP" } });
	await registrations.validateRegistration({ registrationId: AGENT });
	await registrations.submitRegistration({ registrationId: AGENT });
	await registrations.launchRegistration({ registrationId: AGENT });
	await registrations.getRegistrations({ type: "RCS_AGENT", brandId: "BXYZ123", campaignId: "CABC123" });
	assert.deepEqual(calls.slice(0, 4).map(({ path, request }) => [request.method, path]), [
		["PUT", `/registration/${AGENT}`], ["POST", `/registration/${AGENT}/validate`], ["POST", `/registration/${AGENT}/submit`], ["POST", `/registration/${AGENT}/launch`],
	]);
	assert.deepEqual(wire(calls[0].request.body), { useCase: "OTP" });
	assert.deepEqual(params(calls[4].path), { type: "RCS_AGENT", brandId: "BXYZ123", campaignId: "CABC123" });
	await assert.rejects(registrations.launchRegistration({}), /registrationId/);
	await assert.rejects(registrations.updateRegistration({ registrationId: AGENT }), /data/);
});
