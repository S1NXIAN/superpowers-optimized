---
name: finishing-a-development-branch
description: Use when implementation is complete, tests pass, and you need to decide how to integrate the work — merge, PR, keep, or discard. Do NOT use during active development.
---

# Finishing a Development Branch

## Overview

Guide completion of development work by verifying tests and presenting structured options for integration.

**Core principle:** Verify tests → Detect environment → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting any options, verify that tests pass:**

```bash
npm test          # Node.js
cargo test        # Rust
pytest            # Python
go test ./...     # Go
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing.

[List failures]

Cannot proceed with merge/PR until tests pass.
```

STOP. Do NOT proceed to Step 2. Fix failures first.

**If the user tells you tests were passing and you should proceed anyway:**
Get explicit confirmation: "Tests are currently failing. Are you sure you want to proceed with failing tests?" If yes, proceed. Document that tests were failing at completion time in the PR description or merge commit.

### Step 2: Detect Environment

Determine the workspace state to choose the correct menu:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

| State | Menu | Cleanup |
|-------|------|---------|
| `GIT_DIR == GIT_COMMON` (normal repo) | Standard 4 options | No worktree to clean up |
| `GIT_DIR != GIT_COMMON`, named branch | Standard 4 options | Provenance-based cleanup |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Reduced 3 options (no merge) | Externally managed |

### Step 3: Determine Base Branch

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

If neither `main` nor `master` exists, ask: "Which branch should this merge into?"

### Step 4: Present Options

**Normal repo and named-branch worktree — present exactly these 4 options:**

```
Implementation complete. All tests pass. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Detached HEAD — present exactly these 3 options:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

Do NOT add extra explanation. Keep options concise.

### Step 5: Execute Choice

#### Option 1: Merge Locally

```bash
# Get main repo root
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"

# Merge
git checkout <base-branch>
git pull
git merge <feature-branch>

# Verify tests on merged result
npm test

# Clean up worktree if applicable (Step 6)
# Delete branch
git branch -d <feature-branch>
```

**Critical order:** Merge first → verify tests → cleanup worktree → delete branch. If you delete the branch before the worktree, `git branch -d` fails because the worktree still references it.

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<descriptive title>" --body "$(cat <<'EOF'
## Summary
- What changed (2-3 bullets)

## Why
- Motivation or problem solved

## How to Verify
Exact commands a reviewer can run:
```

**Do NOT clean up the worktree.** The user needs it alive for PR feedback iteration.

**PR description must include:**
- What changed — one-paragraph summary
- Why — motivation or problem solved
- How to verify — exact commands a reviewer can run
- Notable decisions — trade-offs made, alternatives rejected, non-obvious choices

#### Option 3: Keep Branch

Report: "Keeping branch `<branch>` as-is."

No further action. Don't clean up the worktree.

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch: <name>
- All commits: <short commit list>
- Worktree at: <path>

Type 'discard' to confirm.
```

Wait for the exact string `discard`. Do NOT accept variations.

If confirmed:
```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
```

Then cleanup (Step 6), then force-delete branch:
```bash
git branch -D <feature-branch>
```

### Step 6: Cleanup Workspace

**Only runs for Options 1 and 4.** Options 2 and 3 always preserve the worktree.

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

- If `GIT_DIR == GIT_COMMON`: Normal repo, no worktree. Done.
- If the worktree was created by the toolchain (under a managed path): Remove it with `git worktree remove`, then `git worktree prune`.
- Otherwise (harness-managed): Do NOT remove. Leave in place.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Delete Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | yes | - | - | yes |
| 2. Create PR | - | yes | yes | - |
| 3. Keep as-is | - | - | yes | - |
| 4. Discard | - | - | - | yes (force) |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping test verification | Always verify tests before offering options. |
| Open-ended questions ("What next?") | Present exactly 4 structured options (or 3 for detached HEAD). |
| Cleaning up worktree for Option 2 | User needs worktree for PR iteration. Only cleanup for 1 and 4. |
| Deleting branch before removing worktree | `git branch -d` fails if worktree still references the branch. |
| Running `git worktree remove` from inside the worktree | Always cd to main repo root first. |
| No confirmation for discard | Require the exact word "discard". No variations. |
| Merging without verifying on merged result | Run tests on the MERGED branch, not the feature branch. |

## Red Flags

**Never:**
- Proceed with failing tests (unless user explicitly overrides)
- Merge without verifying tests on the merged result
- Delete work without typed confirmation
- Force-push without explicit request
- Remove a worktree before confirming merge success
- Clean up worktrees you didn't create
- Run `git worktree remove` from inside the worktree

**Always:**
- Verify tests before offering options
- Detect environment before presenting menu
- Present exactly 4 options (or 3 for detached HEAD)
- Get typed confirmation for Option 4
- Run `git worktree prune` after removal

## Integration

**Required before this skill:**
- `verification-before-completion` — verifies tests pass before presenting options
- `subagent-driven-development` or `executing-plans` — executes the implementation this skill completes
