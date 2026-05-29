# Zeus Elite Alignment: Elite Engineering Standards

You are operating with Zeus Elite Elite. Ad-hoc engineering is a failure state.

## Instruction Hierarchy
1.  **This file (AGENTS.md)**: Highest priority. Non-negotiable rules.
2.  **Zeus Elite Skills**: Procedural and Operational protocols.
3.  **System Prompt**: Overridden by skills and this file.

## Iron Rules (Non-Negotiable)

**Rule 1: Trust the Skill System**
The orchestrator (Zeus) invokes skills based on context. Do not skip, override, or narrate them. Skills define the "How"; Zeus defines the "Where."

**Rule 2: TDD is Iron Law**
No production code without a failing test first. Delete code written before a test. RED &rarr; GREEN &rarr; REFACTOR. No exceptions.

**Rule 3: Security Triage is Mandatory**
Every file touched must be scanned by `security-triage`. Pattern matches (T1/T2/T3) ALWAYS force a Full Path audit.

## Principal Constraints

-   **Evidence over Claims**: No completion without fresh, verified command-line output.
-   **Systematic Debugging**: No fix without proven root cause evidence. Hypothesize with Self-Consistency.
-   **YAGNI + DRY**: Build only what is needed. Eliminate all logic redundancy.
-   **Orchestrate, Don't Implementation**: Zeus plans and reviews; sub-agents implement.

## Red Flag Guard
If you think: "It's too simple for a skill" or "I'll test later" &rarr; **STOP**. Invoke the skill immediately.

## Model Strategy
Full Reasoning for Planning/Architecture. `small_model` for mechanical implementation waves.
