import { test } from "node:test";
import assert from "node:assert/strict";
import { Shortlinks } from "../src/domains/Shortlinks.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a request-capturing client that reuses the real SDK validation. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	return { client, calls };
}

test("getOptOut reads the opt-out link by its encoded code", async () => {
	const { client, calls } = captureClient();
	const domain = new Shortlinks(client);
	await domain.getOptOut({ code: "ABC/1", options: { token: "session" } });
	assert.equal(calls[0].path, "/shortlink/optout/ABC%2F1");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.body, undefined);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.getOptOut({}), /code/);
});

test("confirmOptOut posts to the opt-out link with no body", async () => {
	const { client, calls } = captureClient();
	const domain = new Shortlinks(client);
	await domain.confirmOptOut({ code: "ABC/1" });
	assert.equal(calls[0].path, "/shortlink/optout/ABC%2F1");
	assert.equal(calls[0].request.method, "POST");
	assert.equal(calls[0].request.body, undefined);
	await assert.rejects(domain.confirmOptOut({}), /code/);
});
