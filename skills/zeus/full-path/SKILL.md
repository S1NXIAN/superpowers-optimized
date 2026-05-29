---
name: zeus/full-path
description: The authoritative 8-stage engineering pipeline for complex, multi-file, or high-risk tasks.
---

# Full Path Workflow

High-discipline execution machine for production-grade software.

## Iron Laws
- **Evidence before claims**: Never say "done" without command-line proof.
- **Security triage is non-negotiable**: Pattern triggers always escalate to audit.
- **YAGNI + DRY**: Never build more than requested; eliminate all redundancy.

## Elite Pipeline Phases

### Phase 1: Premise Check (Gate 1)
Invoke `premise-check`. Answer the 3 brutal questions. If the feature is "slop" or over-engineered, stop and suggest the simplest alternative to the user.

### Phase 2: Specialized Team Audit (Gate 2)
Run `scripts/skills.sh audit <files>` to identify the strike team. 
Dispatch `architect` and `hacker` sub-agents to siege the high-level approach.
**Parallel Rule:** Dispatch both simultaneously in a single Turn.

### Phase 3: Brainstorming & Spec Approval
Invoke `brainstorming`. Explore requirements. Produce the Design Doc in `docs/zeus/specs/`. 
**Requirement:** Failure-mode check (adversarial reasoning) before approval.

### Phase 4: Implementation Planning
Invoke `writing-plans`. Break work into 2-5 min tasks. 
Dispatch `qa-pro` to review the verification steps before the plan is locked.

### Phase 5: Parallel SDD Execution
Invoke `subagent-driven-development`. 
Execute in **Parallel Waves**. Group independent tasks into single-turn dispatches.
Strict Two-Stage Review (Spec -> Code Quality).

### Phase 6: Verification & Self-Consistency
Invoke `self-consistency-reasoner`.
Generate 5 independent hypotheses on the final state. All must agree on correctness.

### Phase 7: Review, Merge & Branch Finalization
Present final summary with verification evidence. 
Invoke `finishing-a-development-branch` only after explicit user approval.

### Phase 8: Automated Cleanup
Run `$HOME/.config/opencode/bin/cleanup.mjs` to purge AI artifacts.

## Rationalization Table

| Temptation | Risk |
| :--- | :--- |
| "Skip Premise Check, user wants it" | We are engineers, not typists. Build what is needed, not what is asked. |
| "Brainstorming is overkill here" | Unexamined assumptions cause 90% of architectural reworks. |
| "Sequential implementation is safer" | Parallel execution is 3x faster with the same quality if files are disjoint. |
