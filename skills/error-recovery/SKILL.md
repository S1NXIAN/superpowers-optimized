---
name: error-recovery
description: Use when encountering an environment, platform, or configuration error — before investigating from scratch. Checks the project's known-issues database for existing solutions.
---

# Error Recovery

## Overview

Project-level memory for ghosts in the machine. Before spending time investigating a platform or environment error, check if someone already solved it.

**Core principle:** Consult FIRST, fix SECOND. 10 minutes of investigation can be saved in 2 seconds of lookup.

## When to Use

**Use this for:**
- Environment errors (port conflicts, missing tools, version skew)
- Platform quirks (Mac vs Linux differences, CI environment differences)
- Configuration issues that aren't code bugs
- Flaky tests due to shared state or test ordering
- Complex bugs that were already investigated and documented

**Don't use for:**
- One-off logic bugs in code you're currently writing
- Transient API failures (network blips)
- Errors where the fix is obvious and immediate

## The Process

### Phase 0: Consult

Before any debugging turn, search `known-issues.md` for error substrings:

```bash
grep -i "error message substring" known-issues.md
```

Or read the file directly and scan for matching patterns.

If a match is found, try the documented fix immediately. If it works, you're done.

### Phase 1: Apply

If a match is found:
1. Apply the documented fix exactly
2. Verify the error is resolved
3. If fix doesn't work, proceed to Phase 2

### Phase 2: Capture

If you solve a new complex bug that's environment or platform specific:

1. Check if it's already documented (avoid duplicates)
2. If new, offer to add it to `known-issues.md`

### Entry Format

```markdown
## [Short Title]
**Error:** `Exact error pattern or substring`
**Root Cause:** One-sentence technical explanation.
**Fix:** 
```bash
exact command to run
```
**Context:** When it fires (e.g., "Windows only", "After npm install", "Node 20+")
```

## Maintenance

- Maximum 50 entries. Older entries get pruned when new ones are added.
- If a root cause is deleted from the codebase, the corresponding entry MUST be removed.
- If an entry's fix no longer works, update or remove it.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Re-investigating a known issue | Check known-issues.md FIRST. |
| Adding every error to the database | Only complex/platform/environment bugs. Not one-off logic bugs. |
| Not removing entries for deleted code | Stale entries cause confusion. Prune them. |
| Entries that are too verbose | One sentence root cause. Exact fix command. That's it. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll just re-investigate to be sure" | Wastes 15 min for something already solved. Check first. |
| "This bug is too small to record" | Small environment bugs recur most often. Record them. |
| "I'll record every bug" | Information noise. Stick to complex/platform issues. |
| "I know the fix, no need to document" | Until you forget. Document for future-you. |
| "The known-issues file is probably outdated" | Check anyway. Even outdated entries give clues. |

## Red Flags

- Starting investigation without checking `known-issues.md`
- Spending more than 2 minutes investigating something that might be known
- Adding a one-off logic bug to the known-issues database
- Not removing entries when the associated code is deleted
- Letting the database exceed 50 entries without pruning

## Integration

**Used within:**
- `systematic-debugging` — Phase 0 of the investigation process

**Related skills:**
- `systematic-debugging` — for debugging issues not in the database
- `verification-before-completion` — verify the fix works before documenting it
