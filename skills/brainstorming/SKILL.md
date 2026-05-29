---
name: brainstorming
description: Adversarial design gate. Pressure-tests requirements into approved specs with mandatory failure-mode analysis.
---

# Brainstorming

Siege the Idea. Build the Mind.

## Hard Gate: The Immune Response
**Approval is impossible without a Stress Test.** 
- Before design approval, you MUST state **3 concrete ways** this design will fail (e.g., race conditions, memory leaks, scale limits, edge-case collisions).
- If a Critical failure is identified &rarr; **ABORT** &rarr; Redesign the core idea.

## Operational Cycle
1.  **Context Probe:** Map the target somatic region (files, docs, recent commits).
2.  **The Single Turn:** Ask ALL clarifying questions in a single response turn. Use multiple-choice where possible.
3.  **The Siege:** Propose 2-3 approaches with trade-offs. Perform the Failure-Mode check on the recommended path.
4.  **The Blueprint:** Save approved design to `docs/zeus/specs/YYYY-MM-DD-<topic>.md`.

## Rationalization Table

| Temptation | Risk |
| :--- | :--- |
| "I'll ask questions one by one" | Drains token efficiency and wastes developer focus. |
| "This is too simple for a stress test" | Hidden assumptions cause 90% of implementation regressions. |
| "Polite design is better" | Politeness hides flaws. Adversarial reasoning reveals them. |

## Exit
Invoke `writing-plans`.
