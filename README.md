<div align="center">

# Superpowers Enhanced

*An opinionated OpenCode configuration that enforces disciplined, secure, and systematic software development through the [Superpowers](https://github.com/obra/superpowers) methodology.*

[![Node version](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Install - Bash](https://img.shields.io/badge/Install-Bash-4EAA25?style=flat-square&logo=gnubash&logoColor=white)](install.sh)
[![Install - PowerShell](https://img.shields.io/badge/Install-PowerShell-5391FE?style=flat-square&logo=powershell&logoColor=white)](install.ps1)
[![License - MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

[Quick Start](#quick-start) · [What's Included](#whats-included) · [Enhanced Protocols](#enhanced-protocols) · [How It Works](#how-it-works) · [Uninstall](#uninstall)

</div>

Superpowers Enhanced turns OpenCode from a chat interface into a disciplined development orchestrator. Instead of blindly implementing, your agent brainstorms designs, writes plans, dispatches sub-agents with TDD, runs hard-coded security triage on every task, reviews code before merging, and verifies before claiming completion.

This is a **downstream configuration overlay** for `obra/superpowers`. It does not fork or modify upstream — it adds custom skills, an orchestrator agent (Zeus), enhanced prompts, and strict process instructions on top of the standard Superpowers plugin.

## Quick Start

> [!NOTE]
> No dependencies needed — the installer handles everything automatically, including Node.js if missing.

**Linux / macOS / WSL:**
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.sh)
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
```

**Manual / non-interactive:**
```bash
git clone https://github.com/S1NXIAN/superpowers-enhanced.git ~/superpowers-enhanced
cd ~/superpowers-enhanced
node setup.mjs          # interactive
node setup.mjs --force  # skip prompts
node setup.mjs --dry-run  # preview only
```

> [!IMPORTANT]
> Restart OpenCode after installation for the changes to take effect.

### Verify the install

```bash
# Check the config
ls ~/.config/opencode/AGENTS.md
ls ~/.config/opencode/agent/zeus.md

# Verify default agent is set
node -e "console.log(JSON.parse(require('fs').readFileSync(require('path').join(require('os').homedir(),'.config','opencode','opencode.json'),'utf8')).default_agent)"
# Should output: zeus
```

Then start a new OpenCode session and try: `"Let's build a todo list"`. The `brainstorming` skill should auto-trigger before any code is written.

## What's Included

| File / Directory | Purpose |
|---|---|
| `AGENTS.md` | Highest-priority instructions that enforce the Superpowers workflow |
| `agent/zeus.md` | Orchestrator agent set as default — plans, delegates, reviews |
| `skills/security-triage/` | Hard-coded security trigger rules (path, content, directory patterns) |
| `skills/asi-loop/` | ASI batch patching — one-fix-at-a-time for multiple issues |
| `skills/deliberation-gate/` | Multi-perspective architecture audit (Skeptic, Minimalist, Maintainer) |
| `skills/social-accountability/` | Consequence-weighted framing for sub-agent prompts |
| `prompts/` | Pre-framed templates for implementer, spec reviewer, code quality reviewer |

The installer also adds the plugin `superpowers@git+https://github.com/obra/superpowers.git` to your OpenCode config and merges the fields `default_agent`, `instructions`, and `skills.paths` — everything else in your existing config is preserved.

> [!TIP]
> If anything goes wrong, the installer backs up your original config to `~/.config/opencode/.backups/<timestamp>/.` Run `node uninstall.mjs` to revert.

## Enhanced Protocols

Five custom protocols augment the standard Superpowers skills, enforcing discipline and security at every stage:

**1. Mandatory Security Triage** — Before any work, every file is checked against hard-coded triggers (T1: paths like `*auth*/**`, T2: code patterns like `SECRET_KEY`, T3: directories like `auth/`). If a trigger fires, the agent halts, runs a full security review checklist, and escalates. This is pattern matching, not judgment.

**2. ASI Loop** — When a scan surfaces multiple issues, fixes them one at a time with TDD, re-testing only affected files between each fix. Prevents the common failure of breaking one fix while applying another. A cycle counter stops after 4 iterations to prevent infinite loops.

**3. Deliberation Gate** — Before architecting complex tasks (4+ files, new subsystem), spawns three competing stakeholder roles: **Skeptic** (find where it fails at scale), **Minimalist** (challenge every addition), **Maintainer** (assess testability and tech debt). Each gets one un-debated response; surviving critiques are synthesized into the final design.

**4. Ephemeral State Hashing** — SHA-256 hash verification to prevent TOCTOU exploits. After a sub-agent writes a file, its hash is stored. Before test execution, the hash is verified. Tampering between check and use blocks execution with an alert.

```bash
scripts/verify-hash.sh store path/to/file.py   # store hash after write
scripts/verify-hash.sh verify path/to/file.py  # verify before test
scripts/verify-hash.sh check                   # verify all tracked files
scripts/verify-hash.sh status                  # show tracked files
```

**5. Social Accountability Framing** — Sub-agent prompts carry consequence-weighted instructions. Each role sees the real cost of failure: implementers know a missed test case ships regressions, reviewers know they are the last gate before production.

## How It Works

When OpenCode starts with this configuration:

1. The **Superpowers plugin** loads and makes skills auto-trigger based on context.
2. **AGENTS.md** is loaded as the highest-priority instruction, forcing the agent to follow the workflow.
3. The **Zeus agent** is set as default, giving every session an orchestrator mindset.
4. **Enhanced skills** are registered via `skills.paths`, making them available for the Zeus orchestrator to invoke.

The integration flow is:

```text
[Deliberation Gate] — before architecture for complex tasks
         ↓
  brainstorming → design → user approval
         ↓
  [Security Triage] — before every task, hard-coded pattern matching
         ↓
  writing-plans → implementation plan → user approval
         ↓
  [Social Accountability] — injected into sub-agent dispatch prompts
         ↓
  subagent-driven-development → task-by-task with reviews
         ↓
    [ASI Loop] — when multiple issues found in overlapping code
    [Hash Verification] — for security-critical patches
         ↓
  finishing-a-development-branch → merge / PR / cleanup
```

## Project Structure

```text
superpowers-enhanced/
├── AGENTS.md                 # User instructions (highest priority)
├── opencode-template.json    # OpenCode config template
├── install.sh                # One-liner installer (Linux / macOS / WSL)
├── install.ps1               # One-liner installer (Windows PowerShell)
├── setup.mjs                 # Cross-platform installer script
├── uninstall.mjs             # Cross-platform uninstaller
├── agent/
│   └── zeus.md               # Orchestrator agent (default)
├── prompts/
│   ├── implementer.md
│   ├── spec-reviewer.md
│   └── code-quality-reviewer.md
├── scripts/
│   └── verify-hash.sh        # Anti-TOCTOU hash verification
└── skills/
    ├── asi-loop/
    ├── deliberation-gate/
    ├── security-triage/
    └── social-accountability/
```

## Updating

Re-run the one-liner installer — it's designed to be idempotent:

```bash
# Linux / macOS / WSL
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.sh)

# Windows (PowerShell)
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
```

On re-run, the installer:

- **Merges config** — only adds fields that are missing or different. If your `opencode.json` already has the right values, nothing changes.
- **Overwrites files** — `AGENTS.md`, `zeus.md`, `scripts/verify-hash.sh`, skills, and prompts get the latest versions. Originals are backed up to `~/.config/opencode/.backups/<timestamp>/` before overwriting.
- **Preserves everything else** — model/provider config, API keys, any extra files you placed in the skills or prompts directories.

> [!TIP]
> Run `node setup.mjs --dry-run` first to preview what would change without touching anything.

Restart OpenCode after updating for changes to take effect.

## Uninstall

One-liner (no clone needed):

```bash
# Linux / macOS / WSL
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.sh)

# Windows (PowerShell)
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.ps1 | iex
```

Or if you have the repo cloned:

```bash
cd ~/superpowers-enhanced
node uninstall.mjs
```

The uninstaller reverts the `opencode.json` merge, removes copied files and directories, and restores your most recent backup. To fully remove the Superpowers plugin from OpenCode, also edit your `opencode.json` and remove the plugin entry.

## Troubleshooting

### "Superpowers is not installed" error

1. Add the plugin to `~/.config/opencode/opencode.json`:
   ```json
   "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
   ```
2. Restart OpenCode so it resolves and installs the plugin.
3. Run `node setup.mjs --force` again.

### Enhanced skills not auto-triggering

1. Verify the files exist: `ls ~/.config/opencode/skills/superpowers-enhanced/`
2. Check `skills.paths` in `opencode.json` contains `"skills/superpowers-enhanced"`
3. Verify each skill has a valid `SKILL.md` with YAML frontmatter
4. Restart OpenCode — skills are loaded at startup

### Agent jumps straight to implementation

This means the Superpowers plugin or AGENTS.md is not being loaded. Check that the plugin is in your `opencode.json` plugin array, that `~/.config/opencode/AGENTS.md` exists, and that your config has `"instructions": ["AGENTS.md"]` set.
