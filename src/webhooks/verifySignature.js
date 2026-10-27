import crypto from "node:crypto";

// Node-only helpers for receiving Signal House webhooks. Kept out of the main entry point,
// which also runs in browsers, because it depends on node:crypto. Import from "@signalhouse-sms/sdk/webhooks".

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Verify that a webhook delivery came from Signal House and is recent.
 *
 * Checks `X-SignalHouse-Signature-V1` (`t=<ms>,v1=<hex>[,v1=<hex>]`, which carries every currently valid
 * signature during a secret rotation) when present, otherwise the original `X-SignalHouse-Signature` +
 * `X-SignalHouse-Timestamp` pair. Each signature is a hex HMAC-SHA256 of `${timestamp}.${rawBody}`. Comparisons
 * are constant-time.
 *
 * @param {Object} params
 * @param {string|Buffer} params.rawBody - The exact request body as received, before any JSON parsing.
 * @param {Object} params.headers - Request headers (any casing; e.g. Express `req.headers`).
 * @param {string} [params.secret] - Your endpoint's signing secret.
 * @param {string[]} [params.secrets] - Several secrets to accept, e.g. old and new while you roll over.
 * @param {number} [params.toleranceMs=300000] - Reject deliveries whose timestamp is further than this from now.
 * @param {number} [params.now=Date.now()] - Current time in ms (for tests).
 * @returns {{valid: boolean, reason?: string}} - `valid` true when a signature matches within the time window;
 *   otherwise `reason` is one of `no_secret`, `no_signature`, `bad_timestamp`, `stale_timestamp`, `bad_signature`.
 */
export function verifyWebhookSignature({ rawBody, headers, secret, secrets, toleranceMs = DEFAULT_TOLERANCE_MS, now = Date.now() }) {
	const candidates = (secrets ?? (secret ? [secret] : [])).filter(Boolean);
	if (candidates.length === 0) return { valid: false, reason: "no_secret" };

	const header = (name) => {
		if (!headers) return undefined;
		const match = Object.keys(headers).find((key) => key.toLowerCase() === name);
		const value = match === undefined ? undefined : headers[match];
		return Array.isArray(value) ? value[0] : value;
	};

	let timestamp;
	let signatures = [];
	const v1 = header("x-signalhouse-signature-v1");
	if (v1) {
		const parts = String(v1).split(",").map((part) => part.trim());
		timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
		signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3)).filter(Boolean);
	}
	// No usable V1 (absent, or mangled by an intermediary): fall back to the original header pair
	if (signatures.length === 0) {
		timestamp = header("x-signalhouse-timestamp");
		const legacy = header("x-signalhouse-signature");
		signatures = legacy ? [String(legacy)] : [];
	}
	if (signatures.length === 0) return { valid: false, reason: "no_signature" };

	const sentAt = Number(timestamp);
	if (!timestamp || !Number.isFinite(sentAt)) return { valid: false, reason: "bad_timestamp" };
	if (Math.abs(now - sentAt) > toleranceMs) return { valid: false, reason: "stale_timestamp" };

	const body = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody ?? "");
	for (const candidate of candidates) {
		const expected = Buffer.from(crypto.createHmac("sha256", candidate).update(`${timestamp}.${body}`).digest("hex"), "utf8");
		for (const signature of signatures) {
			const given = Buffer.from(signature, "utf8");
			if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) return { valid: true };
		}
	}
	return { valid: false, reason: "bad_signature" };
}
