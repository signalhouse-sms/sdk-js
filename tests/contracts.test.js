import { test } from "node:test";
import assert from "node:assert/strict";
import { Contracts } from "../src/domains/Contracts.js";
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

test("the contract queue needs enableAdmin", () => {
	assert.equal(new Contracts(captureClient().client).admin, undefined);
	assert.ok(new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid", enableAdmin: true }).contracts.admin.getContracts);
});

test("getContracts joins a status list and reaches GET /contract", async () => {
	const { client, calls } = captureClient();
	await new Contracts(client, true).admin.getContracts({ status: ["UNMATCHED", "PENDING_REVIEW"], groupId: "G0000001", page: 2, limit: 10 });
	assert.equal(calls[0].request.method, "GET");
	const url = new URL(calls[0].path, "https://example.com");
	assert.equal(url.pathname, "/contract");
	assert.equal(url.searchParams.get("status"), "UNMATCHED,PENDING_REVIEW");
	assert.equal(url.searchParams.get("groupId"), "G0000001");
	assert.equal(url.searchParams.get("page"), "2");
});

test("each contract action reaches its route with its body", async () => {
	const { client, calls } = captureClient();
	const admin = new Contracts(client, true).admin;
	await admin.getContract({ contractId: "c1" });
	await admin.linkContractGroup({ contractId: "c1", groupId: "G0000001" });
	await admin.applyContract({ contractId: "c1", expectedUpdatedAt: "2026-11-14T00:00:00.000Z", expectedGroupId: "G0000001" });
	await admin.rejectContract({ contractId: "c1", reason: "Wrong customer" });
	await admin.reparseContract({ contractId: "c1" });
	assert.deepEqual(calls.map((c) => [c.request.method, c.path, c.request.body]), [
		["GET", "/contract/c1", undefined],
		["POST", "/contract/c1/link", { groupId: "G0000001" }],
		["POST", "/contract/c1/apply", { expectedUpdatedAt: "2026-11-14T00:00:00.000Z", expectedGroupId: "G0000001" }],
		["POST", "/contract/c1/reject", { reason: "Wrong customer" }],
		["POST", "/contract/c1/reparse", {}],
	]);
});

test("contract actions require their parameters", async () => {
	const admin = new Contracts(captureClient().client, true).admin;
	await assert.rejects(() => admin.getContract({}));
	await assert.rejects(() => admin.linkContractGroup({ contractId: "c1" }));
	await assert.rejects(() => admin.rejectContract({ contractId: "c1" }));
	await assert.rejects(() => admin.applyContract({ contractId: "c1" }));
});
