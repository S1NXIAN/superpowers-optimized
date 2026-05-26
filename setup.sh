#!/usr/bin/env bash
# ===========================================================================
# setup.sh — Superpowers + OpenCode config installer
#
# Installs a Superpowers-optimized OpenCode configuration by symlinking
# files from this repo into ~/.config/opencode/. Validates prerequisites,
# shows a diff of changes, and backs up existing files before touching them.
#
# Usage:  ./setup.sh              # interactive (prompts before overwriting)
#         ./setup.sh --force       # non-interactive, overwrite without prompt
#         ./setup.sh --dry-run     # show what would change, don't touch anything
#         ./setup.sh --help        # show help
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="${HOME}/.config/opencode"
BACKUP_DIR="${CONFIG_DIR}/.backups/$(date +%Y%m%dT%H%M%S)"

# Files to symlink (repo_path -> config_path)
declare -A FILES=(
  ["opencode.json"]="opencode.json"
  ["AGENTS.md"]="AGENTS.md"
  ["agent/superpowers.md"]="agent/superpowers.md"
)

# ---------------------------------------------------------------------------
# Terminal styling
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; MAGENTA=''; CYAN=''; BOLD=''; DIM=''; NC=''
fi

info()    { echo -e "  ${BLUE}•${NC} $1"; }
ok()      { echo -e "  ${GREEN}✓${NC} $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC} $1"; }
error()   { echo -e "  ${RED}✗${NC} $1"; }
header()  { echo -e "\n${BOLD}$1${NC}"; }
subdued() { echo -e "  ${DIM}$1${NC}"; }

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------
show_help() {
  cat <<EOF
${BOLD}Superpowers + OpenCode — config installer${NC}

${DIM}Installs a Superpowers-optimized OpenCode configuration.${NC}

${BOLD}Usage:${NC}  ./setup.sh [OPTIONS]

${BOLD}Options:${NC}
  --force       Non-interactive; overwrite without prompting
  --dry-run     Show what would change; don't touch anything
  --help        Show this help and exit

${BOLD}What it does:${NC}
  1. Validates that OpenCode is installed
  2. Validates that the Superpowers plugin is installed and active
  3. Shows a diff of files that would change
  4. Backs up existing files to ~/.config/opencode/.backups/<timestamp>/
  5. Symlinks repo files → ~/.config/opencode/

${BOLD}Uninstall:${NC}  ./uninstall.sh
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
FORCE=false
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --force)   FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
    --help)    show_help ;;
    *)         echo -e "${RED}Unknown option:${NC} $arg"; show_help ;;
  esac
done

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
FAILED=false

preflight_error() {
  FAILED=true
  error "$1"
}

echo ""
header "Prerequisites"

# --- OpenCode config must exist ---
if [[ ! -f "${CONFIG_DIR}/opencode.json" ]]; then
  preflight_error "OpenCode config not found at ${CONFIG_DIR}/opencode.json"
  preflight_error "Make sure OpenCode is installed and has been started at least once."
else
  ok "OpenCode config found at ${CONFIG_DIR}"
fi

# --- Superpowers plugin must be declared in opencode.json ---
SUPERPOWERS_DECLARED=false
if [[ -f "${CONFIG_DIR}/opencode.json" ]]; then
  if grep -q '"superpowers' "${CONFIG_DIR}/opencode.json" 2>/dev/null; then
    SUPERPOWERS_DECLARED=true
    ok "Superpowers plugin declared in opencode.json"
  fi
fi

if ! $SUPERPOWERS_DECLARED; then
  preflight_error "Superpowers plugin not found in ${CONFIG_DIR}/opencode.json"
  preflight_error "Add it to the 'plugin' array:"
  preflight_error '  "superpowers@git+https://github.com/obra/superpowers.git"'
fi

# --- Superpowers must actually be installed (plugin directory + bootstrap skill) ---
SUPERPOWERS_INSTALLED=false
declare -a SEARCH_PATHS=(
  "${CONFIG_DIR}/node_modules/superpowers"
  "${CONFIG_DIR}/.opencode/plugins/node_modules/superpowers"
  "${HOME}/.local/share/opencode/plugins/superpowers"
)

for sp_dir in "${SEARCH_PATHS[@]}"; do
  if [[ -d "$sp_dir" ]] && [[ -f "$sp_dir/skills/using-superpowers/SKILL.md" ]]; then
    SUPERPOWERS_INSTALLED=true
    ok "Superpowers plugin installed at ${sp_dir}"
    break
  fi
done

if ! $SUPERPOWERS_INSTALLED; then
  # Broader search: look for the skills anywhere discoverable
  info "Searching for Superpowers skills installation..."
  FOUND_SKILLS=$(find "${HOME}/.config/opencode" "${HOME}/.local/share/opencode" \
    -path "*/using-superpowers/SKILL.md" -type f 2>/dev/null | head -5)

  if [[ -n "$FOUND_SKILLS" ]]; then
    SUPERPOWERS_INSTALLED=true
    ok "Superpowers skills found at:"
    while IFS= read -r line; do
      subdued "$(dirname "$(dirname "$line")")"
    done <<< "$FOUND_SKILLS"
  fi
fi

if ! $SUPERPOWERS_INSTALLED; then
  cat <<'EOF'

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Superpowers is not installed. This configuration requires it.           │
│                                                                          │
│  Install it by adding to your opencode.json 'plugin' array:              │
│                                                                          │
│    "superpowers@git+https://github.com/obra/superpowers.git"             │
│                                                                          │
│  Then restart OpenCode so it resolves and installs the plugin.           │
│  After that, run this setup again.                                       │
│                                                                          │
│  https://github.com/obra/superpowers                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
EOF
  exit 1
fi

# --- jq availability (for JSON validation) ---
JQ_AVAILABLE=false
if command -v jq &>/dev/null; then
  JQ_AVAILABLE=true
fi

# --- Git availability (for diff) ---
GIT_AVAILABLE=false
if command -v git &>/dev/null; then
  GIT_AVAILABLE=true
fi

# ---------------------------------------------------------------------------
# Bail if any preflight failed
# ---------------------------------------------------------------------------
if $FAILED; then
  echo ""
  error "Preflight checks failed. Fix the issues above and re-run."
  exit 1
fi

# ---------------------------------------------------------------------------
# Validate opencode.json
# ---------------------------------------------------------------------------
header "Config validation"

if $JQ_AVAILABLE; then
  if jq empty "${CONFIG_DIR}/opencode.json" 2>/dev/null; then
    ok "opencode.json is valid JSON"
  else
    warn "opencode.json is not valid JSON — check syntax"
  fi
else
  # Basic validation: try python3 or node
  if command -v python3 &>/dev/null; then
    if python3 -c "import json; json.load(open('${CONFIG_DIR}/opencode.json'))" 2>/dev/null; then
      ok "opencode.json is valid JSON"
    else
      warn "opencode.json is not valid JSON — check syntax"
    fi
  elif command -v node &>/dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('${CONFIG_DIR}/opencode.json','utf8'))" 2>/dev/null; then
      ok "opencode.json is valid JSON"
    else
      warn "opencode.json is not valid JSON — check syntax"
    fi
  else
    warn "Cannot validate JSON (install jq, python3, or node)"
  fi
fi

# ---------------------------------------------------------------------------
# Show diff of planned changes
# ---------------------------------------------------------------------------
header "Planned changes"

CHANGES_PLANNED=false
for rel_path in "${!FILES[@]}"; do
  repo_file="${REPO_DIR}/${rel_path}"
  config_file="${CONFIG_DIR}/${FILES[$rel_path]}"

  if [[ ! -f "$repo_file" ]]; then
    warn "Missing in repo: ${rel_path} — skipping"
    continue
  fi

  if [[ -f "$config_file" ]] && [[ ! -L "$config_file" ]] && $GIT_AVAILABLE; then
    CHANGES_PLANNED=true
    echo ""
    subdued "${config_file}"
    git --no-pager diff --no-color --no-index "$config_file" "$repo_file" 2>/dev/null \
      | tail -n +5 \
      | sed "s/^/    /" || true
  elif [[ -f "$config_file" ]] && [[ ! -L "$config_file" ]]; then
    # No git — just show file sizes/dates
    CHANGES_PLANNED=true
    echo ""
    subdued "${config_file}"
    subdued "  repo: $(wc -l < "$repo_file") lines | config: $(wc -l < "$config_file") lines"
  elif [[ ! -e "$config_file" ]]; then
    CHANGES_PLANNED=true
    echo ""
    info "New file: ${FILES[$rel_path]}"
  fi
done

if ! $CHANGES_PLANNED && ! $DRY_RUN; then
  warn "No changes detected — config is already up to date"
fi

# ---------------------------------------------------------------------------
# Confirm
# ---------------------------------------------------------------------------
confirm() {
  if $FORCE; then
    return 0
  fi
  echo ""
  read -r -p "  ${BOLD}Proceed with installation?${NC} [Y/n] " reply
  case "$reply" in
    [nN]|[nN][oO]) return 1 ;;
    *) return 0 ;;
  esac
}

if $DRY_RUN; then
  echo ""
  info "${BOLD}Dry run complete.${NC} No files were changed."
  exit 0
fi

if ! confirm; then
  echo ""
  info "Installation cancelled."
  exit 0
fi

# ---------------------------------------------------------------------------
# Install: backup + symlink
# ---------------------------------------------------------------------------
header "Installing"

INSTALLED_COUNT=0
SKIPPED_COUNT=0
BACKED_UP_COUNT=0

for rel_path in "${!FILES[@]}"; do
  repo_file="${REPO_DIR}/${rel_path}"
  config_file="${CONFIG_DIR}/${FILES[$rel_path]}"
  config_dir="$(dirname "$config_file")"

  # Source must exist
  if [[ ! -f "$repo_file" ]]; then
    warn "Missing in repo: ${rel_path} — skipping"
    ((SKIPPED_COUNT++))
    continue
  fi

  # Ensure target directory exists
  if [[ ! -d "$config_dir" ]]; then
    mkdir -p "$config_dir"
    info "Created directory ${config_dir}"
  fi

  # Backup existing file if it's a real file (not a symlink)
  if [[ -f "$config_file" ]] && [[ ! -L "$config_file" ]]; then
    mkdir -p "$BACKUP_DIR"
    cp "$config_file" "${BACKUP_DIR}/${FILES[$rel_path]}"
    ok "Backed up ${FILES[$rel_path]} → ${BACKUP_DIR}"
    ((BACKED_UP_COUNT++))
  fi

  # Create or update symlink
  if [[ -L "$config_file" ]]; then
    current_target="$(readlink "$config_file")"
    if [[ "$current_target" == "$repo_file" ]]; then
      subdued "Already current: ${FILES[$rel_path]}"
      ((SKIPPED_COUNT++))
      continue
    fi
  fi

  ln -sf "$repo_file" "$config_file"
  ok "Linked ${FILES[$rel_path]} → ${CONFIG_DIR}/${FILES[$rel_path]}"
  ((INSTALLED_COUNT++))
done

# ---------------------------------------------------------------------------
# Verify installation
# ---------------------------------------------------------------------------
header "Verification"

VERIFY_FAILED=false
for rel_path in "${!FILES[@]}"; do
  config_file="${CONFIG_DIR}/${FILES[$rel_path]}"
  repo_file="${REPO_DIR}/${rel_path}"

  if [[ ! -L "$config_file" ]]; then
    error "${FILES[$rel_path]} is not a symlink (expected: symlink)"
    VERIFY_FAILED=true
    continue
  fi

  target="$(readlink "$config_file")"
  if [[ "$target" != "$repo_file" ]]; then
    error "${FILES[$rel_path]} points to ${target}, expected ${repo_file}"
    VERIFY_FAILED=true
    continue
  fi

  ok "${FILES[$rel_path]} → ${target}"
done

# Check that the default_agent resolves
if command -v python3 &>/dev/null; then
  AGENT_FILE="${CONFIG_DIR}/agent/superpowers.md"
  if [[ -f "$AGENT_FILE" ]] || [[ -L "$AGENT_FILE" ]]; then
    ok "Agent file superpowers.md is accessible"
  else
    warn "Agent file not found at ${AGENT_FILE}"
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
header "Summary"
echo ""
if (( INSTALLED_COUNT > 0 )); then
  ok "${INSTALLED_COUNT} file(s) linked"
fi
if (( BACKED_UP_COUNT > 0 )); then
  info "${BACKED_UP_COUNT} file(s) backed up to ${BACKUP_DIR}"
fi
if (( SKIPPED_COUNT > 0 )); then
  subdued "${SKIPPED_COUNT} file(s) already current"
fi

if $VERIFY_FAILED; then
  echo ""
  warn "Some files could not be verified. Check the errors above."
  exit 1
fi

echo ""
echo -e "  ${GREEN}${BOLD}✔ Setup complete.${NC}"
echo ""
echo -e "  ${DIM}Your config now lives in this repo. Edit files here${NC}"
echo -e "  ${DIM}and restart OpenCode for changes to take effect.${NC}"
echo ""
echo -e "  ${DIM}To undo:  ./uninstall.sh${NC}"
echo ""
