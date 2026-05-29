---
name: writing-plans
description: Use when you have an approved design or spec for a multi-step implementation task and need to create a precise, executable implementation plan before touching any code.
---

# Writing Plans

## Overview

Write comprehensive implementation plans that assume the executing engineer has zero context for this codebase and questionable taste. Document everything they need: exact file paths, complete code blocks, exact test commands, and expected output.

**Core principle:** A plan is only as good as its weakest step. Every step must contain the ACTUAL content an engineer needs — not instructions to write it later.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

## Scope Check

If the spec covers multiple independent subsystems, it should have been decomposed during design. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan must produce working, testable software independently.

**Signs a plan needs splitting:**
- Tasks can be implemented in any order without affecting each other
- No shared state or data between groups of tasks
- Different tasks could be assigned to different people
- Plan would be more than 15-20 tasks

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for:

- Design units with clear boundaries and well-defined interfaces
- One file = one clear responsibility
- Files that change together should live together
- Split by responsibility, not by technical layer
- In existing codebases, follow established patterns
- If a file you're modifying has grown unwieldy, splitting it is reasonable

**Research:** If you're unsure about existing patterns or architecture, dispatch `@code-exploration` before defining tasks. A targeted research pass prevents boundary mistakes in the plan.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" — step
- "Run it to make sure it fails" — step
- "Implement the minimal code to pass" — step
- "Run tests to verify" — step
- "Commit" — step

A task contains 4-8 steps. A plan contains 3-12 tasks. If a task exceeds 10 steps, it's too large — split it.

## Plan Document Format

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For executing agents:** Use subagent-driven-development (recommended) or
> executing-plans to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Files to create:**
- `path/to/new/file.ts` — purpose

**Files to modify:**
- `path/to/existing/file.ts` — what changes

---
```

## Task Structure

Every task follows this exact format. Every code block must contain COMPLETE code — not snippets, not pseudocode, not "TODO".

````markdown
### Task N: [Component Name]

**Files:**
- Create: `src/lib/feature.ts`
- Modify: `src/index.ts` (lines 15-30, import + usage)
- Test: `tests/feature.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { parseConfig } from '../src/lib/feature';

describe('parseConfig', () => {
  it('extracts host and port from connection string', () => {
    const result = parseConfig('postgres://db:5432/mydb');
    expect(result).toEqual({
      host: 'db',
      port: 5432,
      database: 'mydb',
    });
  });

  it('defaults port to 5432 when not specified', () => {
    const result = parseConfig('postgres://db/mydb');
    expect(result.port).toBe(5432);
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run tests/feature.test.ts -t "parseConfig"`
Expected: FAIL — `parseConfig is not defined` or similar

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/feature.ts
export interface DbConfig {
  host: string;
  port: number;
  database: string;
}

export function parseConfig(connectionString: string): DbConfig {
  const url = new URL(connectionString);
  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    database: url.pathname.replace('/', ''),
  };
}
```

- [ ] **Step 4: Verify it passes**

Run: `npx vitest run tests/feature.test.ts -t "parseConfig"`
Expected: PASS (2/2)

- [ ] **Step 5: Update the parent module**

In `src/index.ts`, add the import and re-export:

```typescript
export { parseConfig, type DbConfig } from './lib/feature';
```

- [ ] **Step 6: Verify no regressions**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/lib/feature.ts src/index.ts tests/feature.test.ts
git commit -m "feat: add parseConfig for DB connection strings"
```
````

## The Three Categories of Plan Failure

Every plan step must pass all three checks:

### 1. No Instructions Disguised as Code

```
❌ BAD: "Implement validation logic"
❌ BAD: "Add appropriate error handling"
❌ BAD: "Write tests for the above" (without actual test code)
❌ BAD: "Update the function to handle edge cases"

✅ GOOD: Show the EXACT code. Every function body. Every test assertion.
```

If a step says "implement X" without showing X, the plan is incomplete. Fix it.

### 2. No Placeholders

```
❌ BAD: "TBD", "TODO", "implement later", "fill in details"
❌ BAD: "Add more tests" (which ones? for what?)
❌ BAD: "Similar to Task N" (repeat the code)
❌ BAD: Configuration files with "your-key-here"

✅ GOOD: Every placeholder is resolved. Every value is concrete.
```

If a placeholder exists, the plan is incomplete. Resolve it or remove the step.

### 3. No Undefined References

```
❌ BAD: Using `parseConfig()` in Task 5 when it's defined in Task 8
❌ BAD: Referencing `DbConfig` type that was never exported
❌ BAD: `import { helper } from './utils'` when helper isn't defined anywhere

✅ GOOD: Every function, type, import, and variable is defined in a previous task
```

Check type consistency: Do the names in later tasks match what's defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

## Self-Review Checklist

After writing the complete plan, review it with fresh eyes against the spec:

**1. Spec Coverage**
- Skim each section/requirement in the spec
- Can you point to a specific task that implements it?
- If a requirement has no task, ADD the task

**2. Placeholder Scan**
- Grep the plan for: TBD, TODO, "add more", "fill in", "later", "placeholder"
- Also check for empty code blocks or sections
- Fix every one before proceeding

**3. Type Consistency**
- Do function signatures match across tasks?
- Are imported names consistent?
- Do test assertions match actual function behavior?

**4. TDD Compliance**
- Does every logical change have a "write failing test" step?
- Does every "write failing test" have a "verify it fails" step?
- Does every implementation step have a "verify it passes" step?

## Execution Handoff

After saving the plan, present the execution choice:

> "Plan complete and saved to `docs/zeus/plans/YYYY-MM-DD-<feature>.md`. Two execution options:
>
> 1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task with spec-validation and quality-review gates between each
> 2. **Inline Execution** — execute tasks sequentially with checkpoints
>
> Which approach?"

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Placeholder tasks ("implement logic") | Replace with actual code. Every step must be concrete. |
| No test commands | Add the exact command with expected output. |
| Skipping TDD steps | Every behavior change needs: RED → verify → GREEN → verify. |
| Missing file paths | Every task lists exact files to create/modify. Include line ranges. |
| Cross-task type mismatch | Verify consistency after writing all tasks. |
| "Similar to Task N" | Repeat the code. Agent may execute tasks out of order. |
| No scope check | If the plan exceeds 20 tasks, it needs splitting. |
| Missing integration test step | After all tasks, add a step to run the full suite. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll leave the details to the implementer" | The implementer has zero context. Show the exact code. |
| "This placeholder is obvious enough" | It's obvious to you. Not to the agent executing it. |
| "I don't need to map the file structure first" | You'll create conflicting boundaries. Map first. |
| "Tests after — the implementer will write them" | Tests after prove nothing. Every step needs TDD. |
| "Similar to Task N is fine, they'll understand" | They won't. Tasks may execute out of order. Repeat yourself. |
| "The code is too long to include" | Include it. A missing line can break the entire plan. |

## Red Flags — STOP and Fix

If your plan contains any of these, it's not ready for execution:

- Any step that says "implement" without showing the code
- Any "TBD", "TODO", or "fill in later"
- Any step with no corresponding test step
- Any test step that doesn't specify the exact command
- Missing file paths
- Inconsistent function/type names across tasks
- Any step you couldn't execute yourself with the information given

**Fix every issue before presenting the plan for approval.**

## Final Gate

Before handing off the plan:

- [ ] Spec coverage confirmed — every requirement has a task
- [ ] No placeholders or TODOs
- [ ] All function signatures are consistent
- [ ] Every code-changing step has a corresponding test step
- [ ] Every test step includes the exact command to run
- [ ] File paths are exact and exist in the project
- [ ] Full test suite run is included as a final step
- [ ] Plan is saved to `docs/zeus/plans/YYYY-MM-DD-<feature>.md`
