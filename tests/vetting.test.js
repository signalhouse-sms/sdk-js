import { test } from "node:test";
import assert from "node:assert/strict";
import { Vetting } from "../src/domains/Vetting.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a capture client that reuses the real SDK validation and query serializer. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	return { client, calls };
}

test("the vetting engine needs enableAdmin", () => {
	assert.equal(new Vetting(captureClient().client).admin, undefined);
	assert.equal(new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" }).vetting.admin, undefined);
	assert.ok(new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid", enableAdmin: true }).vetting.admin.startVettingCase);
});

test("startVettingCase posts the subject, and the tenant only when given", async () => {
	const { client, calls } = captureClient();
	const admin = new Vetting(client, true).admin;
	await admin.startVettingCase({ subject: { legalName: "Acme" } });
	await admin.startVettingCase({ subject: { legalName: "Acme" }, tenantId: "signalhouse" });
	assert.deepEqual(calls.map((c) => [c.request.method, c.path, c.request.body]), [
		["POST", "/vetting/cases", { subject: { legalName: "Acme" } }],
		["POST", "/vetting/cases", { subject: { legalName: "Acme" }, tenantId: "signalhouse" }],
	]);
	await assert.rejects(() => admin.startVettingCase({}));
});

test("the reads reach their routes with their filters", async () => {
	const { client, calls } = captureClient();
	const admin = new Vetting(client, true).admin;
	await admin.getVettingCases({ status: "EXCEPTION", page: 2, limit: 10 });
	await admin.getVettingCase({ caseId: "VBR0123456789" });
	await admin.getVettingEvidence({ caseId: "VBR0123456789", tenantId: "signalhouse" });
	await admin.getVettingExceptions({ kind: "QA_SAMPLE", status: "OPEN" });
	await admin.getVettingReport({ from: "2026-11-01", to: "2026-11-30" });
	const urls = calls.map((c) => { assert.equal(c.request.method, "GET"); return new URL(c.path, "https://example.com"); });
	assert.deepEqual(urls.map((u) => u.pathname), ["/vetting/cases", "/vetting/cases/VBR0123456789", "/vetting/cases/VBR0123456789/evidence", "/vetting/exceptions", "/vetting/report"]);
	assert.equal(urls[0].searchParams.get("status"), "EXCEPTION");
	assert.equal(urls[0].searchParams.get("page"), "2");
	assert.equal(urls[2].searchParams.get("tenantId"), "signalhouse");
	assert.equal(urls[3].searchParams.get("kind"), "QA_SAMPLE");
	assert.equal(urls[4].searchParams.get("from"), "2026-11-01");
	await assert.rejects(() => admin.getVettingCase({}));
});

test("claim and resolve post to the item's routes", async () => {
	const { client, calls } = captureClient();
	const admin = new Vetting(client, true).admin;
	await admin.claimVettingException({ exceptionId: "VEX0123456789" });
	await admin.resolveVettingException({ exceptionId: "VEX0123456789", outcome: "VERIFY", note: "Confirmed by phone." });
	assert.deepEqual(calls.map((c) => [c.request.method, c.path, c.request.body]), [
		["POST", "/vetting/exceptions/VEX0123456789/claim", {}],
		["POST", "/vetting/exceptions/VEX0123456789/resolve", { outcome: "VERIFY", note: "Confirmed by phone." }],
	]);
	await assert.rejects(() => admin.resolveVettingException({ exceptionId: "VEX0123456789", outcome: "VERIFY" }));
});
