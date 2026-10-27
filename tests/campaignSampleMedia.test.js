import { test } from "node:test";
import assert from "node:assert/strict";
import { Campaigns } from "../src/domains/Campaigns.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build request-capturing JSON and multipart clients that reuse the real SDK validation. */
function captureClients() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const make = (kind) => {
		const client = async (path, request) => { calls.push({ kind, path, request }); return { success: true, data: {} }; };
		client._require = sdk._require.bind(sdk);
		return client;
	};
	return { client: make("json"), multipartClient: make("multipart"), calls };
}

test("uploadSampleMedia posts the file as multipart field 'file'", async () => {
	const { client, multipartClient, calls } = captureClients();
	const campaigns = new Campaigns(client, multipartClient);
	const file = new Blob(["x"], { type: "image/png" });
	await campaigns.uploadSampleMedia({ file });
	assert.equal(calls[0].kind, "multipart");
	assert.equal(calls[0].path, "/campaign/sample-media");
	assert.equal(calls[0].request.method, "POST");
	assert.ok(calls[0].request.body instanceof FormData);
	assert.ok(calls[0].request.body.get("file") instanceof Blob);
	assert.equal(calls[0].request.body.get("groupId"), null);
	await assert.rejects(campaigns.uploadSampleMedia({}), /file/);
});

test("uploadSampleMedia sends groupId as a form field when given", async () => {
	const { client, multipartClient, calls } = captureClients();
	const campaigns = new Campaigns(client, multipartClient);
	await campaigns.uploadSampleMedia({ file: new Blob(["x"], { type: "image/png" }), groupId: "G0000001" });
	assert.equal(calls[0].request.body.get("groupId"), "G0000001");
	assert.ok(calls[0].request.body.get("file") instanceof Blob);
});

test("readSampleMedia reads the file by its encoded mediaId", async () => {
	const { client, multipartClient, calls } = captureClients();
	const campaigns = new Campaigns(client, multipartClient);
	await campaigns.readSampleMedia({ mediaId: "a/b" });
	assert.equal(calls[0].kind, "json");
	assert.equal(calls[0].path, "/campaign/sample-media/a%2Fb");
	assert.equal(calls[0].request.method, "GET");
	await assert.rejects(campaigns.readSampleMedia({}), /mediaId/);
});
