import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

let sent;

beforeEach(() => {
	sent = [];
	axios.defaults.adapter = async (config) => {
		sent.push(config);
		return { data: {}, status: 201, statusText: "Created", headers: {}, config };
	};
});

const registration = { region: "GB", type: "VIRTUAL_LONG_CODE", subgroupId: "SG1", capabilities: ["SMS"], data: { quantity: 1 } };

test("idempotencyKey goes out as the Idempotency-Key header and never as request config", async () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });

	await sdk.registrations.createRegistration({ ...registration, options: { idempotencyKey: "key-1", token: "session" } });

	assert.equal(sent[0].headers["Idempotency-Key"], "key-1");
	assert.equal(sent[0].headers.Authorization, "Bearer session");
	assert.equal("idempotencyKey" in sent[0], false);
});

test("no Idempotency-Key header is sent without the option", async () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });

	await sdk.registrations.createRegistration(registration);

	assert.equal(sent[0].headers["Idempotency-Key"], undefined);
});
