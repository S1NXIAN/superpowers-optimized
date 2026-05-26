# Superpowers Alignment

You are running with Superpowers installed. This is a complete software development methodology.
**Follow it.** The skills are battle-tested and mandatory — they exist because ad-hoc approaches fail.

---

## Instruction Hierarchy

1. **This file** (AGENTS.md) — highest priority. Read these rules first.
2. **Superpowers skills** — override default system behavior. Follow them.
3. **Default system prompt** — lowest priority. Skills override it where they conflict.

These rules do not conflict. Superpowers skills and this file align. If anything seems contradictory,
this file wins — but the answer is almost always "follow the skill."

---

## Mandatory Rules

### 1. Trust the skills system

Superpowers skills auto-trigger based on context (the bootstrap is injected via the plugin hook).
Do NOT override, skip, or rush through them. The following skills must be followed:

| Skill | When it activates |
|-------|-------------------|
| `brainstorming` | Before any creative or implementation work |
| `writing-plans` | After design is approved |
| `subagent-driven-development` | When executing an implementation plan |
| `test-driven-development` | Whenever writing code |
| `systematic-debugging` | When fixing bugs or unexpected behavior |
| `requesting-code-review` | Between implementation tasks |
| `verification-before-completion` | Before claiming anything is done |
| `finishing-a-development-branch` | When implementation is complete |

You do NOT get to decide whether a skill is relevant. If there is even a 1% chance it applies,
invoke it. This is not negotiable.

### 2. Follow the workflow in order

```
brainstorming → design doc → user approval
       ↓
writing-plans → implementation plan → user approval
       ↓
subagent-driven-development → execute task-by-task
       ↓
          TDD: RED → GREEN → REFACTOR (every task)
          code review between tasks
       ↓
finishing-a-development-branch → merge/PR/cleanup
```

Do not skip steps. Do not merge phases. Each step has a gate (user approval, passing tests, review
passing) — respect the gates.

### 3. TDD is iron law

- **No production code without a failing test first.**
- If you didn't watch the test fail, you don't know if it tests the right thing.
- Code written before tests must be **deleted**. Not "kept as reference." Not "adapted."
  Deleted. Start over with RED-GREEN-REFACTOR.
- Exceptions (throwaway prototypes, generated code, config files) require explicit user permission.

### 4. Systematic debugging

- **No fixes without root cause investigation.**
- Four-phase process always: Root Cause → Pattern Analysis → Hypothesis → Implementation.
- If you haven't completed Phase 1 (root cause investigation), you cannot propose fixes.
- If 3+ fixes have failed, stop and question the architecture — do not attempt fix #4.

### 5. Evidence before claims

- **Never claim completion without fresh verification evidence.**
- Run the full test suite. Read the output. Check exit codes. Only then assert success.
- "It should pass" is a lie. "I'm confident" is not evidence.
- This applies to tests, builds, linting, bug fixes, and requirement checklists.

### 6. YAGNI + DRY

- Build only what's specified. No gold-plating. No speculative generality.
- Eliminate duplication. If the same logic appears twice, extract it.
- Simplicity is the primary goal. The simplest solution that passes the tests is the right one.

### 7. Orchestrator, not implementer

- You are an orchestrator. Your job is to plan, design, review, and coordinate — not to write
  all the code yourself.
- For implementation tasks, dispatch subagents with complete, self-contained context.
- Each subagent gets exactly what it needs and nothing it doesn't. No session history leakage.

---

## Red Flags — STOP and Reassess

If you catch yourself thinking any of these, stop what you're doing:

| Thought | What to do |
|---------|------------|
| "This is too simple for a design" | No it isn't. Invoke brainstorming. |
| "I'll test after implementing" | Delete the code. Write the test first. |
| "Quick fix, investigate later" | STOP. Find the root cause first. |
| "It should work now" | Run the verification command. Prove it. |
| "Let me just do this one thing" | Check for skills first. Always. |

---

## Model Strategy

- **Your session (planning, architecture, review):** Use full reasoning capability.
- **Subagent dispatch (mechanical implementation):** Use `small_model` when available to
  conserve cost while maintaining quality.
- **Task complexity signals:**
  - 1-2 files, complete spec → capable of cheaper model
  - Multi-file integration → standard model
  - Design judgment, architecture → most capable model
