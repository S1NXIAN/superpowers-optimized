---
name: finishing-a-development-branch
description: Closes development work with explicit integration choice after verification.
---

# Finishing a Development Branch

Close development work with explicit integration choice.

## Step 1: Verify

Run full project verification before offering options.

If verification fails, stop and return to implementation.

## Step 2: Identify Base Branch

Detect merge base (`main`/`master` or repo default) and confirm if unclear.

## Step 3: Offer Exactly Four Options

1. Merge back to `<base-branch>` locally
2. Push branch and open PR
3. Keep branch as-is
4. Discard branch

## Step 4: Execute Safely

### Option 1 — Local Merge
- Checkout base branch
- Pull latest
- Merge feature branch
- Re-run verification
- Delete merged branch

### Option 2 — Open PR
- Push feature branch
- Create PR with description including:
  - **What changed** — one-paragraph summary
  - **Why** — motivation or problem solved
  - **How to verify** — exact commands a reviewer can run
  - **Notable decisions** — trade-offs made, alternatives rejected, non-obvious choices

### Option 3 — Keep Branch
- Report exact branch name and path
- No further action

### Option 4 — Discard
- Show destructive impact summary
- Require exact confirmation: `discard`
- Delete branch

## Hard Rules
- Never merge with failing tests.
- Never delete work without explicit confirmation.
- Never force-push unless explicitly requested.

## Final Report

Include:
- Selected option
- Commands executed
- Final branch status
- PR link (if created)

## Rationalization Table

| Temptation | Danger |
| :--- | :--- |
| "I'll just merge, tests are probably fine" | Merging broken code poisons the base branch. |
| "I'll skip the PR description, it's obvious" | Reviewers need context to evaluate changes. |
| "I'll force-push to clean up history" | Destroys collaborative history. Never without explicit request. |
