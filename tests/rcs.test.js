import { test } from "node:test";
import assert from "node:assert/strict";
import { Billing } from "../src/domains/Billing.js";
import { existsSync, readFileSync } from "node:fs";
import { Messages } from "../src/domains/Messages.js";
import { Rcs, RcsAgents, RcsMessages } from "../src/domains/Rcs.js";
import { Registrations } from "../src/domains/Registrations.js";
import { Webhooks } from "../src/domains/Webhooks.js";
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
	assert.ok(sdk.rcs.messages instanceof RcsMessages);
});

test("getTransactionHistory forwards the category and paging", async () => {
	const { client, calls } = captureClients();
	await new Billing(client).getTransactionHistory({ groupId: "G1", category: "RCS_INBOUND,RCS_CARRIER_PASSTHROUGH", page: 2, limit: 1000 });
	assert.equal(pathname(calls[0].path), "/billing/wallet/transactionHistory");
	assert.deepEqual(params(calls[0].path), { groupId: "G1", category: "RCS_INBOUND,RCS_CARRIER_PASSTHROUGH", page: "2", limit: "1000" });
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
	await agents.launch({ agentId: AGENT, acknowledgeFees: true });
	await agents.archive({ agentId: AGENT });
	assert.deepEqual(calls.map(({ path, request }) => [request.method, path]), [
		["GET", `/rcs/agent/${AGENT}`], ["PUT", `/rcs/agent/${AGENT}`], ["POST", `/rcs/agent/${AGENT}/validate`],
		["POST", `/rcs/agent/${AGENT}/submit`], ["POST", `/registration/${AGENT}/launch`], ["POST", `/rcs/agent/${AGENT}/archive`],
	]);
	assert.deepEqual(wire(calls[1].request.body), { campaignId: null, agent: { description: "Alerts" }, contact: { firstName: "Ada" } });
	assert.deepEqual(wire(calls[4].request.body), { acknowledgeFees: true });
	await agents.launch({ agentId: AGENT });
	assert.deepEqual(wire(calls[6].request.body), {});
	await assert.rejects(agents.submit({}), /agentId/);
	await assert.rejects(agents.launch({}), /agentId/);
});

test("requestCarrierUpdate posts to the agent's registration with no body, and update forwards the prefill markers", async () => {
	const { client, multipartClient, calls } = captureClients();
	const agents = new RcsAgents(client, multipartClient);
	await agents.requestCarrierUpdate({ agentId: AGENT });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", `/registration/${AGENT}/carrier-update`]);
	assert.equal(calls[0].request.body, undefined);
	const autofill = { "consent.optInDetails": { source: "campaign", sourceId: "CABC123", at: "2026-12-01T15:04:05.000Z", edited: true } };
	await agents.update({ agentId: AGENT, consent: { optInDetails: "Tick the box" }, autofill });
	assert.deepEqual(wire(calls[1].request.body), { consent: { optInDetails: "Tick the box" }, autofill });
	await assert.rejects(agents.requestCarrierUpdate({}), /agentId/);
});

test("removeTester deletes the tester and needs the number", async () => {
	const { client, multipartClient, calls } = captureClients();
	const agents = new RcsAgents(client, multipartClient);
	await agents.removeTester({ agentId: AGENT, phoneNumber: "+15125550199" });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["DELETE", `/rcs/agent/${AGENT}/testers/%2B15125550199`]);
	await assert.rejects(agents.removeTester({ agentId: AGENT }), /phoneNumber/);
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
	await registrations.launchRegistration({ registrationId: AGENT, acknowledgeFees: true, acknowledgePhi: true });
	await registrations.getRegistrations({ type: "RCS_AGENT", brandId: "BXYZ123", campaignId: "CABC123" });
	assert.deepEqual(calls.slice(0, 4).map(({ path, request }) => [request.method, path]), [
		["PUT", `/registration/${AGENT}`], ["POST", `/registration/${AGENT}/validate`], ["POST", `/registration/${AGENT}/submit`], ["POST", `/registration/${AGENT}/launch`],
	]);
	assert.deepEqual(wire(calls[0].request.body), { useCase: "OTP" });
	assert.deepEqual(wire(calls[3].request.body), { acknowledgeFees: true, acknowledgePhi: true });
	assert.deepEqual(params(calls[4].path), { type: "RCS_AGENT", brandId: "BXYZ123", campaignId: "CABC123" });
	await assert.rejects(registrations.launchRegistration({}), /registrationId/);
	await assert.rejects(registrations.updateRegistration({ registrationId: AGENT }), /data/);
});

test("send posts every field but options and needs agentId and recipients", async () => {
	const { client, calls } = captureClients();
	const messages = new RcsMessages(client);
	const recipients = [{ phoneNumber: "+15125550199", variables: { name: "Ada" }, clientMessageId: "c1", metadata: { order: "7" } }];
	const fallback = { mode: "auto", channel: "sms", from: "15125550100", content: { text: "Hi" }, validitySeconds: 600 };
	const fields = { agentId: AGENT, recipients, content: { blocks: [] }, contentFormat: "content.v1", trafficType: "TRANSACTION", ttlSeconds: 900, fallback, statusCallbackUrl: "https://example.com/cb", enableShortlink: false, isTest: true, simulate: "delivered" };
	await messages.send({ ...fields, options: { idempotencyKey: "k1" } });
	assert.deepEqual([calls[0].request.method, calls[0].path, calls[0].request.idempotencyKey], ["POST", "/message/rcs", "k1"]);
	assert.deepEqual(wire(calls[0].request.body), fields);
	await messages.send({ agentId: AGENT, recipients, templateId: "T1", templateVersion: 2, expireTime: "2026-11-05T00:00:00Z" });
	assert.deepEqual(wire(calls[1].request.body), { agentId: AGENT, recipients, templateId: "T1", templateVersion: 2, expireTime: "2026-11-05T00:00:00Z" });
	await assert.rejects(messages.send({ recipients }), /agentId/);
	await assert.rejects(messages.send({ agentId: AGENT }), /recipients/);
});

test("validate posts the send body to the validate route", async () => {
	const { client, calls } = captureClients();
	const messages = new RcsMessages(client);
	const recipients = [{ phoneNumber: "+15125550199" }];
	await messages.validate({ agentId: AGENT, recipients, templateId: "T1", simulate: "read" });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", "/message/rcs/validate"]);
	assert.deepEqual(wire(calls[0].request.body), { agentId: AGENT, recipients, templateId: "T1", simulate: "read" });
	await assert.rejects(messages.validate({ agentId: AGENT }), /recipients/);
});

test("estimate adds the rcs channel and needs only agentId", async () => {
	const { client, calls } = captureClients();
	const messages = new RcsMessages(client);
	await messages.estimate({ agentId: AGENT, recipientCount: 500, templateId: "T1", templateVersion: 2, trafficType: "PROMOTION", fallback: { mode: "rcs_only" } });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", "/message/estimate"]);
	assert.deepEqual(wire(calls[0].request.body), { channel: "rcs", agentId: AGENT, recipientCount: 500, templateId: "T1", templateVersion: 2, trafficType: "PROMOTION", fallback: { mode: "rcs_only" } });
	await assert.rejects(messages.estimate({ recipientCount: 500 }), /agentId/);
});

test("simulateInbound posts the event and needs the agent, the tester and the type", async () => {
	const { client, multipartClient, calls } = captureClients();
	const messages = new RcsMessages(client, multipartClient);
	await messages.simulateInbound({ agentId: AGENT, from: "+15125550199", type: "SUGGESTION", postbackData: "track_pkg" });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", "/message/rcs/simulate-inbound"]);
	assert.deepEqual(wire(calls[0].request.body), { agentId: AGENT, from: "+15125550199", type: "SUGGESTION", postbackData: "track_pkg" });
	await assert.rejects(messages.simulateInbound({ from: "+15125550199", type: "TEXT" }), /agentId/);
	await assert.rejects(messages.simulateInbound({ agentId: AGENT, type: "TEXT" }), /from/);
	await assert.rejects(messages.simulateInbound({ agentId: AGENT, from: "+15125550199" }), /type/);
});

test("capabilities posts the numbers and needs both fields", async () => {
	const { client, calls } = captureClients();
	const messages = new RcsMessages(client);
	await messages.capabilities({ agentId: AGENT, phoneNumbers: ["+15125550199"] });
	assert.deepEqual([calls[0].request.method, calls[0].path], ["POST", "/rcs/capabilities"]);
	assert.deepEqual(wire(calls[0].request.body), { agentId: AGENT, phoneNumbers: ["+15125550199"] });
	await assert.rejects(messages.capabilities({ agentId: AGENT }), /phoneNumbers/);
	await assert.rejects(messages.capabilities({ phoneNumbers: ["+15125550199"] }), /agentId/);
});

test("get and getMessage address the message", async () => {
	const { client, multipartClient, calls } = captureClients();
	await new RcsMessages(client).get({ messageId: "a/1" });
	await new Messages(client, multipartClient, false).getMessage({ id: "a/1" });
	assert.deepEqual(calls.map(({ path, request }) => [request.method, path]), [["GET", "/message/a%2F1"], ["GET", "/message/a%2F1"]]);
	await assert.rejects(new RcsMessages(client).get({}), /messageId/);
	await assert.rejects(new Messages(client, multipartClient, false).getMessage({}), /id/);
});

test("list maps agentId, from and to, adds messageType RCS, and needs the group and the date range", async () => {
	const { client, calls } = captureClients();
	const messages = new RcsMessages(client);
	await messages.list({ agentId: AGENT, from: "2026-11-01", to: "2026-11-02", groupId: "G1", status: "READ", page: 2, limit: 50, templateId: "T1", templateVersion: 3, bulkId: "B1", fallbackReason: "NOT_CAPABLE", billingClass: "RICH_MEDIA", deliveredChannel: "sms", isTest: false });
	assert.equal(calls[0].request.method, "GET");
	assert.equal(pathname(calls[0].path), "/message");
	assert.deepEqual(params(calls[0].path), { registrationId: AGENT, startDate: "2026-11-01", endDate: "2026-11-02", groupId: "G1", status: "READ", page: "2", limit: "50", templateId: "T1", templateVersion: "3", bulkId: "B1", fallbackReason: "NOT_CAPABLE", billingClass: "RICH_MEDIA", deliveredChannel: "sms", isTest: "false", messageType: "RCS", dateBounds: "exact" });
	await assert.rejects(messages.list({ agentId: AGENT }), /groupId/);
	await assert.rejects(messages.list({ groupId: "G1", from: "2026-11-01" }), /to/);
	assert.equal(calls.length, 1);
});

test("webhooks filter by agent and send the Agent endpoint's fields", async () => {
	const { client, calls } = captureClients();
	const webhooks = new Webhooks(client, false);
	await webhooks.getWebhooks({ groupId: "G1", endpointType: "Agent", agentId: AGENT });
	assert.deepEqual(params(calls[0].path), { groupId: "G1", endpointType: "Agent", agentId: AGENT });
	const webhookData = { groupId: "G1", name: "Support", endpointType: "Agent", agentId: AGENT, url: "https://a.example/rcs", secondaryUrl: "https://b.example/rcs" };
	await webhooks.createWebhook({ webhookData });
	assert.deepEqual(wire(calls[1].request.body), webhookData);
	await webhooks.updateWebhook({ id: "e1", updateData: { secondaryUrl: null } });
	assert.deepEqual(wire(calls[2].request.body), { secondaryUrl: null });
});

test("getMessageInteractions addresses the message and needs its id", async () => {
	const { client, multipartClient, calls } = captureClients();
	const messages = new Messages(client, multipartClient, false);
	await messages.getMessageInteractions({ id: "a/b" });
	assert.equal(calls[0].path, "/message/a%2Fb/interactions");
	assert.equal(calls[0].request.method, "GET");
	await assert.rejects(messages.getMessageInteractions({}), /id/);
	assert.equal(calls.length, 1);
});

test("getMessages forwards the RCS filters", async () => {
	const { client, multipartClient, calls } = captureClients();
	await new Messages(client, multipartClient, false).getMessages({ groupId: "G1", startDate: "2026-11-01", endDate: "2026-11-02", templateId: "T1", templateVersion: 3, bulkId: "B1", fallbackReason: "TTL_EXPIRED", billingClass: "RICH", deliveredChannel: "sms", isTest: false });
	assert.equal(pathname(calls[0].path), "/message");
	assert.deepEqual(params(calls[0].path), { groupId: "G1", startDate: "2026-11-01", endDate: "2026-11-02", templateId: "T1", templateVersion: "3", bulkId: "B1", fallbackReason: "TTL_EXPIRED", billingClass: "RICH", deliveredChannel: "sms", isTest: "false" });
});

const FIXTURES = new URL("../../fixtures/rcs/requests.json", import.meta.url);

test("every case in the shared corpus produces its request", { skip: existsSync(FIXTURES) ? false : "the corpus lives in the monorepo" }, async () => {
	for (const { name, operation, input, request } of JSON.parse(readFileSync(FIXTURES, "utf8")).cases) {
		const { client, multipartClient, calls } = captureClients();
		const [domain, method] = operation.split(".");
		await (domain === "agents" ? new RcsAgents(client, multipartClient) : new RcsMessages(client))[method](input);
		assert.equal(calls[0].request.method, request.method, name);
		assert.equal(pathname(calls[0].path), request.path, name);
		assert.deepEqual(params(calls[0].path), request.query ?? {}, name);
		assert.deepEqual(wire(calls[0].request.body ?? {}), request.body ?? {}, name);
	}
});
