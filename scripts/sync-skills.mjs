#!/usr/bin/env node
/**
 * Regenerate the vendored copy of the Signal House agent skills.
 *
 * The agent-skills repo is the single source of truth. This SDK ships a VENDORED copy so that
 * `npm install` needs no network and works in an offline or locked-down CI, but a vendored copy is
 * only safe while it is generated rather than hand-edited. Everything under skills/ is written by
 * this script and should never be edited in place: the next sync silently discards the edit.
 *
 * Usage:
 *   node scripts/sync-skills.mjs --from ../../../agent-skills --ref v0.2.0
 *   node scripts/sync-skills.mjs --from <agent-skills git URL> --ref v0.2.0
 *
 * Writes skills/VENDORED.json recording the ref, and a sha256 per file. The installer
 * reads those hashes to tell an unmodified skill from one the developer has edited.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = resolve(HERE, "..");
const DEST = join(SDK_ROOT, "skills");

/**
 * Read `--name value` pairs off the command line.
 *
 * @param {string[]} argv - Raw process arguments.
 * @returns {Object} - Parsed flags keyed without the leading dashes.
 */
function parseArgs(argv) {
	const out = {};
	for (let i = 0; i < argv.length; i += 2) {
		if (!argv[i]?.startsWith("--")) continue;
		out[argv[i].slice(2)] = argv[i + 1];
	}
	return out;
}

/**
 * Every file under a directory, as paths relative to it.
 *
 * @param {string} root - Directory to walk.
 * @param {string} [prefix=""] - Accumulated relative prefix, used by the recursion.
 * @returns {string[]} - Relative file paths, sorted for a stable manifest.
 */
function walk(root, prefix = "") {
	const out = [];
	for (const entry of readdirSync(join(root, prefix))) {
		const rel = prefix ? join(prefix, entry) : entry;
		if (statSync(join(root, rel)).isDirectory()) out.push(...walk(root, rel));
		else out.push(rel);
	}
	return out.sort();
}

/**
 * sha256 of a file, as hex.
 *
 * @param {string} path - Absolute file path.
 * @returns {string} - Hex digest.
 */
function sha256(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const args = parseArgs(process.argv.slice(2));
const from = args.from;
const ref = args.ref;

if (!from || !ref) {
	console.error("usage: node scripts/sync-skills.mjs --from <path-or-git-url> --ref <tag>");
	console.error("\nBoth are required. --ref is recorded in the manifest and is what makes the");
	console.error("vendored copy traceable back to a release of the agent-skills repo.");
	process.exit(1);
}

let sourceRoot;
let checkout = null;

if (from.startsWith("http") || from.startsWith("git@")) {
	checkout = mkdtempSync(join(tmpdir(), "sh-skills-"));
	execFileSync("git", ["clone", "--quiet", "--depth", "1", "--branch", ref, from, checkout], { stdio: "inherit" });
	sourceRoot = checkout;
} else {
	sourceRoot = resolve(SDK_ROOT, from);
	// A local checkout is a convenience for authoring, so confirm it is actually AT the ref being
	// recorded. Recording a tag while copying whatever happened to be checked out is how a vendored
	// copy starts lying about its provenance.
	const head = execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
	let refCommit = null;
	try {
		refCommit = execFileSync("git", ["-C", sourceRoot, "rev-parse", `${ref}^{commit}`], { encoding: "utf8" }).trim();
	} catch {
		console.error(`✗ ${sourceRoot} has no ref "${ref}". Tag the release first, then sync.`);
		process.exit(1);
	}
	if (head !== refCommit) {
		console.error(`✗ ${sourceRoot} is at ${head.slice(0, 8)}, not ${ref} (${refCommit.slice(0, 8)}).`);
		console.error("  Check the source out at the ref you are vendoring.");
		process.exit(1);
	}
}

const skillsSrc = join(sourceRoot, "skills");
if (!existsSync(skillsSrc)) {
	console.error(`✗ no skills/ directory in ${sourceRoot}`);
	process.exit(1);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

const names = readdirSync(skillsSrc).filter((e) => statSync(join(skillsSrc, e)).isDirectory()).sort();
for (const name of names) cpSync(join(skillsSrc, name), join(DEST, name), { recursive: true });

const files = {};
for (const name of names) {
	for (const rel of walk(join(DEST, name))) {
		files[`${name}/${rel}`] = sha256(join(DEST, name, rel));
	}
}

writeFileSync(
	join(DEST, "VENDORED.json"),
	`${JSON.stringify({ source: "agent-skills", ref, skills: names, files }, null, 2)}\n`,
);

if (checkout) rmSync(checkout, { recursive: true, force: true });

console.log(`✓ vendored ${names.length} skill(s) at ${ref}: ${names.join(", ")}`);
console.log(`  ${relative(SDK_ROOT, DEST)}/ is generated. Do not edit it by hand.`);
