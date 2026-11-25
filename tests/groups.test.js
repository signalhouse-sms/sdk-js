import { test } from "node:test";
import assert from "node:assert/strict";
import { Groups } from "../src/domains/Groups.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/**
 * A request-capturing client that reuses the real SDK query-string builder.
 * @returns {{client: Function, calls: Array<Object>}} - The client and the requests it received.
 */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => {
		calls.push({ path, request });
		return { success: true, data: [] };
	};
	client._getQueryString = sdk._getQueryString.bind(sdk);
	client._require = sdk._require.bind(sdk);
	return { client, calls };
}

test("admin.getGroups keeps the plain page and limit read", async () => {
	const { client, calls } = captureClient();
	await new Groups(client, true).admin.getGroups({ page: 1, limit: 500 });
	assert.equal(calls[0].path, "/group?page=1&limit=500");
});

test("admin.getGroups forwards search and includeTotal", async () => {
	const { client, calls } = captureClient();
	await new Groups(client, true).admin.getGroups({ page: 1, limit: 50, search: "apex", includeTotal: true });
	assert.equal(calls[0].path, "/group?page=1&limit=50&search=apex&includeTotal=true");
	assert.equal(calls[0].request.method, "GET");
});

test("admin.getGroups sends several search values as repeated keys", async () => {
	const { client, calls } = captureClient();
	await new Groups(client, true).admin.getGroups({ search: ["apex", "groupCompanyName:dental"] });
	assert.equal(calls[0].path, "/group?search=apex&search=groupCompanyName%3Adental");
});
