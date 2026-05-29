---
name: subagent-driven-development
description: Parallel Wave execution engine. Dispatches Strike Teams in single-turn bursts for maximum somatic performance.
---

# Subagent-Driven Development (SDD)

Maximum Firepower. Parallel Force.

## Turn-Level Parallelism
**NEVER serialize independent work.** 
- If 3 tasks in the plan are disjoint (touch separate files): Dispatch 3 Implementers in **ONE response** using multiple tool calls.
- **Cache Optimization:** This allows the API to hit the cached system prompt for all 3 agents simultaneously.

## The Operational Wave
1.  **WAVE Grouping:** Parse the `plan.md` and group tasks by file-disjointness.
 2.  **Strike Handoff:** Use the subagent's system prompt as the Task tool prompt.
3.  **Two-Stage Review Gate:**
    - **Stage 1 (Spec):** `spec-validation` confirms implementation matches plan.
    - **Stage 2 (Quality):** `quality-review` checks for technical debt and SNR.
4.  **Wave Integration:** Run the full project test suite after the Wave is complete.

## Agent Hygiene
- **Isolate Context:** Never forward parent history to sub-agents. 
- **Verify Diff:** Read the `git diff` of the sub-agent's work. Do not trust their summary.
- **Pkill:** Force sub-agents to kill background services before and after test runs.

## Rationalization Table

| Temptation | Danger |
| :--- | :--- |
| "I'll wait for the first agent to finish" | Wastes 2-3 minutes of developer time per task. |
| "Forward my full context to the agent" | Wastes thousands of tokens and dilutes agent focus. |
| "Skip the quality gate for a wave" | Approving structural rot speeds up work today and kills it tomorrow. |
