---
name: executing-plans
description: Executes approved plans in controlled batches with verification checkpoints.
---

# Executing Plans

Implement an approved plan in controlled batches with explicit verification.

## Required Start

Announce: `I'm using the executing-plans skill to implement this plan.`

## Execution Process

### Step 1: Load and Review Plan
1. Read the plan completely.
2. Review critically — identify any questions or concerns.
3. If concerns: raise them with the user before starting.
4. If no concerns: create task tracking and proceed.

### Step 2: Execute Tasks
For each task in the plan:
1. Follow each step exactly.
2. Run verifications as specified.
3. For UI/frontend tasks, apply guidance from `frontend-design`.
4. Mark task complete.

### Engineering Rigor for Complex Tasks
When a task is architectural, high-risk, or crosses module boundaries:
- Validate the approach against requirements before coding.
- Identify edge cases and error paths.
- Consider simpler architectures or alternative approaches.
- If 2 implementation attempts fail, pause and reassess.

## Execution Rules
- Do not skip plan steps unless user approves deviation.
- Keep edits scoped to the current task.
- Do not claim completion without fresh command output.

**Stop immediately and ask for clarification when:**
- A dependency is missing or unavailable.
- The plan has a critical gap.
- An instruction is unclear or contradictory.
- Verification fails repeatedly (2+ attempts).

## Context Hygiene
For each task, keep only:
- Current task details
- Constraints
- Relevant prior decisions
- Verification evidence

Do not carry long historical summaries. Never forward full session history to subagents — construct their prompts from scratch.

## Parallel vs Sequential
- For complex multi-file work, invoke `subagent-driven-development` instead for parallel wave execution.
- For simple sequential work, continue with this skill.

## Completion
1. Run full verification.
2. Invoke `finishing-a-development-branch`.

## Rationalization Table

| Temptation | Danger |
| :--- | :--- |
| "I'll skip reviewing the plan, I remember it" | Missing a critical step causes rework. |
| "Let me handle 3 tasks at once without subagents" | Context bleed leads to cross-contamination. |
| "I'll trust the sub-agent's summary" | Sub-agents lie about completion. Always verify the diff. |
