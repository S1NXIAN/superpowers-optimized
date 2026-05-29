---
name: zeus/fast-path
description: High-speed TDD workflow for low-complexity tasks (≤ 2 files, single concern). Bypasses planning for direct implementation.
---

# Fast Path Workflow

Optimized cycle for trivial fixes, renames, and updates.

## Hard Gate
- **Standard:** Invoke `token-efficiency` standard logic.
- **Scope:** All criteria must be true to remain on Fast Path:
- Change scope is small (≤ 2 files)
- No new behavior or architecture change
- No cross-module dependency risk
- No migration or data-shape change

**Anti-Pattern:** Using Fast Path for a "quick" security change. Security triggers ALWAYS force Full Path.

## Operational Cycle

1. **TDD (Iron Law)**:
   - RED: Write one small failing test.
   - GREEN: Write minimal code to pass.
   - REFACTOR: Clean up without breaking tests.
   - *Requirement: Use the `test-driven-development` skill.*

2. **Self-Consistency Verification**:
   - Run 3 independent checks:
     - 1. Final test suite run (all pass).
     - 2. Git diff review (no stray changes/placeholders).
     - 3. Edge case check (e.g., null/empty/type mismatch).

3. **Report**:
   - Output the exact changes and verification evidence.
   - Lead with the answer, omit preambles.

4. **Automated Cleanup**:
   - Run `$HOME/.config/opencode/bin/cleanup.mjs` immediately.

## Rationalization Table

| Temptation | Reality |
| :--- | :--- |
| "I'll just fix it and test later" | Wastes 10 min if you break something. RED-GREEN takes 2 min. |
| "It's too simple for a test" | Simple code lives longest. Tests document intent. |
| "I'll skip cleanup to save time" | Temporary files pollute the next task context. |

