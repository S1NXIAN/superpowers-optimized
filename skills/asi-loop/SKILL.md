---
name: asi-loop
description: "Fix one overlapping-code issue per cycle. Required when 3+ issues share a file. State via scripts/asi.sh. TDD with reproducer first. Use when multiple fixes risk merge conflicts, regressions, or nullification."
---
# ASI Loop — One-Issue-at-a-Time Patching
Overlapping fixes cause merge conflicts and nullified fixes. Fix **one** issue per cycle. All state operations use `scripts/asi.sh` – **never** read or write `.asi-state.json` directly.

## State Commands (use exactly)
| Action | Command |
|--------|---------|
| Init state | `asi.sh init '<json>'` |
| Select next | `asi.sh select` |
| Status | `asi.sh status` |
| List open IDs | `asi.sh list-open` |
| Get issue details | `asi.sh get <id>` |
| Mark fixed | `asi.sh mark-fixed <id>` |
| Mark blocked | `asi.sh mark-blocked <id> <reason>` |
| Resolve by side effect | `asi.sh mark-resolved-side-effect <id>` |
| Add issue | `asi.sh add-issue '<json>'` |
| Increment cycle | `asi.sh complete-cycle` |
| Validate | `asi.sh check-corrupt` |

Path: `scripts/asi.sh` (with backward-compatibility wrapper at `skills/asi-loop/scripts/asi.sh`).

## Cycle Output Block (required before each fix)
```
[CYCLE N]
State: <paste output of asi.sh status | head -1>
Selected: <ID> | Reason: <1 sentence>
Confidence: <High/Medium/Low – 1-sentence rationale>
Bias check: <why this might be wrong, or "none found">
Anchor check: <priority unchanged/changed if 3× harder>
```

## Protocol

### 1. Receive Issue List
Collect issues (scan, review, audit). Each must have: id, source (exact location, e.g. `scan-output.md:47`), files, severity (critical/high/medium/low), description (what is wrong, not how to fix), dependencies (IDs that must be fixed first). Call `asi.sh init '<json>'` with the full issue array.

### 2. Isolate One Issue
Run `asi.sh select`. It executes the priority waterfall (critical with no unresolved dependencies → unblocks most → severity with fewest overlaps → fallback by ID). Apply these bias checks on the result:

- **Primacy:** Did you evaluate every open issue, not just the first few? yes/no.
- **Wrong-first-fix:** One reason this might be the wrong first fix. If valid, re-evaluate.
- **Anchoring:** If the fix turns out 3× harder, does priority change? If yes, re-evaluate.
- **Confirmation:** Name one piece of evidence that the chosen fix might be incorrect.

✅ **Never >1 per cycle.** Emit the Cycle Output Block.

### 3. Fix – Reproducer-First TDD
- **Bug:** write a test that reproduces the bug (must fail), apply fix, confirm reproducer passes and existing tests still pass.
- **Non-bug:** standard RED → GREEN → REFACTOR.

- No file outside the issue's `files` list touched.
- No opportunistic fixes.
- If a needed file is missing → wrong issue; revert and return to Step 2.

### 4. Fast Re-test
Run tests/lint on changed files only.

✅ All pass → Step 5.  
❌ Any fail:
1. Revert: `git checkout -- <all-changed-files>`
2. Diagnose: wrong understanding → re-describe, return to Step 2. Wrong fix → return to Step 3 with corrected fix.
3. After 2 failures on same issue → `asi.sh mark-blocked <id> "<reason>"`, return to Step 2.

### 5. Dynamic Update
1. Run `asi.sh status` to get current open issues.
2. For each open issue: if its `files` overlap with changed files **and** the original detection tool/command (as recorded in the issue's `source` field) no longer reports the issue → `asi.sh mark-resolved-side-effect <id>`.
3. New issues discovered → `asi.sh add-issue '<json>'`.
4. Mark the intentionally fixed issue: `asi.sh mark-fixed <id>`.
5. `asi.sh complete-cycle`.
6. Validate: `asi.sh check-corrupt` must exit 0.

### 6. Halt Guard
After `asi.sh complete-cycle`, run `asi.sh status`. If `cycle >= maxCycles`:
1. Save diff: `git diff > asi-loop-patch-$(date +%s).diff` (if non-empty).
2. Output:
```
[ASI-LOOP] Limit reached (4/4) on: <task>
Fixed: <list IDs and outcomes>
Remaining: <list open IDs with reasons>
Stuck on: <ID> — <reason it kept cycling>
Patch: asi-loop-patch-<timestamp>.diff
```
3. Do **not** auto-resume. Wait for user.

### 7. Repeat
Return to Step 2 until `asi.sh list-open` outputs nothing. Terminal exit:
```
[ASI-LOOP] Complete
Summary: $(asi.sh status)
```
