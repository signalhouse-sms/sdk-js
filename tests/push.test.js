import { test } from "node:test";
import assert from "node:assert/strict";
import { PushCredentials } from "../src/domains/voice/PushCredentials.js";
import { PushDevices } from "../src/domains/voice/PushDevices.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

const ID = "5a3c2f8e-1b7d-4c9a-9e2f-0d4b6a8c1e33";

/** Build a request-capturing client that reuses the real SDK helpers. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	return { client, calls };
}

test("is reachable as sdk.voice.pushCredentials and sdk.voice.pushDevices", () => {
	const sdk = new SignalHouseSDK({ apiKey: "x", baseUrl: "https://example.invalid" });
	assert.equal(typeof sdk.voice.pushCredentials.create, "function");
	assert.equal(typeof sdk.voice.pushDevices.register, "function");
});

test("push credentials map to the push-credentials routes", async () => {
	const { client, calls } = captureClient();
	const creds = new PushCredentials(client, false);
	const apns = { provider: "apns", keyId: "ABC123DEFG", teamId: "TEAM123456", bundleId: "com.example.app", privateKey: "p8-key-contents" };
	await creds.list();
	await creds.get({ id: ID });
	await creds.create({ credentialData: apns });
	await creds.update({ id: ID, credentialData: { provider: "fcm", serviceAccount: "{}" } });
	await creds.delete({ id: ID });
	assert.deepEqual(calls.map((c) => [c.request.method, c.path]), [
		["GET", "/voice/api/v1/push-credentials"],
		["GET", `/voice/api/v1/push-credentials/${ID}`],
		["POST", "/voice/api/v1/push-credentials"],
		["PUT", `/voice/api/v1/push-credentials/${ID}`],
		["DELETE", `/voice/api/v1/push-credentials/${ID}`],
	]);
	assert.deepEqual(calls[2].request.body, apns);
	assert.deepEqual(calls[3].request.body, { provider: "fcm", serviceAccount: "{}" });
});

test("push credentials require their parameters", async () => {
	const { client } = captureClient();
	const creds = new PushCredentials(client, false);
	await assert.rejects(creds.get({}), /id/);
	await assert.rejects(creds.create({}), /credentialData/);
	await assert.rejects(creds.update({ id: ID }), /credentialData/);
});

test("push devices send the voice token and encode the device token", async () => {
	const { client, calls } = captureClient();
	const devices = new PushDevices(client, false);
	await devices.register({ deviceData: { provider: "fcm", deviceToken: "fcm:tok/1" }, options: { token: "voice-jwt" } });
	await devices.unregister({ deviceToken: "fcm:tok/1", options: { token: "voice-jwt" } });
	await devices.listDeliveries({ limit: 5, options: { token: "voice-jwt" } });
	await devices.listDeliveries({ options: { token: "voice-jwt" } });
	assert.deepEqual(calls.map((c) => [c.request.method, c.path]), [
		["POST", "/voice/api/v1/push-devices"],
		["DELETE", "/voice/api/v1/push-devices/fcm%3Atok%2F1"],
		["GET", "/voice/api/v1/push-devices/deliveries?limit=5"],
		["GET", "/voice/api/v1/push-devices/deliveries"],
	]);
	assert.equal(calls[0].request.token, "voice-jwt");
	assert.deepEqual(calls[0].request.body, { provider: "fcm", deviceToken: "fcm:tok/1" });
	await assert.rejects(devices.register({}), /deviceData/);
	await assert.rejects(devices.unregister({}), /deviceToken/);
});
