import { test } from "node:test";
import assert from "node:assert/strict";
import { Registrations } from "../src/domains/Registrations.js";
import { Messages } from "../src/domains/Messages.js";
import { Numbers } from "../src/domains/Numbers.js";
import { Brands } from "../src/domains/Brands.js";
import { Onboarding } from "../src/domains/Onboarding.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build a request-capturing client that reuses the real SDK validation and query serializer. */
function captureClient() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const client = async (path, request) => { calls.push({ path, request }); return { success: true, data: {} }; };
	client._require = sdk._require.bind(sdk);
	client._getQueryString = sdk._getQueryString.bind(sdk);
	return { client, calls };
}

const params = (path) => new URL(path, "https://example.com").searchParams;
const pathname = (path) => new URL(path, "https://example.com").pathname;

test("the SDK exposes registrations in place of senderRegistrations", () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid", enableAdmin: true });
	assert.ok(sdk.registrations instanceof Registrations);
	assert.equal("senderRegistrations" in sdk, false);
	assert.deepEqual(Object.keys(sdk.registrations.admin), ["reviewRegistration", "correctRegistration", "addNumber", "reconcile", "getApplication"]);
});

test("catalog requires a region and forwards it as a query parameter", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client);
	await domain.getCatalog({ region: "UK", options: { token: "session" } });
	assert.equal(calls[0].path, "/registration/catalog?region=UK");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.getCatalog({}), /region/);
});

test("quotes require region and type, default to one number and only carry groupId when given", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client);
	await domain.getQuotes({ region: "GB", type: "VIRTUAL_LONG_CODE" });
	assert.equal(pathname(calls[0].path), "/registration/quotes");
	assert.equal(calls[0].request.method, "GET");
	assert.deepEqual(Object.fromEntries(params(calls[0].path)), { region: "GB", type: "VIRTUAL_LONG_CODE", quantity: "1" });
	await domain.getQuotes({ region: "GB", type: "VIRTUAL_LONG_CODE", quantity: 3, groupId: "G0000001", options: { token: "session" } });
	assert.deepEqual(Object.fromEntries(params(calls[1].path)), { region: "GB", type: "VIRTUAL_LONG_CODE", quantity: "3", groupId: "G0000001" });
	assert.equal(calls[1].request.token, "session");
	await assert.rejects(domain.getQuotes({ type: "VIRTUAL_LONG_CODE" }), /region/);
	await assert.rejects(domain.getQuotes({ region: "GB" }), /type/);
});

test("registration submission sends the generic envelope with the type's data and no quote version", async () => {
	const { client, calls } = captureClient();
	const input = {
		region: "GB", type: "VIRTUAL_LONG_CODE", subgroupId: "S0000001",
		capabilities: ["SMS"], data: { quantity: 2, useCases: ["Support"] },
	};
	await new Registrations(client).createRegistration({ ...input, options: { token: "session" } });
	assert.equal(calls[0].path, "/registration");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, input);
	assert.deepEqual(Object.keys(calls[0].request.body), ["region", "type", "subgroupId", "capabilities", "data"]);
	assert.equal(calls[0].request.token, "session");
	for (const field of ["region", "type", "subgroupId", "capabilities", "data"]) {
		await assert.rejects(new Registrations(client).createRegistration({ ...input, [field]: undefined }), new RegExp(field));
	}
});

test("a GB alphanumeric sender ID submission posts its data unchanged", async () => {
	const { client, calls } = captureClient();
	const input = {
		region: "GB", type: "ALPHANUMERIC_SENDER_ID", subgroupId: "S0000001",
		capabilities: ["SMS"],
		data: {
			requestedSenderId: "ACME", trafficOrigin: "LOCAL", trafficType: "TRANSACTIONAL", companyName: "Acme Ltd",
			companyCountry: "United Kingdom", companyWebsite: "https://acme.example", industry: "Retail",
			senderRelationship: "Trading name of Acme Ltd", messageExample: "Your Acme order has shipped.",
		},
	};
	await new Registrations(client).createRegistration(input);
	assert.equal(calls[0].path, "/registration");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, input);
});

test("registration list forwards every filter and pagination as query parameters", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client);
	const filters = { groupId: "G0000001", subgroupId: "S0000001", region: "GB", type: "VIRTUAL_LONG_CODE", kind: "sender", status: "SIGNAL_HOUSE_REVIEW", parentRegistrationId: "REG0", phoneNumber: "447700900123", sortBy: "status", sortOrder: "asc", page: 2, limit: 10 };
	await domain.getRegistrations({ ...filters, options: { token: "session" } });
	assert.equal(pathname(calls[0].path), "/registration");
	assert.equal(calls[0].request.method, "GET");
	assert.deepEqual(Object.fromEntries(params(calls[0].path)), { ...filters, page: "2", limit: "10" });
	assert.equal(calls[0].request.token, "session");
	await domain.getRegistrations({ status: ["APPROVED", "CANCELLED"], region: ["GB", "AU"] });
	assert.deepEqual(params(calls.at(-1).path).getAll("status"), ["APPROVED", "CANCELLED"]);
	assert.deepEqual(params(calls.at(-1).path).getAll("region"), ["GB", "AU"]);
	calls.pop();
	await domain.getRegistrations();
	assert.equal(calls[1].path, "/registration");
	await domain.getRegistration({ registrationId: "REG1", options: { token: "session" } });
	assert.equal(calls[2].path, "/registration/REG1");
	assert.equal(calls[2].request.method, "GET");
	assert.equal(calls[2].request.token, "session");
	await assert.rejects(domain.getRegistration({}), /registrationId/);
	await domain.cancelRegistration({ registrationId: "GB8T9GTD5AZY", options: { token: "session" } });
	assert.equal(calls[3].path, "/registration/GB8T9GTD5AZY");
	assert.equal(calls[3].request.method, "DELETE");
	assert.equal(calls[3].request.token, "session");
	await assert.rejects(domain.cancelRegistration({}), /registrationId/);
});

test("path parameters are URL-encoded", async () => {
	const { client, calls } = captureClient();
	await new Registrations(client).getRegistration({ registrationId: "REG/1 x" });
	assert.equal(calls[0].path, "/registration/REG%2F1%20x");
});

test("staff operations are gated behind enableAdmin", () => {
	const { client } = captureClient();
	assert.equal(new Registrations(client).admin, undefined);
	assert.equal(new Registrations(client, false).admin, undefined);
	assert.ok(new Registrations(client, true).admin);
});

test("review sends the decision and optional reason without a version field", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client, true);
	await domain.admin.reviewRegistration({ registrationId: "REG1", action: "REJECT", reason: "Incomplete", options: { token: "session" } });
	assert.equal(calls[0].path, "/registration/REG1/review");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { action: "REJECT", reason: "Incomplete" });
	assert.equal(calls[0].request.token, "session");
	await domain.admin.reviewRegistration({ registrationId: "REG1", action: "APPROVE" });
	assert.deepEqual(calls[1].request.body, { action: "APPROVE", reason: undefined });
	assert.equal("version" in calls[1].request.body, false);
	await assert.rejects(domain.admin.reviewRegistration({ registrationId: "REG1" }), /action/);
	await assert.rejects(domain.admin.reviewRegistration({ action: "APPROVE" }), /registrationId/);
});

test("corrections send the reason and the type's correctable data", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client, true);
	const data = { useCases: ["Support"], voice: { companyName: "Example Ltd" } };
	await domain.admin.correctRegistration({ registrationId: "REG1", reason: "Correction", data, options: { token: "session" } });
	assert.equal(calls[0].path, "/registration/REG1/corrections");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { reason: "Correction", data });
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.admin.correctRegistration({ registrationId: "REG1", data }), /reason/);
	await assert.rejects(domain.admin.correctRegistration({ registrationId: "REG1", reason: "Correction" }), /data/);
});

test("number allocation, reconciliation and application download hit their staff paths", async () => {
	const { client, calls } = captureClient();
	const domain = new Registrations(client, true);
	await domain.admin.addNumber({ registrationId: "REG1", phoneNumber: "447400123456" });
	assert.equal(calls[0].path, "/registration/REG1/numbers");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, { phoneNumber: "447400123456" });
	await assert.rejects(domain.admin.addNumber({ registrationId: "REG1" }), /phoneNumber/);
	await domain.admin.reconcile({ registrationId: "REG1", externalId: "order-123" });
	assert.equal(calls[1].path, "/registration/REG1/reconcile");
	assert.equal(calls[1].request.method, "POST");
	assert.deepEqual(calls[1].request.body, { externalId: "order-123" });
	assert.equal("providerReference" in calls[1].request.body, false);
	await assert.rejects(domain.admin.reconcile({ registrationId: "REG1" }), /externalId/);
	await domain.admin.getApplication({ registrationId: "REG1", options: { token: "session" } });
	assert.equal(calls[2].path, "/registration/REG1/application");
	assert.equal(calls[2].request.method, "GET");
	assert.equal(calls[2].request.responseType, "arraybuffer");
	assert.equal(calls[2].request.token, "session");
	await assert.rejects(domain.admin.getApplication({}), /registrationId/);
});

for (const method of ["getMessages", "getDncRecords"]) {
	test(`${method} serialises regionScopes as JSON, repeats region values and preserves empty scopes`, async () => {
		const { client, calls } = captureClient();
		const domain = new Messages(client);
		const branches = [{ region: "GB", channels: ["virtualLongCode"], phoneNumber: ["447400123456"] }];
		await domain[method]({ groupId: "G0000001", region: ["US", "GB"], regionScopes: branches, options: { token: "session" } });
		assert.deepEqual(JSON.parse(params(calls[0].path).get("regionScopes")), branches);
		assert.deepEqual(params(calls[0].path).getAll("region"), ["US", "GB"]);
		assert.equal(calls[0].request.token, "session");
		await domain[method]({ groupId: "G0000001", region: "GB", regionScopes: [] });
		assert.equal(params(calls[1].path).get("regionScopes"), "[]");
		await domain[method]({ groupId: "G0000001", regionScopes: JSON.stringify(branches) });
		assert.equal(params(calls[2].path).get("regionScopes"), JSON.stringify(branches));
		await domain[method]({ groupId: "G0000001" });
		assert.equal(params(calls[3].path).has("regionScopes"), false);
		assert.equal(params(calls[3].path).has("region"), false);
	});
}

test("filter options forward their own region parameter", async () => {
	const { client, calls } = captureClient();
	await new Messages(client).getAnalyticsFilterOptions({ groupId: "G0000001", region: "GB" });
	assert.equal(pathname(calls[0].path), "/message/analytics/filter-options");
	assert.equal(params(calls[0].path).get("region"), "GB");
});

for (const [method, path] of [["getAnalytics", "/message/analytics"], ["getAnalyticsDetail", "/message/analytics/detail"], ["getAnalyticsThroughput", "/message/analytics/throughput"], ["getDncAnalytics", "/message/dnc/analytics"], ["getAnalyticsBySubgroup", "/message/analytics/by-subgroup"], ["getAnalyticsByErrorCode", "/message/analytics/by-error-code"], ["getDncRecords", "/message/dnc"], ["getMessages", "/message"]]) {
	test(`${method} repeats registrationId values beside campaignId and omits it when absent`, async () => {
		const { client, calls } = captureClient();
		const domain = new Messages(client);
		await domain[method]({ groupId: "G0000001", campaignId: ["C1", "C2"], registrationId: ["REG1", "REG2"], startDate: "2026-09-01", endDate: "2026-09-02" });
		assert.equal(pathname(calls[0].path), path);
		assert.deepEqual(params(calls[0].path).getAll("campaignId"), ["C1", "C2"]);
		assert.deepEqual(params(calls[0].path).getAll("registrationId"), ["REG1", "REG2"]);
		await domain[method]({ groupId: "G0000001", registrationId: "REG1", startDate: "2026-09-01", endDate: "2026-09-02" });
		assert.deepEqual(params(calls[1].path).getAll("registrationId"), ["REG1"]);
		await domain[method]({ groupId: "G0000001", startDate: "2026-09-01", endDate: "2026-09-02" });
		assert.equal(params(calls[2].path).has("registrationId"), false);
	});
}

test("getPhoneNumbers forwards registrationId", async () => {
	const { client, calls } = captureClient();
	await new Numbers(client).getPhoneNumbers({ groupId: "G0000001", campaignId: "C1", registrationId: "REG1" });
	assert.equal(pathname(calls[0].path), "/number");
	assert.equal(params(calls[0].path).get("registrationId"), "REG1");
	assert.equal(params(calls[0].path).get("campaignId"), "C1");
});

test("getPhoneNumbers forwards currentTollFreeCarrier and leaves it out when not given", async () => {
	const { client, calls } = captureClient();
	const domain = new Numbers(client);
	await domain.getPhoneNumbers({ subgroupId: "S0000001", currentTollFreeCarrier: true, options: { token: "session" } });
	assert.equal(pathname(calls[0].path), "/number");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(params(calls[0].path).get("subgroupId"), "S0000001");
	assert.equal(params(calls[0].path).get("currentTollFreeCarrier"), "true");
	assert.equal(calls[0].request.token, "session");
	await domain.getPhoneNumbers({ groupId: "G0000001" });
	assert.equal(params(calls[1].path).has("currentTollFreeCarrier"), false);
});

test("getBrands forwards currentTollFreeCarrier", async () => {
	const { client, calls } = captureClient();
	await new Brands(client).getBrands({ groupId: "G0000001", currentTollFreeCarrier: true, options: { token: "session" } });
	assert.equal(pathname(calls[0].path), "/brand");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(params(calls[0].path).get("groupId"), "G0000001");
	assert.equal(params(calls[0].path).get("currentTollFreeCarrier"), "true");
	assert.equal(calls[0].request.token, "session");
});

test("setTollFreeProvider puts the provider on the group's onboarding record and requires both arguments", async () => {
	const { client, calls } = captureClient();
	const domain = new Onboarding(client, true);
	await domain.admin.setTollFreeProvider({ groupId: "G 1", tollFreeProvider: "twilio", options: { token: "session" } });
	assert.equal(calls[0].path, "/group/onboarding/G%201/toll-free-provider");
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, { tollFreeProvider: "twilio" });
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.admin.setTollFreeProvider({ groupId: "G 1" }), /tollFreeProvider/);
	await assert.rejects(domain.admin.setTollFreeProvider({ tollFreeProvider: "twilio" }), /groupId/);
	assert.equal(calls.length, 1);
});

test("getBusinessVerifications lists the group's business verifications and requires groupId", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	await domain.getBusinessVerifications({ groupId: "G 1", options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201");
	assert.equal(calls[0].request.method, "GET");
	assert.equal("body" in calls[0].request, false);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.getBusinessVerifications({}), /groupId/);
	assert.equal(calls.length, 1);
});

test("createBusinessVerification posts the details as the body and requires groupId and details", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	const details = {
		businessName: "Acme Inc", businessType: "CORPORATION", industry: "RETAIL", registrationType: "EIN", registrationNumber: "12-3456789",
		website: "https://acme.example", street: "1 Main St", city: "Austin", state: "TX", postalCode: "78701", country: "US",
		representative: { firstName: "Ada", lastName: "Lee", email: "ada@acme.example", phone: "+15125550100", jobTitle: "Owner", jobLevel: "CEO" },
	};
	await domain.createBusinessVerification({ groupId: "G 1", details, options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, details);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.createBusinessVerification({ groupId: "G 1" }), /details/);
	await assert.rejects(domain.createBusinessVerification({ details }), /groupId/);
	assert.equal(calls.length, 1);
});

test("getBusinessVerification reads one business verification by its ID and requires both IDs", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	await domain.getBusinessVerification({ groupId: "G 1", businessVerificationId: "BV 1/2", options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201/BV%201%2F2");
	assert.equal(calls[0].request.method, "GET");
	assert.equal("body" in calls[0].request, false);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.getBusinessVerification({ businessVerificationId: "BV1" }), /groupId/);
	await assert.rejects(domain.getBusinessVerification({ groupId: "G 1" }), /businessVerificationId/);
	assert.equal(calls.length, 1);
});

test("updateBusinessVerification puts the details on the business verification's path and requires every argument", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	const details = { businessName: "Acme Inc", registrationType: "EIN", registrationNumber: "12-3456789" };
	await domain.updateBusinessVerification({ groupId: "G 1", businessVerificationId: "BV 1/2", details, options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201/BV%201%2F2");
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, details);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.updateBusinessVerification({ businessVerificationId: "BV1", details }), /groupId/);
	await assert.rejects(domain.updateBusinessVerification({ groupId: "G 1", details }), /businessVerificationId/);
	await assert.rejects(domain.updateBusinessVerification({ groupId: "G 1", businessVerificationId: "BV1" }), /details/);
	assert.equal(calls.length, 1);
});

test("submitBusinessVerification is gone: createBusinessVerification and updateBusinessVerification replace it", () => {
	const domain = new Brands(captureClient().client);
	assert.equal("submitBusinessVerification" in domain, false);
	assert.equal(typeof domain.createBusinessVerification, "function");
	assert.equal(typeof domain.updateBusinessVerification, "function");
});

test("getTollFreeOrderStatus sends groupId only when it is given", async () => {
	const { client, calls } = captureClient();
	const domain = new Numbers(client);
	await domain.getTollFreeOrderStatus({ orderId: "TFNO 1", options: { token: "session" } });
	await domain.getTollFreeOrderStatus({ orderId: "TFNO 1", groupId: "G0000001" });
	assert.equal(calls[0].path, "/number/toll-free/order/TFNO%201");
	assert.equal(calls[0].request.method, "GET");
	assert.equal(calls[0].request.token, "session");
	assert.equal(pathname(calls[1].path), "/number/toll-free/order/TFNO%201");
	assert.deepEqual(Object.fromEntries(params(calls[1].path)), { groupId: "G0000001" });
	await assert.rejects(domain.getTollFreeOrderStatus({ groupId: "G0000001" }), /orderId/);
	assert.equal(calls.length, 2);
});

test("getBusinessVerifications sends subgroupId as a query parameter only when it is given", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	await domain.getBusinessVerifications({ groupId: "G 1", subgroupId: "S0000001", options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201?subgroupId=S0000001");
	assert.equal(calls[0].request.method, "GET");
	assert.equal("body" in calls[0].request, false);
	assert.equal(calls[0].request.token, "session");
	await domain.getBusinessVerifications({ groupId: "G 1" });
	assert.equal(calls[1].path, "/brand/business-verification/G%201");
	await domain.getBusinessVerifications({ groupId: "G 1", subgroupId: undefined });
	assert.equal(calls[2].path, "/brand/business-verification/G%201");
	await assert.rejects(domain.getBusinessVerifications({ subgroupId: "S0000001" }), /groupId/);
	assert.equal(calls.length, 3);
});

test("createBusinessVerification sends subgroupId as a query parameter only when it is given and keeps the details as the body", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	const details = {
		businessName: "Acme Inc", businessType: "CORPORATION", industry: "RETAIL", registrationType: "EIN", registrationNumber: "12-3456789",
		website: "https://acme.example", street: "1 Main St", city: "Austin", state: "TX", postalCode: "78701", country: "US",
		representative: { firstName: "Ada", lastName: "Lee", email: "ada@acme.example", phone: "+15125550100", jobTitle: "Owner", jobLevel: "CEO" },
	};
	await domain.createBusinessVerification({ groupId: "G 1", subgroupId: "S0000001", details, options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/business-verification/G%201?subgroupId=S0000001");
	assert.equal(calls[0].request.method, "POST");
	assert.deepEqual(calls[0].request.body, details);
	assert.equal("subgroupId" in calls[0].request.body, false);
	assert.equal(calls[0].request.token, "session");
	await domain.createBusinessVerification({ groupId: "G 1", details });
	assert.equal(calls[1].path, "/brand/business-verification/G%201");
	assert.deepEqual(calls[1].request.body, details);
	await assert.rejects(domain.createBusinessVerification({ groupId: "G 1", subgroupId: "S0000001" }), /details/);
	assert.equal(calls.length, 2);
});

test("getTollFreeIsvAccount gets the group's toll-free ISV account and requires groupId", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	await domain.getTollFreeIsvAccount({ groupId: "G 1", options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/toll-free-isv-account/G%201");
	assert.equal(calls[0].request.method, "GET");
	assert.equal("body" in calls[0].request, false);
	assert.equal(calls[0].request.token, "session");
	await assert.rejects(domain.getTollFreeIsvAccount({}), /groupId/);
	assert.equal(calls.length, 1);
});

test("setTollFreeIsvAccount puts the account and its API key as the body and requires every field", async () => {
	const { client, calls } = captureClient();
	const domain = new Brands(client);
	const account = { accountSid: `AC${"a".repeat(32)}`, apiKeySid: `SK${"b".repeat(32)}`, apiKeySecret: "test-secret" };
	await domain.setTollFreeIsvAccount({ groupId: "G 1", ...account, options: { token: "session" } });
	assert.equal(calls[0].path, "/brand/toll-free-isv-account/G%201");
	assert.equal(calls[0].request.method, "PUT");
	assert.deepEqual(calls[0].request.body, account);
	assert.equal(calls[0].request.token, "session");
	for (const field of ["groupId", "accountSid", "apiKeySid", "apiKeySecret"]) {
		await assert.rejects(domain.setTollFreeIsvAccount({ groupId: "G 1", ...account, [field]: undefined }), new RegExp(`parameter: ${field}$`));
	}
	assert.equal(calls.length, 1);
});
