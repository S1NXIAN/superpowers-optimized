#!/usr/bin/env bash
# ===========================================================================
# opencode-zeus — one-liner installer
#
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/install.sh)
#
# What it does:
#   1. Detects OS and installs Node.js if missing
#   2. Downloads the repo as a tarball (no git required)
#   3. Runs bin/setup.mjs --force
#   4. Cleans up the temp directory
#
# Supports: Linux (apt, dnf, yum, pacman, zypper, apk), macOS (brew).
#           Falls back to downloading Node.js directly from nodejs.org.
# ===========================================================================

set -euo pipefail

REPO="S1NXIAN/opencode-zeus"
BRANCH="main"
TARBALL_URL="https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz"
NODE_VERSION_FALLBACK="v22.16.0"

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

info()  { echo -e "  ${BLUE}•${NC} $1"; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
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
# OS detection
# ---------------------------------------------------------------------------
detect_os() {
  local uname_s
  uname_s="$(uname -s 2>/dev/null || echo "Unknown")"
  case "$uname_s" in
    Linux*)   echo "linux" ;;
    Darwin*)  echo "macos" ;;
    *)        echo "unknown" ;;
  esac
}

detect_arch() {
  local uname_m
  uname_m="$(uname -m 2>/dev/null || echo "x86_64")"
  case "$uname_m" in
    x86_64|amd64)    echo "x64" ;;
    aarch64|arm64)   echo "arm64" ;;
    armv7l|armv6l)   echo "armv7l" ;;
    *)               echo "x64" ;;
  esac
}

OS="$(detect_os)"
ARCH="$(detect_arch)"

# ---------------------------------------------------------------------------
# Download helper (curl or wget)
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
# Node.js installation
# ---------------------------------------------------------------------------
install_node_via_pkg_manager() {
  # Check that sudo is available before attempting package manager installs
  if [[ "$OS" != "macos" ]] && ! command -v sudo &>/dev/null; then
    return 1
  fi

  case "$OS" in
    linux)
      if command -v apt-get &>/dev/null; then
        ok "Found apt"
        info "Installing Node.js via apt..."
        sudo apt-get update -qq || { warn "apt update failed, trying direct download..."; return 1; }
        sudo apt-get install -y -qq nodejs npm || return 1
      elif command -v dnf &>/dev/null; then
        ok "Found dnf"
        info "Installing Node.js via dnf..."
        sudo dnf install -y nodejs npm
      elif command -v yum &>/dev/null; then
        ok "Found yum"
        info "Installing Node.js via yum..."
        sudo yum install -y nodejs npm
      elif command -v pacman &>/dev/null; then
        ok "Found pacman"
        info "Installing Node.js via pacman..."
        sudo pacman -Sy --noconfirm nodejs npm
      elif command -v zypper &>/dev/null; then
        ok "Found zypper"
        info "Installing Node.js via zypper..."
        sudo zypper install -y nodejs npm
      elif command -v apk &>/dev/null; then
        ok "Found apk"
        info "Installing Node.js via apk..."
        sudo apk add --no-cache nodejs npm
      else
        return 1
      fi
      ;;
    macos)
      if command -v brew &>/dev/null; then
        ok "Found Homebrew"
        info "Installing Node.js via brew..."
        brew install node
      else
        return 1
      fi
      ;;
    *)
      return 1
      ;;
  esac
}

install_node_direct() {
  info "Downloading Node.js ${NODE_VERSION_FALLBACK} directly from nodejs.org..."

  local node_os node_ext
  case "$OS" in
    linux)   node_os="linux" ;;
    macos)   node_os="darwin" ;;
    *)       node_os="linux" ;;
  esac

  node_ext="tar.gz"

  local node_dir="node-${NODE_VERSION_FALLBACK}-${node_os}-${ARCH}"
  local node_url="https://nodejs.org/dist/${NODE_VERSION_FALLBACK}/${node_dir}.${node_ext}"
  local node_archive="${TMPDIR}/node.${node_ext}"

  download_file "$node_url" "$node_archive"

  tar -xzf "$node_archive" -C "$TMPDIR"

  local node_bin="${TMPDIR}/${node_dir}/bin"

  if [[ -x "${node_bin}/node" ]]; then
    export PATH="${node_bin}:${PATH}"
    ok "Node.js ${NODE_VERSION_FALLBACK} ready (temporary, not permanently installed)"
  else
    fail "Failed to download Node.js binary."
    info "Install Node.js manually from https://nodejs.org/ and try again."
    exit 1
  fi
}

install_node() {
  info "Detecting package manager..."

  if install_node_via_pkg_manager; then
    : # installed via package manager
  else
    warn "No supported package manager found."
    install_node_direct
  fi

  # Verify
  if command -v node &>/dev/null; then
    ok "Node.js installed: $(node --version)"
  else
    fail "Node.js installation failed."
    info "Install it manually from https://nodejs.org/ and try again."
    exit 1
  fi
}

check_node_version() {
  local version major
  version="$(node --version 2>/dev/null)"
  major="${version%%.*}"
  major="${major#v}"
  if [[ -z "$major" || "$major" -lt 18 ]]; then
    fail "Node.js ${version:-unknown} is too old. Version 18+ is required."
    info "Install Node.js 18+ from https://nodejs.org/ and try again."
    exit 1
  fi
  ok "Node.js ${version} (>=18)"
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
header "opencode-zeus — quick installer"
echo ""

info "Detected: ${OS} (${ARCH})"

# Ensure temp dir exists early (needed by direct node install)
TMPDIR="$(mktemp -d)" || { fail "Failed to create temporary directory."; exit 1; }

# Check for Node.js — install if missing
if command -v node &>/dev/null; then
  ok "Node.js found: $(node --version)"
  check_node_version
else
  warn "Node.js not found — installing automatically..."
  install_node
  check_node_version
fi

setup_downloader
ok "${DOWNLOAD} found"

# ---------------------------------------------------------------------------
# Download and extract
# ---------------------------------------------------------------------------
header "Downloading"

TARBALL="${TMPDIR}/repo.tar.gz"

info "Fetching ${REPO}@${BRANCH}..."
download_file "$TARBALL_URL" "$TARBALL"
ok "Downloaded tarball"

# Extract — GitHub tarballs have a top-level directory named <repo>-<branch>/
tar -xzf "$TARBALL" -C "$TMPDIR"
EXTRACTED="${TMPDIR}/opencode-zeus-${BRANCH}"

if [[ ! -d "$EXTRACTED" ]]; then
  EXTRACTED="$(find "$TMPDIR" -mindepth 1 -maxdepth 1 -type d -name "opencode-zeus*" | head -1)"
fi

if [[ ! -f "${EXTRACTED}/bin/setup.mjs" ]]; then
  fail "bin/setup.mjs not found in downloaded archive."
  exit 1
fi

ok "Extracted to temp directory"

# ---------------------------------------------------------------------------
# Run setup
# ---------------------------------------------------------------------------
header "Installing"
echo ""

node "${EXTRACTED}/bin/setup.mjs" --force

echo ""
ok "Done! Restart OpenCode to activate opencode-zeus."
