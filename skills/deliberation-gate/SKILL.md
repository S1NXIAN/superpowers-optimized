---
name: deliberation-gate
description: High-SNR strategy gate. Simulates conflicting stakeholders to determine if a design is sound or should be aborted.
---

# Deliberation Gate

Surface Tension. Determine Exit.

## The Iron Rule
**Consensus is not the goal; understanding the trade-off is.** Load this skill ONLY for Tier-3 tasks (4+ files, new subsystem, or security triggers).

## Phase 1: Frame the Decision
Define the choice in one elite sentence. 
- *Bad:* "How to build auth?"
- *Elite:* "Should we implement custom JWT logic or extend the existing OAuth2 provider?"

## Phase 2: Assemble the Siege Team
Select 3 specialized perspectives (Zeus picks based on task):
- **1. Auditor (Mandatory):** Minimalist (YAGNI), Skeptic (Security), or Maintainer (Debt).
- **2. Contextual Expert:** Hacker (Security), UX (UI), or Ops (Deployment).
- **3. The "Opponent":** The role that would naturally hate the proposed choice.

## Phase 3: The Single-Voice Round
Each role speaks once. 3 sentences max.
- **Values:** What they protect.
- **Concern:** The specific point of failure.
- **Lost Ground:** What we lose if we pick Option A over B.

## Phase 4: Exit Logic
Synthesize into one of three states:
1.  **PROCEED:** Move to `brainstorming`.
2.  **REFRAME:** Decision is flawed; restart deliberation with new framing.
3.  **ABORT:** Violates YAGNI/Security; return to `premise-check`.

## Rationalization Table

| Temptation | Risk |
| :--- | :--- |
| "I'll just agree with the user" | Mediocre architecture. High regression risk. |
| "Skip to the design" | Design without deliberation is just guessing. |
