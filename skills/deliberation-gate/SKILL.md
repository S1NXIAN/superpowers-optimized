---
name: deliberation-gate
description: Use when facing a high-stakes architectural or strategic decision with multiple valid approaches — before committing to a design direction. Do NOT use for routine implementation decisions that don't change project architecture.
---

# Deliberation Gate

## Overview

Simulate conflicting stakeholder perspectives to expose hidden trade-offs, failure modes, and blind spots before committing to a technical direction.

**Core principle:** Consensus is not the goal; understanding the trade-off landscape is. If everyone agrees too easily, you haven't found the real tension.

**Announce at start:** "I'm using the deliberation-gate skill to evaluate this decision."

## When to Use

**Use this for:**
- Architecture choices with long-term impact (framework, database, deployment model)
- Security-sensitive decisions (auth model, data encryption, API design)
- Decisions where multiple approaches have strong arguments
- Decisions where the wrong choice would be expensive to undo
- When you feel uncertain about which path is right

**Don't use for:**
- Routine implementation details (which variable name, which import style)
- Decisions with obvious correct answers
- Tasks that are purely mechanical (dependency bump, config change)
- When the user has already made a clear decision (don't re-litigate)

## The Process

### Phase 1: Frame the Decision

Define the choice in a single, precise sentence:

```
❌ Bad: "How to build auth?"
✅ Good: "Should we implement custom JWT login or extend the existing OAuth2 provider?"
❌ Bad: "How should we store data?"
✅ Good: "Should we use PostgreSQL with raw SQL or add Prisma ORM?"
```

A well-framed decision:
- Names both (or more) concrete alternatives
- Specifies the scope (what's included, what's not)
- Makes the trade-off explicit

### Phase 2: Select 3 Perspectives

Pick exactly 3 stakeholder perspectives based on the decision type:

| Perspective | When to Use | What They Protect |
|-------------|-------------|-------------------|
| **Auditor** | Always (mandatory) | Simplicity, security, future maintenance cost |
| **Hacker** | Security-sensitive decisions | Attack surface, data exposure, escalation paths |
| **UX** | UI or API design decisions | Developer experience, learning curve, ergonomics |
| **Ops** | Deployment/infra decisions | Operational cost, monitoring, recovery, scaling |
| **Opponent** | When everyone agrees too easily | The opposite of the consensus view — what are we NOT seeing? |

**Always include the Auditor.** Then pick 2 more based on the decision domain.

### Phase 3: Each Perspective Speaks Once

Each perspective gets exactly 3 sentences:
1. **What they value** — the principle they're protecting
2. **Their specific concern** — the precise point of failure they see
3. **What we lose** — what we give up by choosing the other option

Format:
```
**Auditor:**
Values: Minimum moving parts. Fewer dependencies = fewer CVEs.
Concern: Custom JWT means we own token rotation, key management, and revocation — that's 4 new failure modes.
Lost Ground: If we pick JWT, we lose OAuth2's built-in token lifecycle management and standard library support.
```

### Phase 4: Synthesize

Synthesize the 3 perspectives into one of three states:

| State | Meaning | Next Action |
|-------|---------|-------------|
| **PROCEED** | Decision is sound. Trade-offs are understood and acceptable. | Move to `brainstorming` for detailed design. |
| **REFRAME** | Decision is poorly framed. The real choice is different. | Restart Phase 1 with a new framing. |
| **ABORT** | Decision violates core principles (YAGNI, security, maintainability). | Return to `premise-check` — the work itself may not be needed. |

Synthesize format:
```
**Verdict:** PROCEED
**Why:** All three perspectives agree the OAuth2 extension is lower risk.
          The Auditor's concern about complexity is real but manageable.
**Trade-off accepted:** Slightly more initial setup time in exchange for
          not owning token lifecycle management.
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Choosing perspectives that all agree | Pick opposing perspectives deliberately. |
| Making the frame too vague | "How to build X" is not a frame. Name concrete alternatives. |
| Letting one perspective dominate | Each gets exactly 3 sentences, once. |
| Skipping the synthesis | Always output PROCEED/REFRAME/ABORT with reasoning. |
| Using deliberation for routine decisions | Deliberation is for high-stakes only. Use judgment. |
| Forcing agreement | If perspectives disagree, that's useful tension. Synthesize anyway. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll just agree with the user's first idea" | You miss better alternatives. Deliberate. |
| "Skip deliberation, go straight to design" | Design without trade-off analysis is guessing at scale. |
| "Everyone agrees, no need for perspectives" | Agreement without deliberation = groupthink. |
| "This is too nuanced for 3 sentences each" | 3 sentences forces clarity. Verbosity hides weak reasoning. |
| "I'll add more perspectives for thoroughness" | 3 is enough. More dilute the signal. |
| "The user already decided, don't question it" | Deliberation validates decisions. Questioning is respect. |

## Red Flags — STOP

- Skipping deliberation for high-stakes decisions
- Loading this skill for routine decisions (overhead)
- Letting one perspective talk longer than others
- The frame is a question not a choice ("how to X" not "X vs Y")
- Everyone agrees suspiciously fast
- You're using deliberation to justify a decision already made

## Integration

**Required before this skill:**
- `premise-check` — validates the work exists at all before deliberating approaches

**Required after this skill:**
- If PROCEED → `brainstorming` for detailed design
- If REFRAME → restart deliberation with new framing
- If ABORT → `premise-check` to validate if work is needed
