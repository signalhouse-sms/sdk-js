#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SDK=javascript

# >>> version-files (S3; must match versionFiles("javascript") in ci/sdk-mirror/set-version.mjs)
VERSION_FILES=(
	package.json
	package-lock.json
	legacy/package.json
)
# <<< version-files

fail() { echo "::error::$SDK: $1" >&2; exit 1; }
check() { local name=$1; shift; "$@" || fail "$name"; }

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT

# Prints "<file> <field> <value>" per version field.
read_versions() {
	local f
	for f in "${VERSION_FILES[@]}"; do
		case $f in
			package.json) node -p "'$f version '+require('./$f').version" ;;
			package-lock.json) node -p "const l=require('./$f'); '$f version '+l.version+'\n$f packages[\"\"].version '+l.packages[''].version" ;;
			legacy/package.json) node -p "const p=require('./$f'); '$f version '+p.version+'\n$f dependencies[@signalhouse-sms/sdk] '+p.dependencies['@signalhouse-sms/sdk']" ;;
			*) fail "version-files: no reader for $f" ;;
		esac
	done
}

check_versions() {
	local lines want
	lines=$(read_versions) || return 1
	want=${EXPECTED_VERSION:-$(head -1 <<<"$lines" | awk '{print $NF}')}
	echo "$lines" | awk -v want="$want" '$NF != want { print "  " $0 " != " want; bad=1 } END { exit bad }'
}

check_legacy_readme() {
	cmp -s LEGACY_README.md <(cat LEGACY_NOTICE.md README.md) && cmp -s legacy/README.md LEGACY_NOTICE.md
}

# npm pack --dry-run lists exactly the publishable files.
check_pack_list() {
	npm pack --dry-run --json --ignore-scripts >"$T/pack.json" 2>/dev/null || return 1
	node -e '
		const files = require(process.argv[1])[0].files.map((f) => f.path);
		const need = ["types/SignalHouseSDK.d.ts", "types/domains/voice/browser/index.d.ts", "types/webhooks/verifySignature.d.ts", "scripts/install-skills.mjs", "README.md", "package.json"];
		const missing = need.filter((n) => !files.includes(n));
		for (const dir of ["src/", "skills/"]) if (!files.some((f) => f.startsWith(dir))) missing.push(dir);
		const banned = files.filter((f) => /^(legacy|ci|\.github)\//.test(f) || /^LEGACY_.*\.md$/.test(f));
		const stray = files.filter((f) => !/^(src|types|skills)\//.test(f) && !["scripts/install-skills.mjs", "README.md", "package.json"].includes(f));
		if (missing.length || banned.length || stray.length) {
			console.error("  missing:", missing, "banned:", banned, "stray:", stray);
			process.exit(1);
		}
	' "$T/pack.json"
}

# Type-checks the packed tarball as a consumer would, under both module resolutions.
check_consumer_types() {
	local tgz ts tsc
	tsc=$PWD/node_modules/.bin/tsc
	mkdir -p "$T/pack" "$T/ts"
	tgz=$(npm pack --silent --ignore-scripts --pack-destination "$T/pack") || return 1
	ts=$T/ts
	echo '{"name":"ts-consumer","private":true,"type":"module"}' >"$ts/package.json"
	(cd "$ts" && npm install --no-save --ignore-scripts --no-audit --no-fund --loglevel=error "$T/pack/$tgz" jssip@3.13.8 @types/node@22 >/dev/null) || return 1
	cat >"$ts/check.mts" <<-'EOF'
		import { SignalHouseSDK } from "@signalhouse-sms/sdk";
		import { verifyWebhookSignature } from "@signalhouse-sms/sdk/webhooks";
		import { Device, Call } from "@signalhouse-sms/sdk/voice-browser";
		const sdk = new SignalHouseSDK({ apiKey: "x", baseUrl: "http://127.0.0.1:9" });
		// @ts-expect-error not a method
		sdk.notARealMethod();
		export const used = [sdk, verifyWebhookSignature, Device, Call];
	EOF
	(cd "$ts" && "$tsc" --noEmit --strict --skipLibCheck --target es2022 --types node --module nodenext --moduleResolution nodenext check.mts) || return 1
	(cd "$ts" && "$tsc" --noEmit --strict --skipLibCheck --target es2022 --types node --module esnext --moduleResolution bundler check.mts) || return 1
}

check_smoke() {
	node --input-type=module -e "import { SignalHouseSDK } from './src/SignalHouseSDK.js'; new SignalHouseSDK({ apiKey: 'x', baseUrl: 'http://127.0.0.1:9' })"
}

# Root + legacy tarballs (+ the jssip peer) install together; every subpath imports; one DeprecationWarning.
check_shim() {
	local root legacy d=$T/shim warnings
	mkdir -p "$d/pack"
	root=$(npm pack --silent --ignore-scripts --pack-destination "$d/pack") || return 1
	legacy=$(cd legacy && npm pack --silent --ignore-scripts --pack-destination "$d/pack") || return 1
	echo '{"name":"shim-consumer","private":true,"type":"module"}' >"$d/package.json"
	(cd "$d" && npm install --no-save --ignore-scripts --no-audit --no-fund --loglevel=error "./pack/$root" "./pack/$legacy" jssip@3.13.8 >/dev/null) || return 1
	(cd "$d" && node --input-type=module -e '
		await import("@signalhousellc/sdk");
		await import("@signalhousellc/sdk/webhooks");
		await import("@signalhousellc/sdk/voice-browser");
		const m = await import("@signalhousellc/sdk");
		if (typeof m.SignalHouseSDK !== "function") process.exit(1);
	' 2>"$d/stderr") || { cat "$d/stderr" >&2; return 1; }
	warnings=$(grep -c 'DeprecationWarning' "$d/stderr" || true)
	[ "$warnings" -eq 1 ] || { echo "  expected 1 DeprecationWarning, got $warnings" >&2; cat "$d/stderr" >&2; return 1; }
}

echo "== $SDK: versions"; check versions check_versions
echo "== $SDK: legacy readme"; check legacy-readme check_legacy_readme
# --prefix keeps npm from resolving the monorepo workspace root.
echo "== $SDK: npm ci"; check "npm ci" npm ci --prefix "$PWD" --no-audit --no-fund --loglevel=error
echo "== $SDK: check:types"; check check:types npm run --silent check:types
echo "== $SDK: build:types"; check build:types npm run --silent build:types
echo "== $SDK: tests"; check tests node --test 'tests/*.test.js'
echo "== $SDK: pack list"; check "pack list" check_pack_list
echo "== $SDK: consumer types"; check "consumer types" check_consumer_types
echo "== $SDK: smoke"; check smoke check_smoke
echo "== $SDK: shim"; check shim check_shim
echo "gate passed: $SDK"
