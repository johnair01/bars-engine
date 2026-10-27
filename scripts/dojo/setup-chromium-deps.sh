#!/usr/bin/env bash
# Makes Playwright's Chromium runnable on an image without passwordless sudo.
#
# The container has no passwordless sudo and the "no new privileges" flag is
# set, so apt-get install can't be used. We instead download the Ubuntu .deb
# packages for the missing shared libraries and unpack them into
# $HOME/chromium-deps, then point the browser at them with LD_LIBRARY_PATH.
#
#   bash scripts/dojo/setup-chromium-deps.sh
#   export LD_LIBRARY_PATH="$(bash scripts/dojo/setup-chromium-deps.sh --print-path)"
#   node scripts/dojo/test-walk.mjs
#
set -euo pipefail

WORK=/tmp/aptwork
PREFIX="${HOME}/chromium-deps"

PKGS=(
  libnspr4
  libnss3
  libatk1.0-0t64
  libatk-bridge2.0-0t64
  libatspi2.0-0t64
  libxcomposite1
  libxdamage1
  libxfixes3
  libxrandr2
  libxrender1
  libxi6
  libxkbcommon0
  libasound2t64
)

APTOPTS=(
  "-o" "Dir::State::lists=${WORK}/lists"
  "-o" "Dir::Cache=${WORK}/cache"
  "-o" "Dir::State::status=${WORK}/status/status"
  "-o" "Debug::NoLocking=true"
  "-o" "Acquire::Languages=none"
)

mkdir -p "${WORK}/lists/partial" "${WORK}/cache/archives/partial" "${WORK}/status" "${PREFIX}"
: > "${WORK}/status/status"

apt-get "${APTOPTS[@]}" update -qq
cd "${WORK}"
apt-get "${APTOPTS[@]}" download "${PKGS[@]}"

# The packages are globbed as *.deb in the work directory. "${PKGS[@]}"*.deb
# attaches the suffix to the last element only, which unpacked just
# libasound2t64 and left Chromium unable to start (libnspr4.so missing).
for deb in *.deb; do
  [ -e "${deb}" ] && dpkg-deb -x "${deb}" "${PREFIX}"
done

LIBPATH="$(find "${PREFIX}" -type d -name x86_64-linux-gnu | tr '\n' ':')"

if [ "${1:-}" = "--print-path" ]; then
  printf '%s\n' "${LIBPATH}"
  exit 0
fi

echo "Libraries unpacked under ${PREFIX}"
echo "Run the walk test with:"
echo "  export LD_LIBRARY_PATH=\"${LIBPATH}\""
echo "  node scripts/dojo/test-walk.mjs"
