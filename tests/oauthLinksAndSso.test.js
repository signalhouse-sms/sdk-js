import { test } from "node:test";
import assert from "node:assert/strict";
import { Auth } from "../src/domains/Auth.js";
import { Groups } from "../src/domains/Groups.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a request-capturing client that reuses the real SDK validation and query-string helpers. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://api.example.invalid/" });
	const client = async (path, request) => {
		calls.push({ path, request });
		return { success: true, data: {} };
	};
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	client._baseUrl = "https://api.example.invalid/";
	return { client, calls };
}

test("getOAuthAuthorizationUrl adds email, linkTicket and next only when given, in that order", () => {
	const { client } = captureClient();
	const auth = new Auth(client);
	assert.equal(auth.getOAuthAuthorizationUrl({ provider: "google" }), "https://api.example.invalid/auth/oauth/google");
	assert.equal(auth.getOAuthAuthorizationUrl({ provider: "google", next: "/dashboard" }), "https://api.example.invalid/auth/oauth/google?next=%2Fdashboard");
	assert.equal(
		auth.getOAuthAuthorizationUrl({ provider: "sso", email: "sam@acme.com", next: "/x" }),
		"https://api.example.invalid/auth/oauth/sso?email=sam%40acme.com&next=%2Fx"
	);
	assert.equal(auth.getOAuthAuthorizationUrl({ provider: "apple", linkTicket: "t/1" }), "https://api.example.invalid/auth/oauth/apple?linkTicket=t%2F1");
	assert.throws(() => auth.getOAuthAuthorizationUrl({}), /provider/);
});

test("getOAuthLinks reads the caller's sign-in methods", async () => {
	const { client, calls } = captureClient();
	await new Auth(client).getOAuthLinks({ options: { token: "session" } });
	assert.equal(calls[0].path, "/auth/oauth/links");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.token, "session");
});

test("createOAuthLink and deleteOAuthLink address the encoded provider with no body", async () => {
	const { client, calls } = captureClient();
	const auth = new Auth(client);
	await auth.createOAuthLink({ provider: "google" });
	await auth.deleteOAuthLink({ provider: "sso" });
	assert.deepEqual(
		calls.map(({ path, request }) => [request.method, path, request.body]),
		[
			["POST", "/auth/oauth/google/link", undefined],
			["DELETE", "/auth/oauth/sso/link", undefined],
		]
	);
	await assert.rejects(auth.createOAuthLink({}), /provider/);
	await assert.rejects(auth.deleteOAuthLink({}), /provider/);
});

test("confirmOAuthLink posts the pending link and requires it", async () => {
	const { client, calls } = captureClient();
	const auth = new Auth(client);
	await auth.confirmOAuthLink({ pendingLink: "pl_123", options: { token: "session" } });
	assert.equal(calls[0].path, "/auth/oauth/links/confirm");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { pendingLink: "pl_123" });
	await assert.rejects(auth.confirmOAuthLink({}), /pendingLink/);
});

test("group SSO methods send groupId in the query or body and encode the domain", async () => {
	const { client, calls } = captureClient();
	const groups = new Groups(client);
	await groups.getSsoConfiguration({ groupId: "G1234567" });
	await groups.saveSsoConnection({ groupId: "G1234567", issuer: "https://acme.okta.com", clientId: "c", clientSecret: "s", enabled: false });
	await groups.deleteSsoConnection({ groupId: "G1234567" });
	await groups.addSsoDomain({ groupId: "G1234567", domain: "acme.com" });
	await groups.verifySsoDomain({ groupId: "G1234567", domain: "a/b.com" });
	await groups.removeSsoDomain({ groupId: "G1234567", domain: "acme.com" });

	assert.deepEqual(
		calls.map(({ path, request }) => [request.method, path, request.body]),
		[
			["GET", "/group/sso?groupId=G1234567", undefined],
			["PUT", "/group/sso", { groupId: "G1234567", issuer: "https://acme.okta.com", clientId: "c", clientSecret: "s", enabled: false }],
			["DELETE", "/group/sso?groupId=G1234567", undefined],
			["POST", "/group/sso/domains", { groupId: "G1234567", domain: "acme.com" }],
			["POST", "/group/sso/domains/a%2Fb.com/verify", { groupId: "G1234567" }],
			["DELETE", "/group/sso/domains/acme.com?groupId=G1234567", undefined],
		]
	);
});

test("group SSO methods require their identifying params", async () => {
	const { client } = captureClient();
	const groups = new Groups(client);
	await assert.rejects(groups.getSsoConfiguration({}), /groupId/);
	await assert.rejects(groups.saveSsoConnection({ groupId: "G1234567", issuer: "https://acme.okta.com" }), /clientId/);
	await assert.rejects(groups.addSsoDomain({ groupId: "G1234567" }), /domain/);
	await assert.rejects(groups.removeSsoDomain({ domain: "acme.com" }), /groupId/);
});

test("createOAuthReauth posts to the encoded provider's reauth path, and the URL carries reauthTicket", async () => {
	const { client, calls } = captureClient();
	const auth = new Auth(client);
	await auth.createOAuthReauth({ provider: "sso", options: { token: "session" } });
	assert.deepEqual([calls[0].request.method, calls[0].path, calls[0].request.body, calls[0].request.token], ["POST", "/auth/oauth/sso/reauth", undefined, "session"]);
	await assert.rejects(auth.createOAuthReauth({}), /provider/);
	// No email needed for "sso" with a reauthTicket
	assert.equal(auth.getOAuthAuthorizationUrl({ provider: "sso", reauthTicket: "r/1" }), "https://api.example.invalid/auth/oauth/sso?reauthTicket=r%2F1");
});

test("confirmOAuthReauth posts the pending re-sign-in with its secret and requires both", async () => {
	const { client, calls } = captureClient();
	const auth = new Auth(client);
	await auth.confirmOAuthReauth({ pendingReauth: "pr-1", reauthSecret: "rs-1", options: { token: "session" } });
	assert.deepEqual([calls[0].request.method, calls[0].path, calls[0].request.body, calls[0].request.token], ["POST", "/auth/oauth/reauth/confirm", { pendingReauth: "pr-1", reauthSecret: "rs-1" }, "session"]);
	await assert.rejects(auth.confirmOAuthReauth({ reauthSecret: "rs-1" }), /pendingReauth/);
	// The browser-held secret is required too
	await assert.rejects(auth.confirmOAuthReauth({ pendingReauth: "pr-1" }), /reauthSecret/);
});
