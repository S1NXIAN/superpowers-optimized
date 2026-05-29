---
name: writing-plans
description: Precision implementation planning with mandatory blast-radius analysis and TDD sequencing.
---

# Writing Plans

Precision Mapping. Zero Ambiguity.

## The Somatic Scan (Blast Radius)
Before defining tasks, perform a mandatory **Call-Graph Audit**:
1.  **Callers:** Find what other modules call this code.
2.  **Dependencies:** Identify what this code depends on.
3.  **Side Effects:** Explicitly state if this change will force updates in `tests/`, `configs/`, or `migrations/`.

## Task Mandates
1.  **TDD Motor:** Every logical change MUST include a Step 1: "Write failing test" and a Step 2: "Verify RED."
2.  **Atomic Precision:** Keep each task to a 2-5 minute vertical slice.
3.  **No Placeholders:** Never use "update logic" or "add validation." Show the exact code or command.

## Self-Review Checklist
- [ ] **Spec Alignment:** Every requirement in the design has a vertical task.
- [ ] **Zero Slop:** No "placeholder" comments or "initial versions."
- [ ] **Safety:** All `rm` or `chmod` commands are screened by the Command Guard.

## Ready Gate
Invoke `subagent-driven-development` for parallel execution or `executing-plans` for sequential.

## Rationalization Table

| Temptation | Risk |
| :--- | :--- |
| "I'll group these 3 small files into one task" | Context bleed and difficult debugging if a test fails. |
| "Write tests after implementation" | Tests will pass for the wrong reasons. The behavior is unverified. |
| "Skip the blast-radius check" | Breaking remote modules that you forgot existed. |
