---
name: brainstorming
description: Use before any creative or design work — creating features, building components, adding functionality, or modifying behavior. Do NOT use for mechanical bug fixes, dependency updates, or pure refactoring with no behavioral change.
---

# Brainstorming

## Overview

Turn ideas into fully formed designs through adversarial questioning before writing any code.

**Core principle:** Every project goes through design, regardless of perceived simplicity. "Simple" projects are where unexamined assumptions cause the most wasted work.

**Announce at start:** "I'm using the brainstorming skill to design this feature."

## The Hard Gate

**Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.**

This applies to EVERY project — a todo list, a single-function utility, a config change. All of them.

The design can be short (a few sentences for genuinely simple projects), but you MUST present it and get approval before acting.

## The Process

### 1. Explore Current Context

Before proposing anything, understand what exists:

- Check project files, docs, recent commits
- Understand the existing architecture
- Identify where the new work fits

### 2. Ask Clarifying Questions

**Ask ALL clarifying questions in a single response turn.** Do not string the user along one question at a time.

- Use multiple-choice questions when possible
- Focus on: purpose, constraints, success criteria
- If the request describes multiple independent subsystems (e.g., "build a platform with chat, file storage, billing"), flag this immediately and help decompose

### 3. Propose 2-3 Approaches

Present options with trade-offs and your recommendation:

- Lead with your recommended approach and explain why
- Each option gets: approach description, pros, cons
- **Mandatory: For the recommended approach, identify 3 specific ways it could fail** (race conditions, memory leaks, scale limits, edge-case collisions). If any failure is Critical → ABORT and redesign.

### 4. Present the Design

Once you understand what you're building, present the design section by section:

- **Architecture** — major components and their relationships
- **Data flow** — how data moves through the system
- **Error handling** — what happens when things go wrong
- **Testing strategy** — how each component is verified

Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced. Ask after each section whether it looks right.

### 5. Write the Design Doc

After approval, save the spec to `docs/zeus/specs/YYYY-MM-DD-<topic>.md`:

- Cover: architecture, components, data flow, error handling, testing
- Break into smaller units with clear boundaries
- Each unit should answer: what does it do, how do you use it, what does it depend on?

### 6. Spec Self-Review

After writing, check for:

- **Placeholders** — any "TBD", "TODO", incomplete sections? Fix them.
- **Consistency** — do any sections contradict each other?
- **Scope** — focused enough for a single implementation plan?
- **Ambiguity** — could any requirement be interpreted two ways? Pick one and make it explicit.

### 7. User Review Gate

Ask the user to review:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start implementation."

Wait for their response. If changes requested, fix and re-run spec self-review. Only proceed when approved.

### 8. Transition to Implementation

Invoke `writing-plans` to create the implementation plan. Do NOT invoke any other skill — writing-plans is the only next step.

## Design Principles

- **One question at a time** — within a single turn, batch all questions
- **YAGNI ruthlessly** — remove unnecessary features
- **Explore alternatives** — always propose 2-3 approaches
- **Incremental validation** — present design, get approval, then move on
- **Design for isolation** — small units with clear interfaces, testable independently
- **Be flexible** — go back and clarify when something doesn't make sense

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Asking questions one at a time | Batch ALL questions in a single turn. |
| Skipping design for "simple" projects | Simple is where assumptions hide. Design anyway. |
| Writing code before design approval | Hard Gate violation. Stop. Present design first. |
| Not proposing alternatives | Always 2-3 approaches with trade-offs. |
| Vague spec with TODOs | Fill every placeholder before presenting. |
| Skipping the failure-mode check | Identify 3 ways the recommended approach could fail. |
| Moving directly to implementation | Invoke `writing-plans` next. Not an implementation skill. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "This is too simple for a design" | Hidden assumptions cause 90% of implementation regressions. |
| "I'll ask questions one at a time" | Wastes the user's time. Batch all questions. |
| "I know what they want, skip to implementation" | You don't know until you check. Hard Gate violation. |
| "Polite design is better" | Politeness hides flaws. Adversarial reasoning reveals them. |
| "We already discussed this, skip the write-up" | Writing formalizes decisions. Document it. |
| "The user just wants it built, not designed" | Designing first builds it faster with fewer mistakes. |
| "Too many options will confuse them" | 2-3 options shows you've thought through the space. |

## Red Flags — STOP

- About to write code before design is approved
- Starting implementation directly from a user request
- Writing tests before the design is documented
- Designing in your head without writing it down
- Skipping the failure-mode analysis
- Moving from brainstorming to anything other than `writing-plans`

## Integration

**Required after this skill:**
- `writing-plans` — creates the implementation plan from the approved design

**Sub-skills:**
- `premise-check` — validates if the work should exist at all (run before brainstorming)
