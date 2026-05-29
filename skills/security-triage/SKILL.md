---
name: security-triage
description: "MANDATORY before ANY work. Pattern-match T1(paths) T2(content) T3(dirs). Must report ALL matches. Caveat: no match does NOT mean safe — see Limitations section. Cross-skill: triggers deliberation-gate override."
---

# Security Triage — Hard-Coded Trigger Rules

## Core Rules

Every file (create/modify/delete) is checked against T1-T3; task name and intent are irrelevant. All tiers are evaluated, all matches recorded. No match does NOT mean safe — only that no hard-coded trigger fired.

If any trigger fires, deliberation-gate is MANDATORY (cross-skill contract) and the task is forced to Full Path.

**Glob semantics:** `*` matches any sequence of characters including `/`. `?` matches any single character. Patterns are matched against the full relative path from project root. Examples: `auth*` matches `auth.js`, `authHelper.js`, `auth/nested/file.js`. `*.pem` matches `cert.pem`, `deep/nested/key.pem`.

## Automated Scan (replaces manual T1-T3 matching)

Use `bin/security-scan.mjs` for T1/T2/T3 pattern matching instead of doing it
manually. One command replaces reading pattern files + mentally matching every
file path and line.

```bash
node ~/.config/opencode/bin/security-scan.mjs <file1> <file2> ...
```

Output: JSON array of matches (empty `[]` if clean). Example:
```json
[{"tier":"T1","pattern":"auth*","file":"src/auth/login.js"}]
```

**When to use it:**
- Run `~/.config/opencode/bin/security-scan.mjs` on all task files immediately
- Parse output for matches → feed into T4 Escalation Protocol
- If clean (`[]`), still check the Limitations section below — pattern
  matching is incomplete
- You still perform the T4 Security Review Checklist (semantic audit) —
  only the brute-force pattern matching is automated

## Triggers

### T1: File Path Matches

```
# Identity & Access
auth* login* logout* session* identity* sso*

# Secrets & Keys
secret* credential* token* cert* key*
.pem .key .cert .p12 .htaccess .htpasswd .acl

# Security Domains
security* rbac* crypto* cipher* encrypt*
hash* digest* signature* tls* ssl* cors* csp* csrf* xss*

# Input & Rate Safety
sanitize* escape* validation* rate-limit* throttle* quota*

# Deployment & Compliance
deploy* rollback* migration* compliance* gdpr* pii*

# Federation
oauth* oidc* saml* jwt* openid*

# Infrastructure Security
firewall* proxy* vpn* secrets-manager* vault* hsm*
```

**Explicit non-matches:** The following project paths look security-adjacent but are NOT security boundaries and do NOT trigger T1: `docs/`, `tests/`, `sub-agents/`, `templates/`. Files inside these dirs are checked by T2 and T3 only.

### T2: Code Content Matches

**⚠️ STOP. READ `skills/security-triage/patterns/common.txt` AND `<language>.txt` NOW. Do not skip. Do not assume you know the patterns. If the files are unreachable, use the Fallback list below.**

**Match rule:** case-insensitive substring match against any line of the file. A pattern like `SECRET_KEY` matches any line containing `SECRET_KEY` anywhere. Literal characters only — no regex, no glob. A match on any line triggers T2.

**Pattern files:** READ `skills/security-triage/patterns/common.txt` plus the language-specific file for your project. Do not proceed without reading both. Categories covered in the files (hint only — always read the actual files):

- Config keys: `SECRET_KEY`, `API_KEY`, `DATABASE_URL`, etc.
- Security keywords: `password`, `token`, `auth`, `session`, `csrf`, etc.
- Dangerous functions: `eval(`, `exec(`, `system(`, etc.
- Network/file/data-flow indicators

| Language | Pattern file | Language | Pattern file |
|---|---|---|---|
| JavaScript / TypeScript | `js-node.txt` | Python | `python.txt` |
| Java | `java.txt` | C# (.NET) | `csharp.txt` |
| Go | `go.txt` | Rust | `rust.txt` |
| C | `c.txt` | C++ | `cpp.txt` |
| PHP | `php.txt` | Ruby | `ruby.txt` |
| Swift | `swift.txt` | Kotlin | `kotlin.txt` |
| Dart / Flutter | `dart.txt` | Shell / Bash | `shell.txt` |
| SQL (standalone .sql files) | `sql.txt` | Not listed | language file not needed — `common.txt` covers generic patterns |

**🛡️ Fallback (use only if pattern files are unreachable):**
```
password secret token credential key auth session csrf
authenticate authorize login logout sanitize escape validate
eval( exec( system( popen( subprocess child_process
SECRET_KEY API_KEY API_SECRET DATABASE_URL
AUTH_ SECURITY_ ENCRYPTION_ CSP_ COOKIE_
```

### T3: Security-Adjacent Directories

Any file in these directories triggers (filename ignored):

```
auth/  security/  crypto/  certs/  secrets/  credentials/
permissions/  policies/  compliance/  audit/
middleware/auth*/  middleware/security*/
config/deploy*/  config/secrets*/
```

## T4: Escalation Protocol

When any T1-T3 fires:

1. **STOP** — do not proceed.
2. **FLAG** — `[SECURITY-TRIAGE: T1(<pattern>), T2(<pattern>), T3(<dir>)]` with file paths.
3. **AUDIT** — run the Security Review Checklist below. Each item: `VERIFIED: file:line – evidence` or `UNVERIFIABLE: what test would confirm`.
4. **ESCALATE** — if any match involves a production path (contains `/prod/`, `/production/`, `PROD_` env var, `deploy/prod/`, or `prod/` dir), present a security impact summary to the user before proceeding.
5. **DOCUMENT** — record all matches and audit results. Then output:

```
[SECURITY-TRIAGE REPORT]
Matches: <list with file paths and patterns>
Audit: <each checklist item as VERIFIED:evidence or UNVERIFIABLE:reason>
Escalation: <impact summary or "none">
Bias Check: <confirm all files re-checked; "clean" ≠ "safe">
```

## Security Review Checklist

For each item: `VERIFIED: file:line – what confirmed` or `UNVERIFIABLE: what test would be needed`.

### Code
- [ ] Output encoding at trust boundaries
- [ ] Session rotation, expiry, httpOnly
- [ ] CSRF protection on state-changing routes
- [ ] AuthZ checks at every protected handler
- [ ] No secrets in code/comments/logs (grep)
- [ ] Parameterized queries at untrusted inputs
- [ ] Rate limiting on auth-sensitive endpoints
- [ ] Secrets rotation path (UNVERIFIABLE)
- [ ] Adversarial test coverage (UNVERIFIABLE)

### Dependencies
- [ ] No known-vulnerable deps introduced
- [ ] Versions pinned (no ^/~ ranges)
- [ ] Supply-chain vetting (UNVERIFIABLE)

### Config
- [ ] CORS explicit origins (not `*`)
- [ ] TLS ≥ 1.2
- [ ] Security headers: CSP, HSTS, X-Frame-Options
- [ ] Debug/dev mode disabled
- [ ] Error responses don't leak internals

### How to verify
- **VERIFIABLE:** read the relevant code path, confirm the control is present and correctly configured.
- **UNVERIFIABLE:** describe what integration or adversarial test would be required.

## Limitations

Pattern matching is incomplete — a non-matching file can still be a security boundary. **Scrutinize every new file that creates data flow, input handling, or external communication:** route handlers, DB/API wrappers, configs that may hold secrets, auth/parsing/serialization middleware. If in doubt, run the full audit.

## Bias Compensation

Re-check every file you read (not just modified), list all matches (don't anchor on the first), and remember "clean" means no vulnerability found, not "safe."

## Trigger Check Procedure (execute in this order)
```
0. Run automated scan:
      node ~/.config/opencode/bin/security-scan.mjs <files...>
    → Parse JSON output for any matches
1. If ANY file has ANY match:
   → Execute T4 Escalation Protocol
2. If NO file has ANY match:
   → Check the Limitations section's "What to do about it" guidance for new files
   → If any file qualifies, run audit anyway
   → If no file qualifies, proceed normally
```
