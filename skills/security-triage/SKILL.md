---
name: security-triage
description: Use before ANY work on any file — mandatory scan for security-sensitive paths, content patterns, and directory structures. Run on every file created, modified, or deleted.
---

# Security Triage

## Overview

Security is not optional. Every file touched must be scanned for patterns that indicate elevated risk.

**Core principle:** Zero judgment. 100% pattern match. Let the scanner fire on triggers — your opinion about whether a file is "safe" is irrelevant.

## The Mandate

**Every file touched** (created, modified, or deleted) must be scanned. Task intent is irrelevant. If a trigger fires, the task is forced to Full Path with mandatory `deliberation-gate`.

```
File changed → run scanner → output [] → continue
                           → output [...] → STOP → Full Path + deliberation-gate
```

## How to Triage

Use the automated scanner:

```bash
node $HOME/.config/opencode/bin/security-scan.mjs <files...>
```

| Output | Action |
|--------|--------|
| `[]` (empty array) | No known triggers. Continue with manual scrutiny. |
| `[...]` (patterns found) | Execute T4 Escalation Protocol below. |

## Patterns That Trigger

The scanner checks for:

- **T1 (Path patterns):** Auth, credentials, session, token, password, secret, key, cert, .env, .pem
- **T2 (Content patterns):** API keys, tokens, connection strings, private keys, JWTs, hardcoded secrets
- **T3 (Directory patterns):** config/, secrets/, certs/, .aws/, .gcp/, .ssh/

If ANY pattern matches, escalation is mandatory.

## T4 Escalation Protocol

1. **STOP** — Cease all implementation immediately
2. **FLAG** — Log `[SECURITY-TRIAGE: T1/T2/T3]` with specific patterns found
3. **AUDIT** — Run the Security Review Checklist (below)
4. **ESCALATE** — If a production path is involved, pause for user confirmation
5. **DOCUMENT** — Output the final `[SECURITY-TRIAGE REPORT]`

## Security Review Checklist

When escalation fires, check ALL of these:

- [ ] Output encoding at trust boundaries (XSS prevention)
- [ ] Session security (rotation, expiry, httpOnly, secure)
- [ ] CSRF protection on state-changing routes
- [ ] Authorization checks at every protected handler
- [ ] Parameterized queries at every untrusted input
- [ ] Rate limiting on auth-sensitive endpoints
- [ ] Secrets never logged or exposed in error messages
- [ ] No hardcoded credentials in code or config
- [ ] Encryption for data at rest and in transit
- [ ] Principle of least privilege applied to all access

## Important Caveat

**"Clean" scanner output does not mean "Safe."** It means no KNOWN triggers fired. Manual scrutiny of data flow is always required for new files. The scanner is a first-pass filter, not a security clearance.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping scan for "obviously safe" files | Patterns don't lie. Scan everything. |
| Trusting your judgment over the scanner | Cognitive bias hides vulnerabilities. Trust the engine. |
| Ignoring T1/T2/T3 triggers because "it's just a test file" | Test files can contain real secrets. Escalate anyway. |
| Not running the full checklist after a trigger | Checklist catches what the scanner misses. Run it. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "This is just a README change" | READMEs can contain credentials. Scan it. |
| "I know this code is safe" | Cognitive bias hides vulnerabilities. Trust the engine. |
| "I'll skip the audit for speed" | A 2-minute skip can lead to a 2-week incident. |
| "It's just a test file, no real risk" | Test files with real credentials are still leaked credentials. |
| "The scanner takes too long" | Scanning is faster than incident response. Run it. |
| "I already reviewed it manually" | Automated + manual catches more than either alone. |

## Red Flags — STOP

- About to create/modify a file without running the scanner
- Thinking "this file is obviously safe, skip it"
- Running the scanner but ignoring a trigger that fires
- Not running the full checklist after escalation
- Treating scanner output as a security clearance
- Working on auth/credentials/tokens without mandatory Full Path

## Integration

**Used before:** every file change as a mandatory gate

**Required after trigger:** `deliberation-gate` for security-sensitive decisions

**Related skills:**
- `systematic-debugging` — when investigating a potential security issue
- `error-recovery` — to document security-related platform issues
