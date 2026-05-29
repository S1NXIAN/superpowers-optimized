#!/usr/bin/env bash
# ===========================================================================
# post-checkout-hook.sh — Git post-checkout hook for context snapshots
#
# Automatically generates .context-snapshot.json at the project root on every
# branch switch. Captures git hash, changed files, change stats, recent
# commits, and blast radius (files referencing changed modules).
#
# Degrades gracefully: if Node.js is missing, rg is missing, or anything
# fails, the hook exits 0 silently — it never blocks a checkout.
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
# Find project root
# ---------------------------------------------------------------------------
PROJECT_ROOT=""
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

if [[ -z "$PROJECT_ROOT" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Write the Node.js snapshot script to a temp file and execute it.
# We use a temp file (rather than -e inline) to avoid nested quoting hell
# when building rg patterns inside execSync inside a bash script.
# ---------------------------------------------------------------------------
TMP_SCRIPT="$(mktemp /tmp/git-context-snapshot-XXXXXX.js)" || exit 0

# Ensure cleanup on exit
cleanup() { rm -f "$TMP_SCRIPT"; }
trap cleanup EXIT

cat > "$TMP_SCRIPT" << 'NODESCRIPT'
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const root = process.argv[2];

  const gitHash = execSync('git rev-parse HEAD', { cwd: root }).toString().trim();

  const changedFilesRaw = execSync("git diff --name-only HEAD~1..HEAD 2>/dev/null || echo ''", { cwd: root }).toString().trim();
  const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(s => s.trim()) : [];

  const changeStat = execSync("git diff --stat HEAD~1..HEAD 2>/dev/null || true", { cwd: root }).toString().trim();

  const recentCommits = execSync("git log --oneline -5 2>/dev/null || true", { cwd: root }).toString().trim();

  // Blast radius: for each changed file, find other files in the project that
  // reference its module name via require('...') or from '...'
  const blastRadius = {};
  for (const file of changedFiles) {
    const baseName = path.parse(file).name;
    try {
      const out = execSync(
        "rg -l -F \"'" + baseName + "'\" --glob '!node_modules' --glob '!.git' " + root + " 2>/dev/null || true",
        { cwd: root, maxBuffer: 1024 * 1024 }
      ).toString().trim();
      blastRadius[file] = out ? out.split('\n').filter(s => s.trim()) : [];
    } catch (_) {
      blastRadius[file] = [];
    }
  }

  const snapshot = {
    git_hash: gitHash,
    changed_files: changedFiles,
    change_stat: changeStat,
    recent_commits: recentCommits,
    blast_radius: blastRadius,
    generated: new Date().toISOString()
  };

  fs.writeFileSync(path.join(root, '.context-snapshot.json'), JSON.stringify(snapshot, null, 2));
} catch (_) {
  // Silent failure — never block a checkout
}
NODESCRIPT

"$NODE" "$TMP_SCRIPT" "$PROJECT_ROOT" || true
