#!/usr/bin/env bash
# ===========================================================================
# post-checkout-hook.sh — Git post-checkout hook for context snapshots
#
# Calls lib/context-snapshot.mjs --write to generate
# <project-root>/zeus/memory/context-snapshot.json on every branch switch.
#
# Degrades gracefully: if Node.js is missing or anything fails,
# exits 0 silently — never blocks a checkout.
# ===========================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Guard: only run on actual checkouts (not merges, rebases, etc.)
# ---------------------------------------------------------------------------
if [[ -n "${GIT_REFLOG_ACTION:-}" ]]; then
  case "$GIT_REFLOG_ACTION" in
    checkout*|switch*) ;;
    *) exit 0 ;;
  esac
fi

# ---------------------------------------------------------------------------
# Locate Node.js — try several paths, then degrade gracefully
# ---------------------------------------------------------------------------
NODE=""
for candidate in node nodejs /usr/local/bin/node /usr/bin/node; do
  if command -v "$candidate" &>/dev/null; then
    NODE="$candidate"
    break
  fi
done

if [[ -z "$NODE" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Find project root and lib location
# ---------------------------------------------------------------------------
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

if [[ -z "$PROJECT_ROOT" ]]; then
  exit 0
fi

LIB_SCRIPT="$PROJECT_ROOT/lib/context-snapshot.mjs"

if [[ ! -f "$LIB_SCRIPT" ]]; then
  # Lib not found in this project — skip gracefully
  exit 0
fi

# ---------------------------------------------------------------------------
# Build and write snapshot via the library (single call, zero logic dup)
# ---------------------------------------------------------------------------
"$NODE" "$LIB_SCRIPT" --write "$PROJECT_ROOT" &>/dev/null || true
