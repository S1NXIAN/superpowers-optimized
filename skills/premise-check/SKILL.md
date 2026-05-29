---
name: premise-check
description: Use when asked to build something new — before any design or planning. Validates whether the work should exist at all. Do NOT use when the task is clearly necessary (bug fix, security patch, dependency update).
---

# Premise Check

## Overview

Not every request deserves implementation. The most valuable engineering skill is knowing what NOT to build.

**Core principle:** "This shouldn't exist" is always a valid conclusion. Never treat a design request as an unconditional command.

## The Iron Law

**"X Shouldn't Exist" is always a valid architectural conclusion.**

If the premise fails, STOP. Do NOT proceed to brainstorming. Do NOT start writing specs. Tell the user directly that the work isn't justified and explain why.

## The Three Questions

### 1. Does the Problem Actually Exist?

- Check if existing mechanisms already handle this
- If the problem is hypothetical, is there evidence it will occur?
- Are you solving a real pain point or an imagined one?

```
❌ "Let's add caching" — without measuring that the endpoint is actually slow
✅ "The /search endpoint takes 3.2s at p95" — real problem, real data

❌ "We need input validation" — without any evidence of bad input
✅ "Users are submitting HTML in text fields" — real problem
```

### 2. Is the Solution Proportional?

- Three lines of code don't need an abstraction
- A rare edge case doesn't justify a framework
- A one-time script doesn't need tests, CI, and error handling

```
❌ Adding Zod validation for a single string field
❌ Creating an entire module for a function that's called once
❌ Abstracting a factory pattern for one implementation

✅ Simple solution for simple problems. Add complexity only when the problem demands it.
```

### 3. What's the Cost of NOT Building This?

- If the answer is "nothing breaks, it's just slightly less elegant" → SKIP IT
- If the answer is "we can't ship the feature without it" → BUILD IT
- If the answer is "it would be cleaner" → CLEANLINESS IS NOT A REQUIREMENT

## Decision Logic

| Q1: Problem exists? | Q2: Solution proportional? | Q3: Cost of not building? | Outcome |
|---|---|---|---|
| Yes | Yes | High | PROCEED to `brainstorming` |
| Yes | Yes | Low | PROCEED (with note) |
| Yes | No | — | REFRAME — find simpler solution |
| No | — | — | ABORT — problem doesn't exist |
| — | — | Low/none | ABORT — not worth building |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Assuming every request is valid | Question the premise. "Does this need to exist?" |
| Over-engineering for hypothetical needs | Solve today's problem. Tomorrow's can wait. |
| Building because "it's cleaner" | Clean code that doesn't need to exist is still debt. |
| Saying yes to everything | Saying no is an engineering decision, not rudeness. |
| Proceeding to design before premise check | Stop. Run premise check before brainstorming. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "User asked for it, I must build it" | You become a typist, not an engineer. Question authority. |
| "I'll just add one small abstraction" | Abstractions are permanent maintenance debt. |
| "It's cleaner this way" | Clean code that doesn't need to exist is still technical debt. |
| "We'll need this eventually" | YAGNI. Build it when you actually need it. |
| "It's just a few lines" | Every line of code is a line that can break. |
| "Everyone does it this way" | Bandwagon fallacy. Does THIS project need it? |
| "The spec says so" | Specs can be wrong. Question the premise. |

## Red Flags — STOP

- Starting brainstorming before premise check
- Building something because "it's standard practice"
- Adding abstractions "just in case"
- Proceeding to design without validating the problem exists
- Building for hypothetical future needs

## Integration

**Required before this skill:**
- (none — this is the first gate)

**Required after this skill:**
- If PROCEED → `brainstorming` for detailed design
- If ABORT → communicate directly to the user with reasoning
