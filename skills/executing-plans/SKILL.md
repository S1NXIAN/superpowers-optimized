---
name: executing-plans
description: Use when you have a written implementation plan and tasks are tightly coupled or you need sequential execution with review checkpoints in a single session. Do NOT use for independent tasks that could run in parallel — use subagent-driven-development instead.
---

# Executing Plans

## Overview

Execute a written implementation plan sequentially in a single session with review checkpoints.

**Core principle:** Read the plan critically, execute tasks exactly as specified, verify after each batch, and never skip steps.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## When to Use

**Use this when:**
- Tasks are tightly coupled (share files, depend on each other's output)
- You're executing in this session (no context switch)
- You prefer sequential execution over parallel subagents
- The plan has 1-5 small tasks that don't justify subagent dispatch overhead

**vs. subagent-driven-development (same session):**
- Sequential execution — each task runs in the same context
- Manual verification — you check each task yourself
- No subagent overhead — better for small plans
- But also: context pollution risk — carryover from one task to the next

## The Process

### Step 1: Load and Review Plan

1. Read the plan file completely
2. Review critically — identify any questions, concerns, or gaps
3. If concerns: raise them with the user before starting
4. If no concerns: create a TodoWrite with all tasks and proceed

### Step 2: Execute Tasks

For each task in order:

1. Mark as `in_progress` in TodoWrite
2. Follow each step exactly — do NOT skip steps
3. Run the specified verification after each step
4. If a step fails, STOP and investigate before proceeding
5. Mark as `completed` only when all steps pass

### Step 3: Verify After Each Batch

At natural breakpoints (every 2-3 tasks, or when the plan specifies):

1. Run the full test suite
2. Run the linter
3. Run the build
4. Fix any regressions before continuing

### Step 4: Complete

After all tasks are done and verified:

1. Run the full test suite one final time
2. Invoke `finishing-a-development-branch` to present merge/PR/discard options

## What to Do When Blocked

**STOP immediately when:**
- A dependency is missing or unavailable
- The plan has a critical gap that prevents starting a task
- An instruction is unclear or contradictory
- Verification fails repeatedly (2+ attempts on the same step)

**Ask for clarification rather than guessing.** Guessing creates bugs that are harder to fix than asking a question.

**Don't**
- Force through blockers
- Skip steps because "they seem unnecessary"
- Guess what an unclear instruction means
- Fix something you're not sure about and hope

## Context Hygiene

For each task, keep in context only:
- Current task details
- Constraints
- Relevant prior decisions (not the full history)
- Verification evidence

Do NOT carry long historical summaries between tasks. Each task starts fresh except for what's truly shared (file structure, architecture decisions).

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Reading the plan once and relying on memory | Refer back to the plan for every task. |
| Skipping verification steps | Every step has a verification. Run it. |
| Carrying context between tasks | Clear context between tasks. Only keep what's relevant. |
| Fixing bugs without understanding root cause | Use `systematic-debugging` before fixing. |
| Making assumptions about unclear instructions | Ask for clarification. Don't guess. |
| Continuing after repeated verification failures | Stop at 2+ failures. Investigate with `systematic-debugging`. |
| Bypassing TDD steps in the plan | If the plan says "write test first", do it. The plan is the law. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I remember the plan, no need to re-read" | You'll miss a step. Read each task before executing it. |
| "I'll skip reviewing the plan, I wrote it" | Critical review catches assumptions. Review with fresh eyes. |
| "Let me handle 3 tasks at once to save time" | Context bleed. One task at a time. |
| "I'll skip the linter check, it's not important" | Linter catches real bugs. Run it. |
| "The verification step is redundant" | Redundant verification catches things you missed. Run it. |
| "I'll fix this bug quickly while implementing" | Scope creep. Finish the task, then fix bugs separately. |
| "I'll figure out the unclear part myself" | Ask. Guessing wastes more time than asking. |

## Red Flags — STOP

- Bypassing a step in the plan
- Not running a specified verification
- Continuing after 2+ verification failures without investigation
- Implementing something you're unsure about
- Adding features not in the plan
- Fixing unrelated bugs "while I'm here"
- Not re-reading the plan task before starting it

## Integration

**Required before this skill:**
- `writing-plans` — produces the plan this skill executes

**Required after this skill:**
- `finishing-a-development-branch` — present merge/PR/discard options

**Related skills:**
- `subagent-driven-development` — preferred alternative for independent tasks
- `systematic-debugging` — when verification fails and you need root cause
