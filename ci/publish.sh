#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SDK=javascript
fail() { echo "::error::$SDK: $1" >&2; exit 1; }
run() { if [ "${PUBLISH_DRY_RUN:-}" = 1 ]; then printf '+ (dry run) would run:'; printf ' %q' "$@"; echo; else "$@"; fi; }

# Exit 0 = published, 1 = absent; anything else fails.
published() {
	local out
	if out=$(npm view "$1@$2" version 2>&1); then
		[ "$out" = "$2" ]
	elif grep -q 'E404' <<<"$out"; then
		return 1
	else
		echo "$out" >&2; fail "registry check $1@$2"
	fi
}

V=$(node -p "require('./package.json').version")
[ "$(node -p "require('./legacy/package.json').version")" = "$V" ] || fail "legacy version differs from $V"
PROVENANCE=()
[ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] && PROVENANCE=(--provenance)

# npm answers 409 "previously staged version" for a publish it accepted but has not made visible yet; that is success.
publish_npm() {
	local out
	if out=$(run npm publish --access public "$@" 2>&1); then printf '%s\n' "$out"; return 0; fi
	printf '%s\n' "$out" >&2
	grep -q "previously staged version \"$V\"" <<<"$out" && { echo "$V is staged on npm, skipping"; return 0; }
	return 1
}

if published @signalhouse-sms/sdk "$V"; then
	echo "@signalhouse-sms/sdk@$V exists, skipping"
else
	run npm ci --prefix "$PWD" --no-audit --no-fund || fail "npm ci"
	run npm run build:types || fail "build:types"
	publish_npm ${PROVENANCE[@]+"${PROVENANCE[@]}"} || fail "npm publish @signalhouse-sms/sdk"
fi

if published @signalhousellc/sdk "$V"; then
	echo "@signalhousellc/sdk@$V exists, skipping"
else
	# The legacy scope has no trusted publisher: it publishes with a granular token when one is set.
	LEGACY_CONFIG=()
	if [ -n "${NPM_LEGACY_TOKEN:-}" ]; then
		NPMRC=$(mktemp)
		trap 'rm -f "$NPMRC"' EXIT
		printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_LEGACY_TOKEN" >"$NPMRC"
		LEGACY_CONFIG=(--userconfig "$NPMRC")
	fi
	(cd legacy && publish_npm ${LEGACY_CONFIG[@]+"${LEGACY_CONFIG[@]}"} ${PROVENANCE[@]+"${PROVENANCE[@]}"}) || fail "npm publish @signalhousellc/sdk"
fi
