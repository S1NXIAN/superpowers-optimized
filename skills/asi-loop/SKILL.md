---
name: asi-loop
description: Use when fixing multiple overlapping issues in the same file. Required when 3+ issues share a file and fixing one would affect another. Do NOT use for isolated issues in separate files.
---

# ASI Loop

## Overview

When multiple bugs overlap in the same file, fixing them in parallel causes regression cascades. Fix one at a time, verify, then move to the next.

**Core principle:** One issue per cycle. Zero conflicts. Never fix > 1 issue per cycle.

**Announce at start:** "I'm using the asi-loop skill to fix overlapping issues."

## When to Use

**Use this when:**
- 3+ issues share the same file
- Fixing one issue would modify code near another issue
- You have a list of issues tracked in a state file
- The tool provides `scripts/asi.sh` for state management

**Don't use when:**
- Issues are in completely separate files (fix them independently)
- Only 1-2 issues exist (just fix them)
- Issues don't overlap in the same code region

## The Process

### Phase 1: Isolate

Run the state machine to select the next issue:

```bash
scripts/asi.sh select
```

Priority waterfall:
1. **Critical** (crashes, data loss, security)
2. **Dependencies** (issues that block other fixes)
3. **Severity** (highest impact first)

The tool returns the selected issue ID and description.

### Phase 2: Bias Check

Before fixing, challenge your assumptions:

- **Confirmation bias:** Why might this fix be INCORRECT? What evidence would prove I'm wrong?
- **Anchoring bias:** If this fix turns out to be 3x harder than expected, does the priority shift? Would a lower-effort fix for a different issue be better?

If the bias check reveals the issue should be reprioritized, run `scripts/asi.sh reprioritize <id>` and return to Phase 1.

### Phase 3: Fix

1. Write a failing test that reproduces the bug (TDD)
2. Verify RED — the test fails as expected
3. Apply the fix
4. Verify GREEN — the test passes
5. Run the full test suite to check for regressions

### Phase 4: Update State

```bash
scripts/asi.sh mark-fixed <id>
scripts/asi.sh complete-cycle
```

### Phase 5: Loop

If open issues remain, return to Phase 1. Continue until `asi.sh list-open` is empty.

## Halt Guard

If `cycle >= 4` (4+ cycles completed), stop and save the current diff:

```bash
git diff > asi-loop-patch-$(date +%s).diff
```

Do NOT auto-resume without user confirmation. After 4 cycles, the agent may be context-exhausted or the approach may need rethinking.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Fixing multiple related issues together | One per cycle. Regression risk is too high. |
| Skipping the state machine | Loss of situational awareness on remaining debt. |
| Skipping the bias check | Confirmation anchoring leads to wrong fixes. |
| Not verifying after each fix | Regression from one fix breaks another issue. |
| Continuing past 4 cycles without pause | Context exhaustion causes mistakes. Stop at 4. |
| Fixing out of priority order | Critical issues should always go first. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll fix these 2 related issues together" | High risk of merge conflict or side-effect regression. |
| "I'll skip the state machine" | Loss of situational awareness on remaining debt. |
| "It's too slow to cycle" | Debugging a regression cascade takes 10x longer than cycling. |
| "I don't need the bias check" | Confirmation bias is strongest when you're confident. Check anyway. |
| "I can do more than 4 cycles, I'm fine" | Context exhaustion is real. Stop at 4 and confirm. |

## Red Flags

- Fixing > 1 issue per cycle
- Skipping `asi.sh` and managing state manually
- Not running the full test suite after a fix
- Continuing past 4 cycles without confirmation
- Fixing a non-critical issue before a critical one
- Not writing a regression test for the fix

## Integration

**Required before this skill:**
- `systematic-debugging` — to find root cause of each overlapping issue

**Required after this skill:**
- `verification-before-completion` — verify all fixes work together
- Full test suite run after all cycles complete
