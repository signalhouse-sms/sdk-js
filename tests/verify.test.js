import { test } from "node:test";
import assert from "node:assert/strict";
import { Verify } from "../src/domains/Verify.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a request-capturing client that reuses the real SDK validation. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	return { client, calls };
}

test("the SDK exposes verify", () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	assert.ok(sdk.verify instanceof Verify);
});

test("checkSimSwap posts the number and only the optional fields that were given", async () => {
	const { client, calls } = captureClient();
	const domain = new Verify(client);
	await domain.checkSimSwap({ phoneNumber: "+12025550123", maxAge: 240, includeSwapDate: true, options: { idempotencyKey: "k1" } });
	assert.equal(calls[0].path, "/verify/sim-swap");
	assert.equal(calls[0].request.method, "POST");
	assert.equal(calls[0].request.idempotencyKey, "k1");
	assert.deepEqual(calls[0].request.body, { phoneNumber: "+12025550123", maxAge: 240, includeSwapDate: true });

	await domain.checkSimSwap({ phoneNumber: "+12025550123", includeSwapDate: false });
	assert.deepEqual(calls[1].request.body, { phoneNumber: "+12025550123", includeSwapDate: false });

	await domain.checkSimSwap({ phoneNumber: "+12025550123" });
	assert.deepEqual(calls[2].request.body, { phoneNumber: "+12025550123" });
	await assert.rejects(domain.checkSimSwap({}), /phoneNumber/);
});

test("startNumberVerification posts the number with the optional hint and redirect", async () => {
	const { client, calls } = captureClient();
	const domain = new Verify(client);
	await domain.startNumberVerification({ phoneNumber: "+12025550123", devicePhoneNumber: "+12025550123", redirectUrl: "https://example.com/done" });
	assert.equal(calls[0].path, "/verify/number");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { phoneNumber: "+12025550123", devicePhoneNumber: "+12025550123", redirectUrl: "https://example.com/done" });

	await domain.startNumberVerification({ phoneNumber: "+12025550123", options: { token: "session" } });
	assert.deepEqual(calls[1].request.body, { phoneNumber: "+12025550123" });
	assert.equal(calls[1].request.token, "session");
	await assert.rejects(domain.startNumberVerification({}), /phoneNumber/);
});

test("getNumberVerification reads the check by its encoded id", async () => {
	const { client, calls } = captureClient();
	const domain = new Verify(client);
	await domain.getNumberVerification({ checkId: "NVC1/2" });
	assert.equal(calls[0].path, "/verify/number/NVC1%2F2");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.body, undefined);
	await assert.rejects(domain.getNumberVerification({}), /checkId/);
});
