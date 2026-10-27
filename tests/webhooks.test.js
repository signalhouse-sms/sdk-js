import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyWebhookSignature } from "../src/webhooks/verifySignature.js";
import { Webhooks } from "../src/domains/Webhooks.js";

const NOW = 1_790_000_000_000;
const body = JSON.stringify({ event: "SMS_SENT", identifier: "m1" });
const sign = (secret, ts, raw = body) => crypto.createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex");

test("accepts the original single-secret headers", () => {
	const ts = String(NOW);
	const headers = { "X-SignalHouse-Timestamp": ts, "X-SignalHouse-Signature": sign("s1", ts) };
	assert.deepEqual(verifyWebhookSignature({ rawBody: body, headers, secret: "s1", now: NOW }), { valid: true });
});

test("prefers the V1 header and accepts either secret during a rotation", () => {
	const ts = String(NOW);
	const headers = {
		"x-signalhouse-timestamp": ts,
		"x-signalhouse-signature": sign("new", ts),
		"x-signalhouse-signature-v1": `t=${ts},v1=${sign("new", ts)},v1=${sign("old", ts)}`,
	};
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, secret: "old", now: NOW }).valid, true);
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, secret: "new", now: NOW }).valid, true);
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, secrets: ["other", "new"], now: NOW }).valid, true);
	assert.deepEqual(verifyWebhookSignature({ rawBody: body, headers, secret: "wrong", now: NOW }), { valid: false, reason: "bad_signature" });
});

test("rejects a tampered body, a stale timestamp, and missing pieces", () => {
	const ts = String(NOW);
	const headers = { "x-signalhouse-timestamp": ts, "x-signalhouse-signature": sign("s1", ts) };
	assert.equal(verifyWebhookSignature({ rawBody: body + " ", headers, secret: "s1", now: NOW }).reason, "bad_signature");
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, secret: "s1", now: NOW + 5 * 60 * 1000 + 1 }).reason, "stale_timestamp");
	assert.equal(verifyWebhookSignature({ rawBody: body, headers: {}, secret: "s1", now: NOW }).reason, "no_signature");
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, now: NOW }).reason, "no_secret");
	assert.equal(verifyWebhookSignature({ rawBody: body, headers: { "x-signalhouse-signature": "ab" }, secret: "s1", now: NOW }).reason, "bad_timestamp");
});

test("accepts a Buffer body and array header values", () => {
	const ts = String(NOW);
	const headers = { "x-signalhouse-timestamp": [ts], "x-signalhouse-signature": [sign("s1", ts)] };
	assert.equal(verifyWebhookSignature({ rawBody: Buffer.from(body), headers, secret: "s1", now: NOW }).valid, true);
});

test("rotateWebhookSecret posts to the rotate endpoint with the grace window", async () => {
	const calls = [];
	const client = async (path, request) => { calls.push({ path, request }); return { success: true }; };
	client._require = () => {};
	const webhooks = new Webhooks(client);
	await webhooks.rotateWebhookSecret({ id: "abc/1", graceSeconds: 0, options: { token: "t" } });
	await webhooks.rotateWebhookSecret({ id: "abc" });
	assert.deepEqual(calls, [
		{ path: "/webhook/abc%2F1/rotate-secret", request: { method: "POST", body: { graceSeconds: 0 }, token: "t" } },
		{ path: "/webhook/abc/rotate-secret", request: { method: "POST", body: {} } },
	]);
});

test("a V1 header with no signatures falls back to the original header", () => {
	const ts = String(NOW);
	const headers = { "x-signalhouse-timestamp": ts, "x-signalhouse-signature": sign("s1", ts), "x-signalhouse-signature-v1": `t=${ts}` };
	assert.equal(verifyWebhookSignature({ rawBody: body, headers, secret: "s1", now: NOW }).valid, true);
});
