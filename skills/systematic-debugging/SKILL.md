---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior — before proposing fixes. Do NOT use when you need to research an API or how something works (use code exploration instead).
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** Find the root cause before attempting any fix. Symptom fixes are failures — they leave the real problem alive and often create new ones.

**Violating the letter of this process is violating the spirit of debugging.**

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1 (Root Cause Investigation), you cannot propose fixes. Not "tentative fixes." Not "just checking." Not "quick patches." No fixes.

**This is non-negotiable:**
- Don't "just try something to see what happens"
- Don't guess and check
- Don't propose fixes while investigating
- Don't "fix one thing and then investigate the rest"

Symptom fixes don't solve problems. They hide them.

## When to Use

Use this skill for ANY technical issue:
- Test failures (flaky or consistent)
- Production bugs
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues
- Configuration that doesn't work as expected

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting — resist)
- "Just one quick fix" seems obvious (it never is)
- You've already tried multiple fixes (stop and think)
- The previous fix didn't work (you treated symptoms, not root cause)
- You don't fully understand the issue (that's the point of this skill)

**Don't skip when:**
- The issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Someone wants it fixed NOW (systematic is faster than thrashing)

## The Four Phases

Complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely — every frame
   - Note line numbers, file paths, error codes
   - Google the exact error if unfamiliar

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible → gather more data, don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - `git diff`, `git log --oneline -10`
   - New dependencies, config changes
   - Environmental differences (OS, Node version, etc.)

4. **Trace Data Flow (Backward Tracing)**

   Start at the symptom and trace backward to find the origin:

   ```
   Error at line 42 → What called this function?
     → What called that function?
       → Where does the bad value originate?
         → Fix at source, not at symptom
   ```

   For each component boundary, add diagnostic instrumentation:

   ```bash
   # Layer 1: Input
   echo "=== Input received ==="
   echo "arg: $arg"

   # Layer 2: Processing
   echo "=== Processing state ==="
   echo "intermediate: $result"

   # Layer 3: Output
   echo "=== Output produced ==="
   echo "result: $output"
   ```

   This reveals exactly which layer fails — not just that something is wrong.

5. **Gather Evidence in Multi-Component Systems**

   When the system has multiple components (CI → build → signing, API → service → database):

   ```
   For EACH component boundary:
     - Log what data enters the component
     - Log what data exits the component
     - Verify environment/config propagation
     - Check state at each layer
   ```

   Run once to gather evidence showing WHERE it breaks. THEN analyze evidence. THEN investigate that specific component.

### Phase 2: Pattern Analysis

Before fixing, understand the pattern:

1. **Find Working Examples**
   - Locate similar working code in the same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - If implementing a known pattern, read the reference implementation completely
   - Don't skim — read every line
   - Understand the pattern fully before applying

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small
   - Don't assume "that can't matter"

4. **Understand Dependencies**
   - What other components does this need?
   - What settings, config, environment?
   - What assumptions does it make?

### Phase 3: Hypothesis and Testing (Self-Consistency)

Scientific method applied to debugging:

1. **Generate Multiple Hypotheses**
   - Generate 3-5 independent explanations for the bug
   - Each from a different reasoning path:
     - Path A: Forward from inputs
     - Path B: Backward from error
     - Path C: From structural patterns
     - Path D: From recent changes
     - Path E: From adversarial edge cases

2. **Vote and Select**
   - The most frequent answer wins (majority vote)
   - If confidence < 60%, you need more evidence
   - If all 5 disagree, you don't understand the problem yet

3. **Test the Winning Hypothesis Minimally**
   - Make the SMALLEST possible change to test it
   - One variable at a time
   - Don't fix multiple things at once

4. **Evaluate**
   - Did it work? → Phase 4 (Implementation)
   - Didn't work? → Form a NEW hypothesis, return to Phase 3
   - DON'T add more fixes on top

5. **When You Don't Know**
   - Say "I don't understand X"
   - Don't pretend to know
   - Research more
   - Ask for help

### Phase 4: Implementation

Fix the root cause, not the symptom:

1. **Create a Failing Test Case**
   - Simplest possible reproduction
   - Automated test if possible
   - One-off test script if no framework
   - MUST have before fixing
   - Use `test-driven-development` skill for writing proper failing tests

2. **Implement ONE Fix**
   - Address the root cause you identified
   - ONE change at a time
   - No "while I'm here" improvements
   - No bundled refactoring

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?
   - Issue actually resolved?
   - Run the full test suite

4. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - If ≥ 3: STOP and question the architecture (see below)

5. **If 3+ Fixes Failed: Question the Architecture**

   Pattern that indicates an architectural problem:
   - Each fix reveals new shared state/coupling in a different place
   - Fixes require "massive refactoring" to implement
   - Each fix creates new symptoms elsewhere

   STOP and question fundamentals:
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor the architecture vs. continue fixing symptoms?

   Discuss with the user before attempting more fixes. This is not a failed hypothesis — this is a wrong architecture.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Fixing symptoms instead of root cause | Trace back to the origin. Fix there. |
| Multiple changes at once | One change. Verify. If it worked, you know what did it. |
| Skipping reproduction | If you can't reproduce it, you can't verify it's fixed. |
| Guessing instead of investigating | Evidence first. Hypotheses second. Fixes third. |
| Assuming "that can't matter" | Check everything. The universe is sneaky. |
| Fixing without a test | You'll never know if the fix worked, or if it regresses. |
| Ignoring the error message | Error messages are the cheapest debug tool you have. Read them. |
| "One more fix" (after 2+ failures) | 3+ failures = architectural problem. Discuss with user. |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process takes 30 seconds for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question the pattern. |
| "The error message is probably wrong" | The error message is the most reliable information you have. |
| "I know this codebase, I can skip tracing" | Familiarity breeds blind spots. Trace anyway. |
| "Let me just revert and try again" | Reverting without understanding guarantees you'll hit it again. |

## Red Flags — STOP and Follow Process

If you catch yourself thinking any of these, you're about to violate the Iron Law. STOP and return to Phase 1.

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)
- Each fix reveals a new problem in a different place
- "The error can't be right, let me check the code instead"
- "I don't need to check recent changes, I know what caused this"

**All of these mean: STOP. Return to Phase 1.**

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, trace data flow | You understand WHAT broke and WHY |
| **2. Pattern** | Find working examples, compare, list differences | You know what's different between working and broken |
| **3. Hypothesis** | Generate 3-5 explanations, vote, test minimally | Confirmed root cause or new hypothesis |
| **4. Implementation** | Write failing test, fix root cause, verify | Bug fixed, test passes, no regressions |

## Integration

**Always use before:**
- `test-driven-development` — to write the regression test that proves the fix
- `verification-before-completion` — to verify the fix works

**Related skills:**
- `self-consistency-reasoner` — for multi-path hypothesis generation (Phase 3)
- `error-recovery` — to document complex platform bugs in `known-issues.md`

## When Process Reveals "No Root Cause"

If systematic investigation shows the issue is environmental, timing-dependent, or external:
1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

But: 95% of "no root cause" cases are incomplete investigation. Go deeper before concluding.
