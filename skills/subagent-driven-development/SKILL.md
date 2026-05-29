---
name: subagent-driven-development
description: Use when executing an approved implementation plan with multiple independent tasks. Do NOT use when tasks are tightly coupled and share files — use executing-plans for sequential single-session work.
---

# Subagent-Driven Development (SDD)

## Overview

Execute a plan by dispatching a fresh subagent per task, with two-stage review after each: spec compliance review first, then quality review.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration. Subagents get isolated context — never inherit your session history. You construct exactly what they need.

**Continuous execution:** Do NOT pause between tasks to check in. Execute all tasks without stopping. The only reasons to stop: a BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, or all tasks complete. "Should I continue?" wastes their time — they asked you to execute the plan.

## When to Use

**Use this when:**
- You have a written implementation plan with clearly defined tasks
- Tasks are mostly independent (touch different files)
- You want to stay in the current session (no context switch to a parallel session)

**vs. executing-plans (parallel session):**
- Same session — no context switch
- Fresh subagent per task — no context pollution
- Two-stage review after each task — spec first, quality second
- Faster iteration — no human-in-loop between tasks

**Don't use when:**
- Tasks are tightly coupled (share files, depend on each other's output)
- You don't have a written plan yet (use `writing-plans` first)
- You need to execute in a separate parallel session (use `executing-plans`)
- Only 1-2 tasks exist (just execute them directly)

## The Process

### Step 0: Read the Plan

Read the plan file once. Extract ALL tasks with full text. Note shared context (file structure, conventions, existing patterns). Create a TodoWrite with all tasks.

Do NOT dispatch tasks until you've read the entire plan. You need to understand dependencies, shared context, and ordering constraints before starting.

### Step 1: Dispatch Task Subagent

For each task, dispatch a subagent with:

1. **Full task text** — copy-pasted from the plan, not a reference
2. **Context** — relevant file structure, conventions, patterns the subagent needs
3. **Constraints** — what NOT to touch
4. **Expected output** — return a summary of what was done

The subagent's system prompt already includes TDD and other skills — you don't need to add those instructions.

**Critical: Never tell the subagent to read the plan file.** Provide the full task text directly. The subagent has zero context and reading the file wastes time.

### Step 2: Handle Subagent Status

The subagent reports one of four statuses:

| Status | Meaning | Action |
|--------|---------|--------|
| **DONE** | Implemented and committed | Proceed to spec compliance review |
| **DONE_WITH_CONCERNS** | Completed but flagged doubts | Read concerns. If correctness/scope: address before review. If observations ("this file is large"): note and proceed. |
| **NEEDS_CONTEXT** | Missing information | Provide context and re-dispatch |
| **BLOCKED** | Cannot complete | Assess: context problem? More context. Reasoning problem? Better model. Task too large? Split it. Plan wrong? Escalate to user. |

**Never** ignore an escalation or force the same subagent to retry without changes.

### Step 3: Spec Compliance Review (Stage 1)

Dispatch `spec-validation` subagent to confirm the implementation matches the plan:

- Does the code implement what the task specified?
- Missing features? Extra features not in the spec?
- Edge cases from the spec handled?
- Requirements met?

**If issues found:** Send the implementer (same subagent) back to fix. Re-review after fixes.

**Do NOT proceed to Stage 2 until Stage 1 passes.** This order is critical — quality review is meaningless if the implementation doesn't match the spec.

### Step 4: Quality Review (Stage 2)

Dispatch `quality-review` subagent to check technical debt and SNR:

- Code smells
- Duplication
- Signal-to-noise ratio
- Naming clarity
- Error handling

**If issues found:** Send implementer back to fix. Re-review. Repeat until approved.

### Step 5: Wave Integration

After all tasks in a wave complete:

1. Read the git diff from each subagent
2. Run the full test suite
3. If tests fail, isolate which task caused it and re-dispatch

### Step 6: Repeat

Proceed to the next task. Continue until all tasks are complete.

## Model Selection

| Task Type | Model |
|-----------|-------|
| Mechanical (1-2 files, clear spec, isolated) | Fast/cheap model |
| Multi-file coordination, pattern matching | Standard model |
| Architecture, design judgment, broad codebase understanding | Most capable model |

**Cost is secondary to correctness.** If a subagent fails, re-dispatch with a more capable model — don't try the same model again.

## Example Workflow

```
[Read plan — 5 tasks extracted]
[Create TodoWrite with all 5 tasks]

Task 1: Hook installation script

[Dispatch implementer subagent with full task text + context]

Implementer: "Should hooks install at user or system level?"

You: "User level (~/.config/opencode/hooks/)"

Implementer:
  - Implemented install-hook command
  - 5/5 tests passing
  - Self-review: found I missed --force flag, added it
  - Committed

[Dispatch spec-validation]
Spec reviewer: ✅ Spec compliant — all requirements met, nothing extra

[Dispatch quality-review]
Quality reviewer: Strengths: Good test coverage. Issues: None. Approved.

[Mark Task 1 complete]

Task 2: Recovery modes...

[Continue until all tasks done]
```

## What NOT to Do

**Never dispatch multiple implementation subagents in parallel.** They'll conflict editing the same files. Serialize by task.

**Never skip reviews.** Both spec-compliance AND quality-review are mandatory after every task. Skipping the spec review means you might approve wrong behavior. Skipping quality review means you approve structural rot.

**Never skip re-review loops.** If a reviewer found issues and the implementer fixed them, the reviewer must check the fix. Don't skip to "it's probably fine now."

**Never let implementer self-review replace actual review.** Both are needed. Self-review catches things before handoff. External review catches things the implementer was blind to.

**Never move to the next task while either review has open issues.** One task at a time, fully done, then next.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Dispatching parallel implementers | Serialize by task. One at a time. |
| Skipping spec-compliance review | You might approve wrong behavior. Always run Stage 1. |
| Skipping quality review | Structural rot accumulates. Always run Stage 2. |
| Starting quality review before spec passes | Wrong order. Spec first, quality second. |
| Trusting subagent summary without checking diff | Verify the diff. Subagents can make mistakes. |
| Providing plan file reference instead of full text | Subagent has no context. Provide the full text. |
| Forcing same model after BLOCKED | Change approach: more context, better model, or split task. |
| Skipping re-review after fixes | Reviewer must confirm the fix. Don't skip. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll dispatch 3 implementers at once, they touch different files" | They might not — one import change affects another. Serialize. |
| "Spec review is overkill for a simple task" | Simple tasks have simple mistakes. Always review. |
| "Quality review can wait, I'll do it at the end" | Structural rot compounds across tasks. Per-task review catches it early. |
| "The implementer said it works, I trust them" | Verify the diff. Trust + verify. |
| "I'll skip the re-review, the fix is obvious" | Obvious fixes can be wrong. Re-review. |
| "Let me just check the plan reference instead of pasting it" | The subagent will waste time reading and may miss context. |
| "I'll keep this subagent for multiple tasks, fresh context per task is wasteful" | Context pollution causes cross-task confusion. Fresh per task. |

## Red Flags — STOP

- Dispatching multiple implementers in parallel
- Skipping either review stage
- Starting quality review before spec review passes
- Moving to next task while reviews have open issues
- Not verifying the subagent's diff
- Forcing same model + same approach after BLOCKED
- Accepting "close enough" on spec compliance
- Letting implementer self-review replace formal review

## Integration

**Required before this skill:**
- `writing-plans` — produces the plan this skill executes

**Required after this skill:**
- `verification-before-completion` — verify all tasks pass before claiming completion
- `finishing-a-development-branch` — present merge/PR/discard options

**Subagents used by this skill:**
- `spec-validation` — Stage 1 review (spec vs implementation)
- `quality-review` — Stage 2 review (code quality, technical debt)

**Subagents should use:**
- `test-driven-development` — enforced by their system prompts
