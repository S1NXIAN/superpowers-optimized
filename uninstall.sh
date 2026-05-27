#!/usr/bin/env bash
# ===========================================================================
# Superpowers Enhanced — one-liner uninstaller (Bash)
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.sh)
#
# What it does:
#   1. Checks Node.js is available
#   2. Downloads the repo as a tarball (no git required)
#   3. Runs uninstall.mjs --force
#   4. Cleans up the temp directory
# ===========================================================================

set -euo pipefail

REPO="S1NXIAN/superpowers-enhanced"
BRANCH="main"
TARBALL_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz"

# ---------------------------------------------------------------------------
# Terminal styling
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  BOLD='\033[1m'; DIM='\033[2m'; RED='\033[0;31m'
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
  NC='\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

info()  { echo -e "  ${BLUE}\u2022${NC} $1"; }
ok()    { echo -e "  ${GREEN}\u2713${NC} $1"; }
warn()  { echo -e "  ${YELLOW}\u26A0${NC} $1"; }
fail()  { echo -e "  ${RED}\u2717${NC} $1"; }
header(){ echo -e "\n${BOLD}$1${NC}"; }

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
TMPDIR=""
cleanup() {
  if [[ -n "$TMPDIR" && -d "$TMPDIR" ]]; then
    rm -rf "$TMPDIR"
  fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
setup_downloader() {
  if command -v curl &>/dev/null; then
    DOWNLOAD="curl"
  elif command -v wget &>/dev/null; then
    DOWNLOAD="wget"
  else
    fail "curl or wget is required but neither was found."
    exit 1
  fi
}

download_file() {
  local url="$1" dest="$2"
  if [[ "$DOWNLOAD" == "curl" ]]; then
    curl -fsSL "$url" -o "$dest"
  else
    wget -q "$url" -O "$dest"
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
header "Superpowers Enhanced — quick uninstaller"
echo ""

# Check Node.js
if command -v node &>/dev/null; then
  ok "Node.js found: $(node --version)"
else
  fail "Node.js is required. Install it from https://nodejs.org/ and try again."
  exit 1
fi

setup_downloader
ok "${DOWNLOAD} found"

# Ensure temp dir
TMPDIR="$(mktemp -d)" || { fail "Failed to create temporary directory."; exit 1; }

# Download
header "Downloading"
TARBALL="${TMPDIR}/repo.tar.gz"
info "Fetching ${REPO}@${BRANCH}..."
download_file "$TARBALL_URL" "$TARBALL"
ok "Downloaded tarball"

# Extract
tar -xzf "$TARBALL" -C "$TMPDIR"
EXTRACTED="${TMPDIR}/superpowers-enhanced-${BRANCH}"
if [[ ! -d "$EXTRACTED" ]]; then
  EXTRACTED="$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d -name "superpowers*" | head -1)"
fi
if [[ ! -f "${EXTRACTED}/uninstall.mjs" ]]; then
  fail "uninstall.mjs not found in downloaded archive."
  exit 1
fi
ok "Extracted to temp directory"

# Run uninstall
header "Uninstalling"
echo ""
node "${EXTRACTED}/uninstall.mjs" --force

echo ""
ok "Uninstall complete."
