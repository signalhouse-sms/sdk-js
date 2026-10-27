import { test } from "node:test";
import assert from "node:assert/strict";
import { Numbers } from "../src/domains/Numbers.js";
import { Messages } from "../src/domains/Messages.js";

/** Build a request-capturing client without network access or credentials. */
function captureClient() {
	const calls = [];
	const client = async (path, request) => { calls.push({ path, request }); return { success: true }; };
	client._require = () => {};
	return { client, calls };
}

for (const country of [undefined, "CA"]) {
	test(`long-code purchase preserves ${country || "default US"} country and request options`, async () => {
		const { client, calls } = captureClient();
		await new Numbers(client).purchasePhoneNumber({ phoneNumbers: ["14165550118"], subgroupId: "S0000001", country, options: { token: "test-token" } });
		assert.deepEqual(calls, [{ path: "/number", request: { method: "POST", body: { phoneNumbers: ["14165550118"], subgroupId: "S0000001", country: country || "US" }, token: "test-token" } }]);
	});
	test(`Toll-Free purchase preserves ${country || "default US"} country`, async () => {
		const { client, calls } = captureClient();
		await new Numbers(client).purchaseTollFreeNumbers({ quantity: 2, subgroupId: "S0000001", country });
		assert.deepEqual(calls[0], { path: "/number/toll-free", request: { method: "POST", body: { quantity: 2, subgroupId: "S0000001", country: country || "US" } } });
	});
}

for (const messageType of [undefined, "MMS"]) {
	test(`estimate sends ${messageType || "default SMS"} without invoking a send endpoint`, async () => {
		const { client, calls } = captureClient();
		await new Messages(client).estimateMessage({ senderPhoneNumber: "14165550118", recipientPhoneNumbers: ["16045550118"], messageBody: "Hello", messageType });
		assert.equal(calls.length, 1);
		assert.equal(calls[0].path, "/message/estimate");
		assert.deepEqual(calls[0].request.body, { senderPhoneNumber: "14165550118", recipientPhoneNumbers: ["16045550118"], messageBody: "Hello", messageType: messageType || "SMS" });
	});
}

for (const country of ["CA", "US"]) {
	test(`availability preserves ${country} geographic filters and request options`, async () => {
		const { client, calls } = captureClient();
		client._getQueryString = params => "?" + new URLSearchParams(Object.entries(params).filter(([, value]) => value != null));
		await new Numbers(client).getAvailablePhoneNumbers({ country, state: country === "CA" ? "QC" : "TX", city: country === "CA" ? "Charny" : "Austin", npa: country === "CA" ? "367" : "512", nxx: "883", limit: 10, page: 2, options: { token: "test-token" } });
		const url = new URL(calls[0].path, "https://example.com");
		assert.equal(url.pathname, "/number/available");
		assert.equal(url.searchParams.get("country"), country);
		assert.equal(url.searchParams.get("city"), country === "CA" ? "Charny" : "Austin");
		assert.equal(url.searchParams.get("page"), "2");
		assert.equal(calls[0].request.token, "test-token");
	});
}
