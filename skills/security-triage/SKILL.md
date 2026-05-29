---
name: security-triage
description: MANDATORY before ANY work. Pattern-match T1(paths) T2(content) T3(dirs). Must report ALL matches. 
---

# Security Triage

Zero Judgment. 100% Pattern Match.

## The Mandate
**Every file touched** (create/modify/delete) must be scanned. Task intent is irrelevant. If a trigger fires, the task is forced to **Full Path** and `deliberation-gate` becomes mandatory.

## Automation Gate
Use the security scanner for T1-T3 matching:
```bash
node $HOME/.config/opencode/bin/security-scan.mjs <files...>
```
- Output `[]` &rarr; Check Limitations (Phase 2).
- Output `[...]` &rarr; Execute T4 Escalation Protocol.

## T4 Escalation Protocol
1.  **STOP**: Cease all implementation.
2.  **FLAG**: Log `[SECURITY-TRIAGE: T1/T2/T3]` with patterns.
3.  **AUDIT**: Run the Security Review Checklist (Code, Deps, Config).
4.  **ESCALATE**: If a production path is involved, pause for user confirmation.
5.  **DOCUMENT**: Output the final `[SECURITY-TRIAGE REPORT]`.

## Security Review Checklist
- [ ] Output encoding at trust boundaries.
- [ ] Session security (rotation, expiry, httpOnly).
- [ ] CSRF protection on state-changing routes.
- [ ] AuthZ checks at every protected handler.
- [ ] Parameterized queries at untrusted inputs.
- [ ] Rate limiting on auth-sensitive endpoints.

## Rationalization Table

| Temptation | Risk |
| :--- | :--- |
| "This is just a README change" | Patterns don't lie. Scan it anyway. |
| "I know this code is safe" | Cognitive bias hides vulnerabilities. Trust the engine. |
| "I'll skip the audit for speed" | A 2-minute skip can lead to a 2-week incident. |

## Iron Law
"Clean" output from the scanner does not mean "Safe." It means no **known** triggers fired. Manual scrutiny of data flow is always required for new files.
