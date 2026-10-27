import { test } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { Templates } from "../src/domains/Templates.js";
import { SignalHouseSDK } from "../src/SignalHouseSDK.js";

/** Build JSON and multipart capture clients that reuse the real SDK validation and query serializer. */
function captureClients() {
	const calls = [];
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	const make = (kind) => {
		const fn = async (path, request) => { calls.push({ kind, path, request }); return { success: true, data: {} }; };
		fn._require = sdk._require.bind(sdk);
		fn._getQueryString = sdk._getQueryString.bind(sdk);
		return fn;
	};
	return { client: make("json"), multipartClient: make("multipart"), calls };
}

const params = (path) => Object.fromEntries(new URL(path, "https://example.com").searchParams);
const pathname = (path) => new URL(path, "https://example.com").pathname;
const wire = (body) => JSON.parse(JSON.stringify(body));

const rcsBody = { channel: "rcs", contentFormat: "rcs.blocks.v1", content: { blocks: [{ id: "b1", kind: "text", text: "Hi {{first_name}}" }] }, variables: [{ key: "first_name", type: "text", required: true }] };

const doors = [
	{
		name: "templates", Domain: Templates, base: "/template",
		m: { create: "create", list: "list", get: "get", update: "update", publish: "publish", archive: "archive", versions: "versions", validate: "validate", capabilities: "capabilities", uploadMedia: "uploadMedia" },
	},
];

test("the SDK exposes the template namespace with the multipart client wired in", () => {
	const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
	assert.ok(sdk.templates instanceof Templates);
	assert.equal(typeof sdk.templates.multipartClient, "function");
});

for (const { name, Domain, base, m } of doors) {
	const setup = () => {
		const { client, multipartClient, calls } = captureClients();
		return { domain: new Domain(client, multipartClient), calls };
	};

	test(`${name}: create posts the raw body with groupId and requires groupId, name and body`, async () => {
		const { domain, calls } = setup();
		const input = { groupId: "G0000001", name: "Welcome", tag: "Onboarding", body: rcsBody };
		await domain[m.create]({ ...input, options: { token: "session", idempotencyKey: "create-1" } });
		assert.equal(calls[0].kind, "json");
		assert.equal(calls[0].path, base);
		assert.equal(calls[0].request.method, "POST");
		assert.deepEqual(calls[0].request.body, input);
		assert.equal(calls[0].request.token, "session");
		assert.equal(calls[0].request.idempotencyKey, "create-1");
		await domain[m.create]({ groupId: "G0000001", name: "Bare", body: rcsBody });
		assert.deepEqual(wire(calls[1].request.body), { groupId: "G0000001", name: "Bare", body: rcsBody });
		for (const field of ["groupId", "name", "body"]) {
			await assert.rejects(domain[m.create]({ ...input, [field]: undefined }), new RegExp(field));
		}
	});

	test(`${name}: list forwards filters and pagination as query parameters`, async () => {
		const { domain, calls } = setup();
		const filters = { groupId: "G0000001", state: "PUBLISHED", tag: "Promo", search: "sale", sortBy: "name", sortOrder: "asc", page: 2, limit: 50 };
		await domain[m.list]({ ...filters, channel: "rcs", options: { token: "session" } });
		assert.equal(pathname(calls[0].path), base);
		assert.equal(calls[0].request.method, "GET");
		assert.equal(calls[0].request.token, "session");
		const expected = { ...filters, page: "2", limit: "50" };
		assert.deepEqual(params(calls[0].path), { ...expected, channel: "rcs" });
		await domain[m.list]({ groupId: "G0000001" });
		assert.equal(calls[1].path, `${base}?groupId=G0000001`);
		await assert.rejects(domain[m.list]({}), /groupId/);
	});

	test(`${name}: get encodes the template ID and passes the version selector`, async () => {
		const { domain, calls } = setup();
		await domain[m.get]({ templateId: "TPL/1 x", groupId: "G0000001", version: "draft" });
		assert.equal(pathname(calls[0].path), `${base}/TPL%2F1%20x`);
		assert.equal(calls[0].request.method, "GET");
		assert.deepEqual(params(calls[0].path), { groupId: "G0000001", version: "draft" });
		await domain[m.get]({ templateId: "TPL1", groupId: "G0000001", version: 3 });
		assert.deepEqual(params(calls[1].path), { groupId: "G0000001", version: "3" });
		await domain[m.get]({ templateId: "TPL1", groupId: "G0000001" });
		assert.equal(calls[2].path, `${base}/TPL1?groupId=G0000001`);
		await assert.rejects(domain[m.get]({ groupId: "G0000001" }), /templateId/);
		await assert.rejects(domain[m.get]({ templateId: "TPL1" }), /groupId/);
	});

	test(`${name}: update sends only the given fields and distinguishes a null tag from an omitted one`, async () => {
		const { domain, calls } = setup();
		await domain[m.update]({ templateId: "TPL1", groupId: "G0000001", options: { idempotencyKey: "update-1" } });
		assert.equal(calls[0].path, `${base}/TPL1`);
		assert.equal(calls[0].request.method, "PUT");
		assert.equal(calls[0].request.idempotencyKey, "update-1");
		assert.deepEqual(wire(calls[0].request.body), { groupId: "G0000001" });
		assert.equal("tag" in wire(calls[0].request.body), false);

		await domain[m.update]({ templateId: "TPL1", groupId: "G0000001", name: "Renamed", tag: null, body: rcsBody });
		assert.deepEqual(wire(calls[1].request.body), { groupId: "G0000001", name: "Renamed", tag: null, body: rcsBody });

		const valid = { templateId: "TPL1", groupId: "G0000001", name: "Renamed" };
		for (const field of ["templateId", "groupId"]) {
			await assert.rejects(domain[m.update]({ ...valid, [field]: undefined }), new RegExp(field));
		}
		assert.equal(calls.length, 2);
	});

	test(`${name}: publish and archive post only groupId`, async () => {
		const { domain, calls } = setup();
		await domain[m.publish]({ templateId: "TPL1", groupId: "G0000001", options: { idempotencyKey: "publish-1" } });
		assert.equal(calls[0].path, `${base}/TPL1/publish`);
		assert.equal(calls[0].request.method, "POST");
		assert.deepEqual(calls[0].request.body, { groupId: "G0000001" });
		assert.equal(calls[0].request.idempotencyKey, "publish-1");
		for (const field of ["templateId", "groupId"]) {
			await assert.rejects(domain[m.publish]({ templateId: "TPL1", groupId: "G0000001", [field]: undefined }), new RegExp(field));
		}

		await domain[m.archive]({ templateId: "TPL1", groupId: "G0000001" });
		assert.equal(calls[1].path, `${base}/TPL1/archive`);
		assert.equal(calls[1].request.method, "POST");
		assert.deepEqual(calls[1].request.body, { groupId: "G0000001" });
		for (const field of ["templateId", "groupId"]) {
			await assert.rejects(domain[m.archive]({ templateId: "TPL1", groupId: "G0000001", [field]: undefined }), new RegExp(field));
		}
	});

	test(`${name}: versions reads with query parameters`, async () => {
		const { domain, calls } = setup();
		await domain[m.versions]({ templateId: "TPL1", groupId: "G0000001", page: 1, limit: 10 });
		assert.equal(pathname(calls[0].path), `${base}/TPL1/versions`);
		assert.equal(calls[0].request.method, "GET");
		assert.deepEqual(params(calls[0].path), { groupId: "G0000001", page: "1", limit: "10" });
		await assert.rejects(domain[m.versions]({ groupId: "G0000001" }), /templateId/);
	});

	test(`${name}: validate sends exactly one of body or version`, async () => {
		const { domain, calls } = setup();
		await domain[m.validate]({ templateId: "TPL1", groupId: "G0000001", body: rcsBody });
		assert.equal(calls[0].path, `${base}/TPL1/validate`);
		assert.equal(calls[0].request.method, "POST");
		assert.deepEqual(calls[0].request.body, { groupId: "G0000001", body: rcsBody });
		await domain[m.validate]({ templateId: "TPL1", groupId: "G0000001", version: "draft" });
		assert.deepEqual(calls[1].request.body, { groupId: "G0000001", version: "draft" });
		await assert.rejects(domain[m.validate]({ templateId: "TPL1", groupId: "G0000001" }), { name: "SignalHouseValidationError", message: /exactly one/ });
		await assert.rejects(domain[m.validate]({ templateId: "TPL1", groupId: "G0000001", body: rcsBody, version: 1 }), { name: "SignalHouseValidationError", message: /exactly one/ });
		assert.equal(calls.length, 2);
	});

	test(`${name}: capabilities reads with groupId and provider`, async () => {
		const { domain, calls } = setup();
		await domain[m.capabilities]({ groupId: "G0000001", provider: "sinch", channel: "rcs" });
		assert.equal(pathname(calls[0].path), `${base}/capabilities`);
		assert.equal(calls[0].request.method, "GET");
		const expected = { groupId: "G0000001", provider: "sinch" };
		assert.deepEqual(params(calls[0].path), { ...expected, channel: "rcs" });
		await assert.rejects(domain[m.capabilities]({}), /groupId/);
	});

	test(`${name}: uploadMedia posts a FormData with file and groupId through the multipart client`, async () => {
		const { domain, calls } = setup();
		const file = new Blob(["png-bytes"], { type: "image/png" });
		await domain[m.uploadMedia]({ groupId: "G0000001", file, fileName: "hero.png", options: { token: "session", idempotencyKey: "media-1" } });
		assert.equal(calls[0].kind, "multipart");
		assert.equal(calls[0].path, `${base}/media`);
		assert.equal(calls[0].request.method, "POST");
		assert.equal(calls[0].request.token, "session");
		assert.equal(calls[0].request.idempotencyKey, "media-1");
		const form = calls[0].request.body;
		assert.ok(form instanceof FormData);
		assert.deepEqual([...form.keys()], ["file", "groupId"]);
		assert.equal(form.get("groupId"), "G0000001");
		const sentFile = /** @type {File} */ (form.get("file"));
		assert.equal(sentFile.name, "hero.png");
		assert.equal(await sentFile.text(), "png-bytes");
		await assert.rejects(domain[m.uploadMedia]({ groupId: "G0000001" }), /file/);
		await assert.rejects(domain[m.uploadMedia]({ file }), /groupId/);
	});
}

test("over the real client, update keeps tag: null in the JSON and sends the Idempotency-Key header", async () => {
	const sent = [];
	const previous = axios.defaults.adapter;
	axios.defaults.adapter = async (config) => { sent.push(config); return { data: {}, status: 200, statusText: "OK", headers: {}, config }; };
	try {
		const sdk = new SignalHouseSDK({ apiKey: "test", baseUrl: "https://example.invalid" });
		await sdk.templates.update({ templateId: "TPL1", groupId: "G0000001", tag: null, options: { idempotencyKey: "key-1" } });
		assert.deepEqual(JSON.parse(sent[0].data), { groupId: "G0000001", tag: null });
		assert.equal(sent[0].headers["Idempotency-Key"], "key-1");
		assert.equal("idempotencyKey" in sent[0], false);

		await sdk.templates.uploadMedia({ groupId: "G0000001", file: new Blob(["x"]), options: { idempotencyKey: "key-2" } });
		assert.ok(sent[1].data instanceof FormData);
		assert.equal(sent[1].headers["Idempotency-Key"], "key-2");
	} finally {
		axios.defaults.adapter = previous;
	}
});
