---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code. Do NOT use for throwaway prototypes, generated code, or config files without explicit user approval.
---

# Test-Driven Development

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing. A test that passes immediately could be testing wrong behavior, or no behavior at all.

**Violating the letter of these rules is violating the spirit of these rules.**

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it while writing tests
- Delete means delete — the sunk cost of wrong code is already spent

Implement fresh from tests. Period.

## When to Use

**Always apply this to:**
- New features — every new function or module
- Bug fixes — write a regression test that catches the bug, then fix
- Refactoring — tests prove behavior is preserved
- Behavior changes — any change that alters what the code does

**Exceptions (ask your human partner before skipping):**
- Throwaway prototypes — code you intend to delete
- Generated code — boilerplate from CLI tools (but verify the output)
- Configuration files — JSON, YAML, TOML, env files

If you're thinking "skip TDD just this once" — stop. That's rationalization.

## The Cycle: RED → GREEN → REFACTOR

### RED — Write a Failing Test

Write exactly ONE test for ONE behavior. The test must demonstrate what the code should do, using real dependencies where possible.

<Good>
```typescript
test('retries failed operations 3 times before throwing', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
Clear name describing one behavior. Tests real logic, not mocks.
</Good>

<Bad>
```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
Vague name. Tests mock behavior, not real retry logic. Doesn't verify the function returns a value.
</Bad>

**Requirements:**
- One behavior per test
- Clear, descriptive name
- Real code over mocks whenever possible
- Test the interface, not the implementation

### Verify RED — Watch It Fail

**This step is mandatory. Never skip it.**

```bash
npm test path/to/test.test.ts
# or: node --test path/to/test.test.mjs
```

Before moving to GREEN, confirm:

- **Test fails** — not passes, not errors
- **Failure message is correct** — "Expected 'success' but got undefined" means you're testing the right thing
- **Fails because feature is missing** — not because of a typo in the test

| Outcome | What it means | What to do |
|---------|---------------|------------|
| Test passes | You're testing existing behavior | Fix the test to test something new |
| Test errors | Syntax error or type error in test | Fix the test, re-run |
| Test fails correctly | Feature is missing | Proceed to GREEN |

### GREEN — Write Minimal Code

Write the SIMPLEST possible code to make the test pass. Nothing more.

<Good>
```typescript
async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await operation();
    } catch {
      if (i === 2) throw;
    }
  }
  throw new Error('unreachable');
}
```
Just enough to pass. No extra features, no options, no configuration.
</Good>

<Bad>
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  // YAGNI — none of this is tested
}
```
Over-engineered. None of these options are tested. You'll never remove them once added.
</Bad>

**Rules:**
- Implement ONLY what the test requires
- Don't add features the test doesn't ask for
- Don't refactor other code
- Don't "improve" beyond the test
- Don't fix things you noticed "while you were there"

### Verify GREEN — Watch It Pass

**This step is also mandatory.**

```bash
npm test path/to/test.test.ts
```

Confirm:

- **Test passes** — expected assertion is met
- **Other tests still pass** — no regressions
- **Output is clean** — no errors, warnings, or unexpected logs

| Outcome | What it means | What to do |
|---------|---------------|------------|
| Test passes | Code works | Proceed to REFACTOR (or next RED) |
| Test fails | Code doesn't work | Fix code, not test |
| Other tests fail | Your change caused regression | Fix before proceeding |

### REFACTOR — Clean Up

Only after GREEN:

- Remove duplication
- Improve variable/function names
- Extract helper functions (only if they already exist in the test's logical scope)
- Improve error messages

**Critical rule:** All tests must stay GREEN during refactoring. Run the test after every change.

**Don't add behavior during refactoring.** If you find yourself adding a new feature — stop, write a RED test first.

### Repeat

Write the next failing test for the next behavior. Continue until all behaviors are implemented.

## Why Order Matters

**"I'll write tests after to verify it works"**

Tests written after code pass immediately. Passing immediately proves nothing:
- The test might test the wrong thing (and you'll never know)
- The test might test implementation, not behavior
- You never saw the test catch the bug

Test-first forces you to see the test fail, proving it actually tests something real.

**"I already manually tested all the edge cases"**

Manual testing is ad-hoc. You think you tested everything but:
- No record of what you tested
- Can't re-run when code changes
- Easy to forget cases under pressure
- "It worked when I tried it" ≠ comprehensive

Automated tests are systematic. They run the same way every time.

**"Deleting X hours of work is wasteful"**

Sunk cost fallacy. The time is already gone. Your choice now:
- Delete and rewrite with TDD (X more hours, high confidence)
- Keep it and add tests after (30 min, low confidence, likely bugs)

The "waste" is keeping code you can't trust.

**"TDD is dogmatic, being pragmatic means adapting"**

TDD IS pragmatic:
- Finds bugs before commit (faster than debugging after)
- Prevents regressions (tests catch breaks immediately)
- Documents behavior (tests show how to use code)
- Enables refactoring (change freely, tests catch breaks)

"Pragmatic" shortcuts = debugging later = slower overall.

## Debugging Integration

When you find a bug:
1. Write a failing test that reproduces the bug exactly
2. Watch it fail (proves the bug exists)
3. Fix the code
4. Watch it pass (proves the bug is fixed)
5. Clean up

Never fix a bug without a regression test. A bug without a test will come back.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Testing implementation instead of behavior | Test the public interface. Don't assert on internal state. |
| Multiple behaviors in one test | Split it. One test per behavior. "and" in the name? Split. |
| Heavy mocking | Code is too coupled. Use dependency injection. Test with real objects. |
| Test too complex | Design is too complicated. Simplify the interface. |
| Huge test setup | Extract helpers. If still complex, the design has too many dependencies. |
| Skipping the RED phase | You don't know the test works. Run it and watch it fail. |
| Writing code before the test | Delete it. Start over. No exceptions. |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. A test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. You never saw them fail. |
| "Tests after achieve the same goals" | Tests-after answer "what does this do?" Tests-first answer "what should this do?" |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run, forgot cases. |
| "Deleting X hours is wasteful" | Sunk cost fallacy. Keeping unverified code is technical debt. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw away exploration code. Start with TDD. |
| "Test hard = design unclear" | Listen to the test. Hard to test = hard to use = design problem. |
| "TDD slows me down" | TDD is faster than debugging. "Pragmatic" = slower. |
| "Manual test faster" | Manual doesn't prove edge cases. You'll re-test every change. |
| "Mock everything is fine" | You're testing mocks, not code. Use real dependencies. |
| "Existing code has no tests" | You're improving it. Add tests as you touch code. |

## Red Flags — STOP and Start Over

Catch yourself having these thoughts? You're rationalizing. Delete the code and start over with TDD.

- Writing code before the test
- Writing the test after implementation
- Test passes immediately (you never saw it fail)
- "I already manually tested it"
- "I'll add tests later"
- "Tests after achieve the same purpose"
- "It's about spirit not ritual, not the letter"
- "Keep as reference" or "adapt existing code"
- "Already spent X hours, deleting is wasteful"
- "TDD is dogmatic, I'm being pragmatic"
- "This is different because..."
- "Just this once won't hurt"
- "I know what the test will look like, no need to run it"
- Can't explain exactly why the test failed

**All of these mean: Delete code. Start over with TDD.**

## Quick Reference

| Phase | Action | Verify |
|-------|--------|--------|
| RED | Write one failing test | Run → test fails (feature missing) |
| GREEN | Write minimal code to pass | Run → test passes |
| REFACTOR | Clean up, keep green | Run → still passes |
| REPEAT | Next behavior | Run full suite → all green |

## Integration

**Required workflow chain:**
- When debugging: use `systematic-debugging` first to find root cause, then come back here to write the regression test
- When implementing features: use `writing-plans` to plan the TDD sequence, then execute with `subagent-driven-development`
- After implementation: use `verification-before-completion` before claiming success

**Subagents use this skill:** When dispatched for implementation tasks, subagents MUST follow TDD. The orchestrator does not need to enforce it — this skill does.

## Verification Checklist

Before marking TDD-complete:

- [ ] Every new function/method has a test
- [ ] Watched every test fail (RED phase) before implementing
- [ ] Each test failed for the expected reason (feature missing, not syntax error)
- [ ] Wrote minimal code to pass each test (no YAGNI)
- [ ] All tests pass after GREEN phase
- [ ] Test output is clean (no errors, warnings, unexpected logs)
- [ ] Edge cases and error paths have tests
- [ ] Real dependencies used over mocks

Can't check all boxes? You didn't do TDD. Start over.
