#!/usr/bin/env bash
# ===========================================================================
# uninstall.sh — Remove Superpowers + OpenCode config
#
# Removes symlinks created by setup.sh and optionally restores the most
# recent backup from ~/.config/opencode/.backups/.
#
# Usage:  ./uninstall.sh            # interactive
#         ./uninstall.sh --force    # non-interactive
#         ./uninstall.sh --help     # show help
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_DIR="${HOME}/.config/opencode"
BACKUP_PARENT="${CONFIG_DIR}/.backups"

# Files managed by setup.sh (config_path)
declare -a MANAGED_FILES=(
  "opencode.json"
  "AGENTS.md"
  "agent/superpowers.md"
)

# ---------------------------------------------------------------------------
# Terminal styling
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  BOLD='\033[1m'
  DIM='\033[2m'
  NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; DIM=''; NC=''
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
${BOLD}Superpowers + OpenCode — uninstaller${NC}

${DIM}Removes symlinks created by setup.sh and restores the most recent backup.${NC}

${BOLD}Usage:${NC}  ./uninstall.sh [OPTIONS]

${BOLD}Options:${NC}
  --force       Non-interactive; remove without prompting
  --help        Show this help and exit

${BOLD}What it does:${NC}
  1. Identifies symlinks pointing to this repo
  2. Removes them
  3. Restores the most recent backup from ~/.config/opencode/.backups/
  4. Cleans up empty backup directories
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
    --help)  show_help ;;
    *)       echo -e "${RED}Unknown option:${NC} $arg"; show_help ;;
  esac
done

# ---------------------------------------------------------------------------
# Find managed symlinks
# ---------------------------------------------------------------------------
header "Finding installed files"

FOUND_SYMLINKS=()
MISSING=()

for rel_path in "${MANAGED_FILES[@]}"; do
  config_file="${CONFIG_DIR}/${rel_path}"
  repo_file="${REPO_DIR}/${rel_path}"

  if [[ -L "$config_file" ]]; then
    target="$(readlink "$config_file")"
    if [[ "$target" == "$repo_file" ]]; then
      FOUND_SYMLINKS+=("$config_file")
      subdued "Found: ${rel_path} → repo"
    else
      subdued "Skipping: ${rel_path} → ${target} (not from this repo)"
    fi
  elif [[ -f "$config_file" ]]; then
    subdued "Skipping: ${rel_path} (real file, not a symlink)"
  else
    subdued "Skipping: ${rel_path} (does not exist)"
  fi
done

if [[ ${#FOUND_SYMLINKS[@]} -eq 0 ]]; then
  info "No managed symlinks found — nothing to uninstall."
  exit 0
fi

# ---------------------------------------------------------------------------
# Find latest backup
# ---------------------------------------------------------------------------
RESTORE_BACKUP=""
if [[ -d "$BACKUP_PARENT" ]]; then
  LATEST_BACKUP="$(ls -1t "$BACKUP_PARENT" 2>/dev/null | head -1)"
  if [[ -n "$LATEST_BACKUP" ]]; then
    RESTORE_BACKUP="${BACKUP_PARENT}/${LATEST_BACKUP}"
    info "Latest backup: ${RESTORE_BACKUP}"
  fi
fi

# ---------------------------------------------------------------------------
# Confirm
# ---------------------------------------------------------------------------
confirm() {
  if $FORCE; then
    return 0
  fi
  echo ""
  echo -e "  ${YELLOW}This will remove ${#FOUND_SYMLINKS[@]} symlink(s) and restore the backup.${NC}"
  echo ""
  read -r -p "  ${BOLD}Proceed with uninstall?${NC} [Y/n] " reply
  case "$reply" in
    [nN]|[nN][oO]) return 1 ;;
    *) return 0 ;;
  esac
}

if ! confirm; then
  echo ""
  info "Uninstall cancelled."
  exit 0
fi

# ---------------------------------------------------------------------------
# Remove symlinks
# ---------------------------------------------------------------------------
header "Removing"

REMOVED_COUNT=0

for config_file in "${FOUND_SYMLINKS[@]}"; do
  rel="${config_file#$CONFIG_DIR/}"

  # Restore backup if available
  if [[ -n "$RESTORE_BACKUP" ]] && [[ -f "${RESTORE_BACKUP}/${rel}" ]]; then
    rm "$config_file"
    cp "${RESTORE_BACKUP}/${rel}" "$config_file"
    ok "Restored ${rel} from backup"
  else
    rm "$config_file"
    ok "Removed ${rel} (no backup to restore)"
  fi
  ((REMOVED_COUNT++))
done

# ---------------------------------------------------------------------------
# Clean up empty agent directory
# ---------------------------------------------------------------------------
AGENT_DIR="${CONFIG_DIR}/agent"
if [[ -d "$AGENT_DIR" ]] && [[ -z "$(ls -A "$AGENT_DIR" 2>/dev/null)" ]]; then
  rmdir "$AGENT_DIR" 2>/dev/null && subdued "Removed empty directory: ${AGENT_DIR}"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
header "Summary"
echo ""
ok "${REMOVED_COUNT} symlink(s) removed"

if [[ -n "$RESTORE_BACKUP" ]]; then
  echo ""
  info "Backup preserved at: ${RESTORE_BACKUP}"
  subdued "Delete it manually if no longer needed:"
  subdued "  rm -rf ${RESTORE_BACKUP}"
fi

echo ""
echo -e "  ${GREEN}✔ Uninstall complete. Restart OpenCode for changes to take effect.${NC}"
echo ""
