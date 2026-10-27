#!/usr/bin/env node
/**
 * Place the bundled Signal House skills where a coding agent will find them.
 *
 * Runs as the package postinstall, and also by hand as `npx signalhouse-skills`.
 *
 * A postinstall that writes outside its own package is intrusive, so this one is deliberately
 * narrow:
 *
 * - PROJECT scope only. It writes to `<project>/.claude/skills/` and `<project>/.agents/skills/`,
 *   never to the home directory. A dependency install must not modify a developer's global agent
 *   configuration.
 * - It only acts when the project ALREADY uses one of those agent directories, so installing the
 *   SDK into a project that has never heard of agent skills changes nothing. Set
 *   SIGNALHOUSE_SKILLS=1 to install anyway.
 * - It is skipped entirely in CI, and by SIGNALHOUSE_SKILLS=0.
 * - It never overwrites a file whose content differs from what a previous run wrote. An edited
 *   skill is the developer's, and silently replacing it on the next `npm update` would be a bug.
 * - It always exits 0. Nothing here is important enough to fail somebody's install.
 *
 * The skills themselves are bundled in the package (see scripts/sync-skills.mjs), so this does no
 * network access and works offline.
 */

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, "..");
const BUNDLED = join(PKG_ROOT, "skills");

// Project-scope paths, taken from the `skills` CLI's own agent table (vercel-labs/skills).
// Claude Code reads .claude/skills/; Cursor and GitHub Copilot both read .agents/skills/.
const AGENT_DIRS = [
	{ marker: ".claude", dest: join(".claude", "skills"), label: "Claude Code" },
	{ marker: ".agents", dest: join(".agents", "skills"), label: "Cursor / Copilot" },
];

const RECEIPT = ".signalhouse-skills.json";

/**
 * sha256 of a file, as hex.
 *
 * @param {string} path - Absolute file path.
 * @returns {string} - Hex digest.
 */
function sha256(path) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Every file under a directory, relative to it.
 *
 * @param {string} root - Directory to walk.
 * @param {string} [prefix=""] - Accumulated relative prefix.
 * @returns {string[]} - Relative file paths.
 */
function walk(root, prefix = "") {
	const out = [];
	for (const entry of readdirSync(join(root, prefix))) {
		const rel = prefix ? join(prefix, entry) : entry;
		if (statSync(join(root, rel)).isDirectory()) out.push(...walk(root, rel));
		else out.push(rel);
	}
	return out;
}

/** True when npm is running this as the package's postinstall rather than a user invoking the bin. */
const IS_POSTINSTALL = process.env.npm_lifecycle_event === "postinstall";

/**
 * Locate the project to install into.
 *
 * The two entry points need different answers, and conflating them is why the bin used to do
 * nothing:
 *
 * - As a POSTINSTALL, the only trustworthy signal is INIT_CWD, which npm sets to the directory the
 *   install was started from. `process.cwd()` during a lifecycle script is the package's own
 *   directory inside node_modules, so falling back to it would write skills into node_modules.
 *   Absent INIT_CWD there is no safe guess, so it does nothing.
 * - As the BIN (`npx signalhouse-skills`), npm sets no INIT_CWD, and the user is standing in the
 *   project they mean. `process.cwd()` is exactly right.
 *
 * @param {string|null} [override=null] - Explicit --path argument, which always wins.
 * @returns {string|null} - Absolute project path, or null when it cannot be determined safely.
 */
function findProjectRoot(override = null) {
	if (override) return resolve(override);

	if (!IS_POSTINSTALL) return process.cwd();

	const initCwd = process.env.INIT_CWD;
	if (!initCwd) return null;
	const resolved = resolve(initCwd);
	if (resolved === PKG_ROOT) return null;
	// Split on the separator rather than a substring match, so a project living under a directory
	// merely NAMED something like "my-node_modules-tools" is not mistaken for a nested install.
	if (resolved.split(sep).includes("node_modules")) return null;
	return resolved;
}

/**
 * True when a path really lands inside the project, following symlinks.
 *
 * `resolve()` only normalises text, so it cannot see that `.claude` is a symlink to somewhere else.
 * A project that symlinks its agent directory to a shared or home-directory config is a normal
 * setup, and without this check a dependency's postinstall would write straight through it -
 * exactly the "never outside the project, never your home directory" promise this script makes.
 *
 * realpathSync needs an existing path, so this walks up to the nearest ancestor that exists and
 * resolves that instead.
 *
 * @param {string} projectRoot - Absolute project path.
 * @param {string} candidate - Absolute path the installer wants to write under.
 * @returns {boolean} - Whether the real destination is contained by the real project root.
 */
function resolvesInsideProject(projectRoot, candidate) {
	let probe = candidate;
	while (!existsSync(probe)) {
		const parent = dirname(probe);
		if (parent === probe) return false;
		probe = parent;
	}
	try {
		const realProbe = realpathSync(probe);
		const realRoot = realpathSync(projectRoot);
		return realProbe === realRoot || realProbe.startsWith(realRoot + sep);
	} catch {
		return false;
	}
}

/**
 * Install the bundled skills into one agent directory.
 *
 * @param {string} projectRoot - Absolute project path.
 * @param {{marker: string, dest: string, label: string}} agent - Target agent directory.
 * @param {Object} receipt - Path-to-hash map written by the previous run, empty on first install.
 * @returns {{written: string[], skipped: string[], target: string}} - What changed.
 */
function installTo(projectRoot, agent, receipt) {
	const target = join(projectRoot, agent.dest);
	const written = [];
	const skipped = [];

	for (const skill of readdirSync(BUNDLED)) {
		const skillDir = join(BUNDLED, skill);
		if (!statSync(skillDir).isDirectory()) continue;

		for (const rel of walk(skillDir)) {
			const src = join(skillDir, rel);
			const dst = join(target, skill, rel);
			const key = join(agent.dest, skill, rel);

			if (existsSync(dst)) {
				const current = sha256(dst);
				if (current === sha256(src)) continue;
				// Present, different, and not what we last wrote: the developer edited it. Leave it.
				// An absent receipt entry reads the same way, since we cannot claim we wrote it.
				if (receipt[key] !== current) {
					skipped.push(join(skill, rel));
					continue;
				}
			}

			mkdirSync(dirname(dst), { recursive: true });
			copyFileSync(src, dst);
			receipt[key] = sha256(dst);
			written.push(join(skill, rel));
		}
	}

	return { written, skipped, target };
}

/**
 * True when a receipt key must never be turned into a filesystem path.
 *
 * @param {string} key - Receipt key, expected to be a project-relative path we wrote.
 * @returns {boolean} - Whether the key is absolute or contains a parent-directory segment.
 */
function isUnsafeKey(key) {
	if (typeof key !== "string" || !key) return true;
	if (isAbsolute(key)) return true;
	return key.split(/[\\/]/).includes("..");
}

/**
 * Remove skill files a previous run wrote that the current bundle no longer contains.
 *
 * Upgrades are otherwise additive: a file dropped or renamed upstream stays on disk forever and
 * keeps feeding an agent instructions the release deliberately withdrew. The receipt records exactly
 * what we wrote, so a file whose hash still matches its receipt entry is provably ours and
 * unmodified, and only those are removed. A developer's edit is reported instead, never deleted.
 *
 * @param {string} projectRoot - Absolute project path.
 * @param {Object} receipt - Path-to-hash map from the previous run, mutated in place.
 * @param {Set<string>} currentKeys - Receipt keys the current bundle just wrote or verified.
 * @returns {{removed: string[], orphaned: string[], refused: string[]}} - Deleted paths, stale ones
 *   left alone, and entries refused as unsafe.
 */
function pruneObsolete(projectRoot, receipt, currentKeys) {
	const removed = [];
	const orphaned = [];
	const refused = [];

	for (const key of Object.keys(receipt)) {
		if (key === "_ref" || currentKeys.has(key)) continue;
		const dst = join(projectRoot, key);
		// The receipt is a file on disk, so its keys are untrusted input to a delete. A key that is
		// absolute or climbs out with `..` would aim rmSync at something we never wrote. Such an
		// entry is dropped, never followed: there is no honest reading of it.
		if (isUnsafeKey(key) || !resolvesInsideProject(projectRoot, dst)) {
			delete receipt[key];
			refused.push(key);
			continue;
		}
		if (!existsSync(dst)) {
			delete receipt[key];
			continue;
		}
		if (sha256(dst) !== receipt[key]) {
			orphaned.push(key);
			continue;
		}
		rmSync(dst);
		delete receipt[key];
		removed.push(key);
	}

	return { removed, orphaned, refused };
}

try {
	const args = process.argv.slice(2);
	const pathArg = args.includes("--path") ? args[args.indexOf("--path") + 1] : null;
	// An explicit --force, and an explicit run of the bin at all, are the user asking for this.
	// A postinstall is not, so it stays conservative.
	const forced = args.includes("--force") || process.env.SIGNALHOUSE_SKILLS === "1";

	if (process.env.SIGNALHOUSE_SKILLS === "0") process.exit(0);
	// CI skipping applies to the unattended path. Someone typing the command in CI means it.
	if (IS_POSTINSTALL && process.env.CI && !forced) process.exit(0);
	// An INSTALLED copy of this package always lives under node_modules. When it does not, this is
	// a source checkout, so the postinstall is skipped. Running the bin by hand from a checkout is
	// still allowed, because that is somebody asking for it.
	if (IS_POSTINSTALL && !PKG_ROOT.split(sep).includes("node_modules")) process.exit(0);
	if (!existsSync(BUNDLED)) process.exit(0);

	const projectRoot = findProjectRoot(pathArg);
	if (!projectRoot) process.exit(0);
	const candidates = AGENT_DIRS.filter((a) => forced || existsSync(join(projectRoot, a.marker)));
	// A marker that resolves outside the project is skipped rather than followed. Silently writing
	// through it would break the guarantee at the top of this file.
	const targets = candidates.filter((a) => {
		if (resolvesInsideProject(projectRoot, join(projectRoot, a.dest))) return true;
		console.log(`Skipping ${a.label}: ${a.dest} resolves outside this project.`);
		return false;
	});

	if (targets.length === 0) {
		const vendored = JSON.parse(readFileSync(join(BUNDLED, "VENDORED.json"), "utf8"));
		// The advice has to differ by how we were invoked. Telling someone who just RAN this command
		// to run it again is a loop; they need --force. A postinstall is not a request, so it only
		// mentions the command exists.
		const advice = IS_POSTINSTALL
			? "Run `npx signalhouse-skills --force` to install them into this project."
			: `No agent directory found in ${projectRoot}. Re-run with --force to create one.`;
		console.log(
			`\n@signalhouse-sms/sdk bundles ${vendored.skills.length} agent skills ` +
				`(${vendored.skills.join(", ")}).\n${advice}\n`,
		);
		process.exit(0);
	}

	const receiptPath = join(projectRoot, RECEIPT);
	const receipt = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, "utf8")) : {};
	const previousRef = receipt._ref ?? null;
	const vendored = JSON.parse(readFileSync(join(BUNDLED, "VENDORED.json"), "utf8"));

	let totalWritten = 0;
	const allSkipped = new Set();
	const labels = [];

	const currentKeys = new Set();
	for (const agent of targets) {
		const { written, skipped } = installTo(projectRoot, agent, receipt);
		totalWritten += written.length;
		for (const s of skipped) allSkipped.add(s);
		if (written.length > 0) labels.push(agent.label);
		for (const skill of readdirSync(BUNDLED)) {
			const skillDir = join(BUNDLED, skill);
			if (!statSync(skillDir).isDirectory()) continue;
			for (const rel of walk(skillDir)) currentKeys.add(join(agent.dest, skill, rel));
		}
	}

	const { removed, orphaned, refused } = pruneObsolete(projectRoot, receipt, currentKeys);
	if (removed.length) console.log(`Removed ${removed.length} skill file(s) withdrawn upstream.`);
	if (orphaned.length) console.log(`Left ${orphaned.length} edited file(s) no longer bundled: ${orphaned.join(", ")}`);
	if (refused.length) console.log(`Ignored ${refused.length} receipt entr(ies) pointing outside this project.`);

	receipt._ref = vendored.ref;
	writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);

	// The version notification: say what moved, not just that something did. On a first install
	// that is the skill list; on an upgrade it is the ref it moved from.
	if (totalWritten > 0) {
		const moved = previousRef && previousRef !== vendored.ref
			? `updated ${previousRef} -> ${vendored.ref}`
			: `installed ${vendored.ref}`;
		console.log(`\nSignal House agent skills ${moved} for ${labels.join(" and ")}.`);
		console.log(`  ${vendored.skills.join(", ")}`);
	}

	if (allSkipped.size > 0) {
		console.log(`  Left ${allSkipped.size} locally modified file(s) alone: ${[...allSkipped].join(", ")}`);
	}
	if (totalWritten > 0 || allSkipped.size > 0) console.log("");
} catch (error) {
	// Never fail an install over this.
	if (process.env.SIGNALHOUSE_SKILLS_DEBUG) console.error(error);
}

process.exit(0);
