import { test } from "node:test";
import assert from "node:assert/strict";
import { Compliance } from "../src/domains/Compliance.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build request-capturing JSON and multipart clients that reuse the real SDK validation. */
function captureClients() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const make = (kind) => {
		const client = async (path, request) => { calls.push({ kind, path, request }); return { success: true, data: {} }; };
		client._require = sdk._require.bind(sdk);
		client._getQueryString = sdk._getQueryString.bind(sdk);
		return client;
	};
	return { client: make("json"), multipartClient: make("multipart"), calls };
}

test("the SDK exposes compliance, with admin only when enabled", () => {
	assert.ok(new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" }).compliance instanceof Compliance);
	assert.equal(new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" }).compliance.admin, undefined);
	assert.equal(typeof new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid", enableAdmin: true }).compliance.admin.logAlert, "function");
});

test("getCases sends only the filters that were given", async () => {
	const { client, multipartClient, calls } = captureClients();
	const compliance = new Compliance(client, multipartClient);
	await compliance.getCases({ stage: "customer", suspended: true, page: 2 });
	assert.equal(calls[0].path, "/compliance/cases?stage=customer&suspended=true&page=2");
	assert.equal(calls[0].request.method, "GET");
	await compliance.getCases();
	assert.equal(calls[1].path, "/compliance/cases");
});

test("getCase and getFile read by their encoded ids", async () => {
	const { client, multipartClient, calls } = captureClients();
	const compliance = new Compliance(client, multipartClient);
	await compliance.getCase({ caseId: "CASE-150" });
	assert.equal(calls[0].path, "/compliance/cases/CASE-150");
	await compliance.getFile({ fileId: "cf_9c1e77d0a4b24f6e" });
	assert.equal(calls[1].path, "/compliance/files/cf_9c1e77d0a4b24f6e");
	assert.equal(calls[1].request.responseType, "arraybuffer");
	await assert.rejects(compliance.getCase({}), /caseId/);
	await assert.rejects(compliance.getFile({}), /fileId/);
});

test("answerRequirement puts the answer and file ids that were given", async () => {
	const { client, multipartClient, calls } = captureClients();
	const compliance = new Compliance(client, multipartClient);
	await compliance.answerRequirement({ caseId: "CASE-150", requirementId: "CASE-150-1", fileIds: ["cf_9c1e77d0a4b24f6e"], options: { idempotencyKey: "k1" } });
	assert.equal(calls[0].path, "/compliance/cases/CASE-150/requirements/CASE-150-1");
	assert.equal(calls[0].request.method, "PUT");
	assert.equal(calls[0].request.idempotencyKey, "k1");
	assert.deepEqual(calls[0].request.body, { fileIds: ["cf_9c1e77d0a4b24f6e"] });
	await assert.rejects(compliance.answerRequirement({ caseId: "CASE-150" }), /requirementId/);
});

test("uploadFile posts the case, the requirement and the file as multipart fields", async () => {
	const { client, multipartClient, calls } = captureClients();
	const compliance = new Compliance(client, multipartClient);
	await compliance.uploadFile({ caseId: "CASE-150", requirementId: "CASE-150-1", file: new Blob(["a,b\n"], { type: "text/csv" }), fileName: "records.csv" });
	assert.equal(calls[0].kind, "multipart");
	assert.equal(calls[0].path, "/compliance/files");
	assert.equal(calls[0].request.body.get("caseId"), "CASE-150");
	assert.equal(calls[0].request.body.get("requirementId"), "CASE-150-1");
	assert.ok(calls[0].request.body.get("file") instanceof Blob);
	assert.equal(calls[0].request.body.get("file").name, "records.csv");
	await assert.rejects(compliance.uploadFile({ caseId: "CASE-150" }), /file/);
});

test("uploadFile preserves File names and rejects unnamed text Blobs before sending", async () => {
	const { client, multipartClient, calls } = captureClients();
	const compliance = new Compliance(client, multipartClient);
	await compliance.uploadFile({ caseId: "CASE-150", file: new File(["note"], "note.txt", { type: "text/plain" }) });
	assert.equal(calls[0].request.body.get("file").name, "note.txt");
	await compliance.uploadFile({ caseId: "CASE-150", file: new File(["note"], "old.txt"), fileName: "new.txt" });
	assert.equal(calls[1].request.body.get("file").name, "new.txt");
	for (const type of ["text/plain", "text/csv"]) {
		await assert.rejects(compliance.uploadFile({ caseId: "CASE-150", file: new Blob(["text"], { type }) }), { name: "SignalHouseValidationError", message: /fileName/ });
	}
	assert.equal(calls.length, 2);
});

test("admin methods call the staff routes", async () => {
	const { client, multipartClient, calls } = captureClients();
	const { admin } = new Compliance(client, multipartClient, true);
	await admin.logAlert({ data: { form: "BLOCK", type: "SIGNAL_HOUSE_HOLD", subject: { kind: "CAMPAIGN", id: "C1" }, summary: "Hold" } });
	await admin.liftBlock({ alertId: "ALR-1", note: "Fixed" });
	await admin.getAlerts({ inbox: true, groupId: "G1" });
	await admin.getAlert({ alertId: "ALR-1" });
	await admin.triageAlert({ alertId: "ALR-1", data: { action: "note", note: "n" } });
	await admin.openCase({ data: { objectType: "CAMPAIGN", objectId: "C1", reasonTemplate: "OTHER", requirements: [{ kind: "CONFIRM", text: "t" }] } });
	await admin.updateCase({ caseId: "CASE-1", data: { assigneeUserId: null } });
	await admin.sendRequirements({ caseId: "CASE-1", requirements: [{ kind: "CONFIRM", text: "t" }], fixByDays: 3 });
	await admin.requestLift({ caseId: "CASE-1" });
	await admin.closeCase({ caseId: "CASE-1", closeReason: "CLEARED" });
	await admin.remindCase({ caseId: "CASE-1" });
	await admin.addCaseNote({ caseId: "CASE-1", kind: "STAFF", text: "n" });
	await admin.getStrikes({ groupId: "G1" });
	assert.deepEqual(calls.map((c) => `${c.request.method} ${c.path}`), [
		"POST /compliance/alerts",
		"POST /compliance/alerts/ALR-1/lift",
		"GET /compliance/alerts?inbox=true&groupId=G1",
		"GET /compliance/alerts/ALR-1",
		"PUT /compliance/alerts/ALR-1",
		"POST /compliance/cases",
		"PUT /compliance/cases/CASE-1",
		"PUT /compliance/cases/CASE-1/requirements",
		"POST /compliance/cases/CASE-1/lift-request",
		"POST /compliance/cases/CASE-1/close",
		"POST /compliance/cases/CASE-1/reminder",
		"POST /compliance/cases/CASE-1/note",
		"GET /compliance/strikes/G1",
	]);
	assert.deepEqual(calls[1].request.body, { note: "Fixed" });
	assert.deepEqual(calls[7].request.body, { requirements: [{ kind: "CONFIRM", text: "t" }], fixByDays: 3 });
	await assert.rejects(admin.closeCase({ caseId: "CASE-1" }), /closeReason/);
});
