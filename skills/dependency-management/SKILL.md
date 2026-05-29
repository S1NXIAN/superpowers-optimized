---
name: dependency-management
description: Use when updating project dependencies — upgrading versions, adding new packages, or resolving lockfile conflicts. Do NOT use for initial project setup or scaffolding.
---

# Dependency Management

## Overview

Dependency updates look simple — bump a version number, run install, done. In practice, they're one of the most common sources of hard-to-diagnose breakage: silent API changes, peer dependency conflicts, and transitive resolution shifts.

**Core principle:** Update once. Verify twice. Never batch major upgrades.

## The Iron Rule

**NEVER batch multiple major upgrades into one commit.** If something breaks, you need to know which upgrade caused it.

### Sub-rules:
- One package per commit for major upgrades
- One verification cycle per change
- Lockfile changes committed separately from code changes
- Never remove the lockfile to "start fresh"

## The Process

### Phase 1: Audit

Before changing anything, understand what needs updating:

1. **List outdated dependencies:**
   - Node.js: `npm outdated` or `yarn outdated`
   - Python: `pip list --outdated` or `pip-audit`
   - Go: `go list -m -u all`
   - Rust: `cargo outdated`

2. **Categorize by urgency:**
   - **Security** — CVE or advisory. Update immediately.
   - **Breaking** — Major version bump with documented breaking changes.
   - **Feature** — Minor/patch with new features or non-breaking fixes.
   - **Transitive** — Dependency of a dependency. Handled by lockfile update.

3. **Prioritize:** Security > Breaking (if blocking) > Feature. Don't update everything at once.

### Phase 2: Impact Assessment

For each dependency to update (especially major versions):

1. **Read the changelog/migration guide** for:
   - Breaking API changes (renamed functions, removed options, changed signatures)
   - Dropped platform/runtime support (minimum Node version, Python version)
   - Peer dependency changes (requires React 18, drops React 16)
   - Changed default behavior (opt-in → opt-out, strict mode)

2. **Search the codebase** for usage of changed APIs:
   - Direct calls and type references
   - String literals and dynamic access (`obj["methodName"]`)
   - Import statements and re-exports
   - Test files and mocks
   
   Do not assume one search caught everything. A function name may appear as a type annotation, a string key, or in a mock — each requires a separate pattern.

3. **Check peer dependency compatibility:** Will this update conflict with other installed packages? Proactively check for frameworks with tight coupling (React + React DOM, Angular packages).

### Phase 3: Incremental Update

One dependency at a time. Verify after each:

1. **Update:**
   - `npm install package@version`
   - Commit lockfile changes SEPARATELY from code changes
   
2. **Run the full test suite:**
   - If tests fail, does the error match documented breaking changes?
   - If yes: apply the migration and re-run tests
   - If no: investigate before proceeding. Undocumented breaking change = red flag.

3. **Run the build:** Type errors, import resolution failures, import resolution failures often surface here, not in tests.

4. **Smoke test at runtime** if the dependency affects runtime behavior (not just types/build).

5. **Stage changes:** When the user asks for a commit, use a message naming the package and version: `chore(deps): upgrade lodash 4.17.20 → 4.17.21`. Do NOT auto-commit unless explicitly asked.

6. **Repeat** for the next dependency.

### Phase 4: Verification

After all planned updates:

- [ ] Full test suite green — no skipped, no flaky
- [ ] Build succeeds — no type errors, no unresolved imports
- [ ] Lockfile committed — reflects all updates and nothing else
- [ ] No unrelated changes — dependency updates should not include code changes that aren't required

## Handling Security Vulnerabilities

1. **Assess exploitability:** Does the vulnerability affect how the dependency is used here? A ReDoS in a regex you never call is low urgency regardless of CVSS score.
2. **Check for patch:** Patched version available? Follow standard update flow.
3. **If no patch:** Document in `known-issues.md` with the CVE, workaround, and date to re-check.

## Lockfile Merge Conflicts

Never hand-edit a lockfile. The resolution process:

1. Accept either side of the conflict (typically the target branch's version)
2. Re-run the install command to regenerate the lockfile
3. Verify the lockfile reflects all intended dependency versions

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Batching multiple major upgrades | One per commit. You need to know what broke. |
| Removing lockfile "to start fresh" | Changes every transitive dep at once. Never do this. |
| Mixing dev and production deps in one commit | Separate commits. Different risk profiles. |
| Hand-editing lockfiles | Always regenerate via package manager. |
| Not reading the changelog | Breaking changes are documented. Read before updating. |
| Assuming minor/patch is always safe | Silent API shifts can still break. Verify. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll update all 5 minor deps at once" | If the build breaks, you lose 20 min finding the culprit. |
| "It's just a version bump, no code change" | Silent API shifts or transitive peer conflicts can kill the runtime. |
| "Delete lockfile and reinstall" | Destroys deterministic resolution. Never do this. |
| "I don't need to read the changelog" | You'll miss breaking changes. Always read it. |
| "The tests pass, so the update is safe" | Types and runtime behavior can break differently. Run the build too. |

## Red Flags

- Updating multiple packages in one commit
- Removing the lockfile to "clean up"
- Hand-editing a lockfile
- Skipping the full test suite after a dependency update
- Not reading the changelog for a major version update
- Assuming minor/patch bumps are always safe

## Integration

**Related skills:**
- `systematic-debugging` — when an update causes unexpected failures
- `test-driven-development` — when the update requires new tests for changed behavior
- `error-recovery` — to document recurring dependency issues in `known-issues.md`
