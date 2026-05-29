---
name: verification-before-completion
description: Use when about to claim any work is complete, fixed, or passing — before committing, creating a PR, or moving to the next task. Run the proving command and read the output before making any success claim.
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims. Always. If you haven't run the verification command in THIS message, you cannot claim it passes. Previous runs are stale — re-run fresh.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this response turn, you cannot claim it passes. Not "should pass." Not "I'm confident." Not "the last run showed green." FRESH. NOW.

## The Gate Function

Every time you're about to claim any status:

```
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete output)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does the output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim
```

Skip any step = lying, not verifying.

## What Each Claim Requires

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| "Tests pass" | Test command output: 0 failures, exit 0 | Previous run, "should pass", "last run was green" |
| "Linter clean" | Linter output: 0 errors, 0 warnings | "I fixed all the errors", partial check |
| "Build succeeds" | Build command: exit 0, no errors | Linter passing, "looks correct" |
| "Bug fixed" | Test original reproduction: now passes | Code changed, "it should work now" |
| "Regression prevented" | Red-green cycle verified: fail → pass | "The test passes" (you never saw it fail) |
| "Subagent completed" | Read the git diff, verify changes match intent | "The subagent said it worked" |
| "Requirements met" | Line-by-line checklist against the spec | "The tests pass" (tests may not cover all requirements) |
| "All edge cases handled" | Name each edge case and show the test | "I handled them in the code" (without tests) |

## Common Violations

**The "should" trap:**
```
❌ "The tests should pass now — I fixed the issue."
❌ "Build should be clean with the latest changes."
❌ "That should fix it."

✅ Run the command. Read the output. Report the result.
```

**The "previous run" trap:**
```
❌ "Tests pass." (based on a run 3 edits ago)
❌ "Linter was clean last time." (before your last change)

✅ Every claim needs a FRESH run after the LAST change.
```

**The "subagent said so" trap:**
```
❌ "The subagent reports all tests pass."
❌ "The subagent confirmed the fix works."

✅ Read the git diff. Run the tests yourself. Verify.
```

**The "verification by implication" trap:**
```
❌ "Here's the fix. Tests should pass now." (no output shown)
❌ "Let me commit this — I already verified." (show the output)

✅ Show the output WITH the claim. In the same message.
```

## Regression Test Verification (TDD Red-Green)

For regression tests, verification requires the full cycle:

```bash
# 1. Write test, run it — expect FAIL
npm test -- --grep "regression test name"
# Output: FAIL — test catches the bug

# 2. Write fix, run again — expect PASS
npm test -- --grep "regression test name"
# Output: PASS — fix works

# 3. Run full suite — expect no regressions
npm test
# Output: all pass
```

**If you didn't see FAIL, you don't know the test works.**

## Subagent Delegation Verification

When using subagents:

1. **Read the diff** — `git diff` or inspect the changed files
2. **Verify intent** — does the code match the task requirements?
3. **Run tests** — full suite, not just the affected file
4. **Then claim completion**

Do NOT trust the subagent's summary. Verify independently.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It should work now" | "Should" is not evidence. Run the command. |
| "I'm confident it works" | Confidence ≠ evidence. Prove it. |
| "Just this once, skip verification" | No exceptions. Every time. |
| "Linter passed earlier" | Earlier runs are stale. Re-run after every change. |
| "The subagent said it works" | Verify the diff. Trust but verify. |
| "The test passed in the last run" | Run it again. Your change may have broken something. |
| "Partial check is enough" | Partial proves nothing. Full command, full output. |
| "I'm tired, I just want to be done" | Tired mistakes create more work. Verify anyway. |
| "I already verified this step" | Not since your last change. Re-run. |
| "The output is too long to show" | Show the relevant portion and the exit code. |
| "I'll verify after committing" | Verify BEFORE. Commits should be confidence, not hope. |

## Red Flags — STOP and Verify

Catch yourself doing any of these? STOP. Run the verification command NOW.

- Using "should", "probably", "seems to", "ought to", "likely"
- Expressing satisfaction before running verification ("Great!", "Perfect!", "Done!")
- About to commit/push/PR without a fresh verification run
- Trusting a subagent's success report without checking
- Relying on a verification run from an earlier step
- Thinking "just this once" or "this is obvious"
- Tired and wanting work over — tired is when bugs slip in
- About to move to the next task without verifying the current one

**ANY wording implying success without having run verification is a violation.**

## Quick Reference

| Situation | Verification Required |
|-----------|----------------------|
| After implementing a feature | Tests pass + build succeeds |
| After fixing a bug | Reproduction test fails → fix → passes |
| After refactoring | Full test suite green + output clean |
| After subagent completes | Read diff + run tests |
| Before committing | Tests pass + no staged file is broken |
| Before creating PR | Full suite green + linter clean + build succeeds |
| Before moving to next task | Current task verified complete |

## Integration

- `test-driven-development` — produces the tests you verify against
- `subagent-driven-development` — dispatches tasks that need independent verification
- `finishing-a-development-branch` — uses this skill before presenting merge options

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
