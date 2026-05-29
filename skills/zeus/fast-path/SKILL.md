# Skill: zeus/fast-path

# Fast Path Workflow (simple tasks)

1. **Security triage** (already performed during classification; if it triggered, you would have been forced to Full Path, so proceed).
2. **TDD** (load TDD skill, execute RED→GREEN→REFACTOR).
3. **Self-consistency verification** — 2-3 independent checks (run tests, review diff, edge cases) before claiming success.
4. **Report** — output the changes and verification results.
5. **Cleanup** — run `node bin/cleanup.mjs` automatically without user confirmation to remove AI-generated temp files.

No brainstorming, plans, sub-agents, deliberation, or reviews on fast path.
