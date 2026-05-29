---
name: zeus/full-path
description: The complete 8-stage Elite engineering pipeline for complex tasks.
---

# Full Path Workflow (complex tasks)

Execute the standard Superpowers pipeline with these mandatory stages:

1. **Phase 1: Premise Check** — Invoke `premise-check`. Validate YAGNI.
2. **Phase 2: Specialized Audit** — Dispatch `architect` and `hacker` sub-agents to review the high-level approach.
3. **Phase 3: Brainstorming** — Invoke `brainstorming`. Explore requirements and propose design.
4. **Phase 4: Writing Plans** — Invoke `writing-plans`. QA review of the test steps via `qa-pro` sub-agent.
5. **Phase 5: SDD (Parallel Waves)** — Invoke `subagent-driven-development`. Fresh implementer per task with two-stage review.
6. **Phase 6: Verification & Self-Consistency** — Invoke `self-consistency-reasoner`. Full test suite and side-effect checks.
7. **Phase 7: Review & Merge** — Present final summary with verification evidence. No merge without explicit user approval.
8. **Phase 8: Cleanup** — `node bin/cleanup.mjs` removes all generated temp files.
