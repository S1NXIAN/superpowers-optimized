---
name: self-consistency-reasoner
description: Use when facing a complex or high-stakes reasoning problem — root cause analysis, architectural decisions, ambiguous bugs. Do NOT use for simple yes/no questions where the answer is obvious from available evidence.
---

# Self-Consistency Reasoner

## Overview

Single-path reasoning is vulnerable to hallucinations. By generating multiple independent reasoning paths and comparing their conclusions, you surface disagreements before they become bugs.

**Core principle:** A confident-sounding single-path answer is a hallucination risk. Never trust the first path for complex logic.

## When to Use

**Use this for:**
- Root cause analysis with 3+ possible explanations
- Architectural decisions with trade-offs between approaches
- Ambiguous bugs where the error message points multiple directions
- High-stakes refactoring where a wrong choice costs significant rework

**Don't use for:**
- Simple verification (does this test pass?)
- Known patterns you've debugged before
- Decisions with an obvious correct answer from available evidence
- Questions where speed matters more than certainty

## The Process

### 1. Generate N Independent Paths

Generate exactly N reasoning paths, each from a different angle:

| Task Difficulty | Paths Required |
|----------------|----------------|
| Simple verification (yes/no) | 3 paths |
| Root cause hypothesis (2-3 leads) | 5 paths (default) |
| Multi-causal bug / high-stakes refactor | 7 paths |

Each path uses a different reasoning approach:

```
Path A: Forward from inputs — trace data flow from start to error
Path B: Backward from error — trace from error back to origin
Path C: Structural patterns — what about the code structure causes this?
Path D: Recent changes — what changed that could trigger this?
Path E: Adversarial edge cases — what unusual input or state causes this?
```

### 2. Majority Vote

Collect the conclusions from all paths:

- **100% agreement:** Elite Confidence. Proceed.
- **60-99% agreement:** High Confidence. Proceed but note the minority view as a risk.
- **≤ 50% agreement:** FATAL UNCERTAINTY. STOP. Gather more evidence before proceeding.

### 3. Output

```markdown
**[Diagnosis]**: [Winner]
**Confidence**: [X/N agreement — Level]
**Minority View**: [Brief note if < 100% agreement]
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Generating paths that all use the same reasoning approach | Each path must use a DIFFERENT approach. Diversity is mandatory. |
| Accepting < 60% agreement and proceeding | You don't understand the problem yet. Gather more evidence. |
| Using this for simple questions | Overhead doesn't justify the benefit. Use judgment. |
| Letting one path's conclusion bias the others | Generate all paths independently before comparing. |
| Forgetting to note minority views | Minority views are risks. Document them. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I already know the answer, no need for multiple paths" | Single-path confidence is a hallucination marker. |
| "3 paths is enough for complex analysis" | 5 is the minimum for non-trivial problems. |
| "All paths agree at 60%, that's good enough" | 40% disagreement means significant uncertainty. |
| "The paths are different enough" (when they're not) | Verify actual diversity of reasoning approach. |
| "I'll just use 1 path and be careful" | "Careful" single-path reasoning still misses what other angles would catch. |

## Red Flags — STOP

- Trusting a single reasoning path for a complex problem
- Generating paths that all use the same reasoning approach
- Proceeding with < 60% agreement
- Using this skill for questions with obvious answers
- Forcing paths to agree (dissonance is the signal you're looking for)

## Integration

**Used within:**
- `systematic-debugging` — Phase 3 (Hypothesis) generates 3-5 paths
- `brainstorming` — evaluating approach trade-offs

**Related skills:**
- `systematic-debugging` — primary consumer of this reasoning technique
- `deliberation-gate` — for high-stakes architectural decisions (uses perspectives, not reasoning paths)
