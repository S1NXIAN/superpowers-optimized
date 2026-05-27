<a id="readme-top"></a>

<div align="center">

# Superpowers Enhanced

*An opinionated OpenCode configuration that enforces disciplined, secure, and systematic software development through the [Superpowers](https://github.com/obra/superpowers) methodology.*

[![Node version](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Install - Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat-square&logo=gnubash&logoColor=white)](install.sh)
[![Install - PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=flat-square&logo=powershell&logoColor=white)](install.ps1)
[![License - MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Quick Start](#quick-start) · [What's Included](#whats-included) · [Protocols](#protocols) · [How It Works](#how-it-works) · [Updating](#updating) · [Uninstall](#uninstall)

</div>

> OpenCode agents default to implementation mode: you describe what you want, they start writing code.  
> Superpowers Enhanced gives your agent an **operating system** instead.

| | Default OpenCode | Superpowers Enhanced |
|---|---|---|
| Task approach | Jump straight to code | Brainstorm → plan → implement → review |
| Security | Manual, if at all | Hard-coded triage on every file |
| Batch fixes | Fix all at once, hope nothing breaks | ASI loop: one fix, re-scan, repeat |
| Architecture | Single opinion | Triple-critique deliberation gate |
| Sub-agents | No accountability framing | Consequence-weighted prompts |
| Verification | "It should work" | Fresh evidence before claiming done |
| Simple tasks | Full pipeline every time | Fast path: TDD directly, skip overhead |

This is a **downstream configuration overlay** for [`obra/superpowers`](https://github.com/obra/superpowers). It doesn't fork or modify upstream — it adds custom skills, an orchestrator agent (Zeus), enhanced prompts, and process enforcement on top of the standard Superpowers plugin.

## Quick Start

> [!NOTE]
> No dependencies needed. The installer detects your OS, installs Node.js if missing, and applies the configuration.

```bash
# Linux / macOS / WSL
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.sh)

# Windows (PowerShell)
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
```

Once installed, restart OpenCode and try:

> _"Let's build a todo list"_

The `brainstorming` skill should trigger before any code is written. If it jumps straight to implementation, see [troubleshooting](#troubleshooting).

### Manual install

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
ls ~/.config/opencode/AGENTS.md ~/.config/opencode/agent/zeus.md
node -e "console.log(JSON.parse(require('fs').readFileSync(require('path').join(require('os').homedir(),'.config','opencode','opencode.json'),'utf8')).default_agent)"
# Should output: zeus
```

([back to top](#readme-top))

## Prerequisites

- **OpenCode** installed (the config overlay requires it)
- **Node.js 18+** (the installer can install it for you, or get it from [nodejs.org](https://nodejs.org/))

Everything else — git, curl, wget, PowerShell — is detected and used if available but not required.

([back to top](#readme-top))

## What's Included

| What | Purpose |
|---|---|
| **Zeus agent** (`agent/zeus.md`) | Adaptive orchestrator. Runs full Superpowers pipeline for complex tasks; takes fast path (TDD directly) for simple ones. `@quick`/`@full` annotations override auto-detection. Security triggers (T1-T3) always force the full path. |
| **Instruction hierarchy** (`AGENTS.md`) | Highest-priority rules that force the agent to follow the workflow. Outranks the system prompt. |
| **Security triage** (`skills/security-triage/`) | Hard-coded trigger rules. Any file matching `*auth*/**`, `*secret*/**`, `*token*/**`, etc. automatically triggers a full audit. Not a judgment call. |
| **ASI loop** (`skills/asi-loop/`) | When a scan finds multiple issues, fixes them one at a time with TDD and re-testing between each. Prevents batch-fix regressions. |
| **Deliberation gate** (`skills/deliberation-gate/`) | Before architecting complex tasks, spawns three critics: Skeptic (scale failures), Minimalist (challenge additions), Maintainer (tech debt). |
| **Social accountability** (`skills/social-accountability/`) | Sub-agent prompts carry consequence weights. Implementers know a missed test ships regressions. Reviewers know they're the last gate. |
| **Prompts** (`prompts/`) | Pre-framed templates for implementer, spec reviewer, and code quality reviewer. Each includes role-specific accountability framing. |
| **Ephemeral hashing** (`scripts/verify-hash.sh`) | SHA-256 verification to prevent TOCTOU exploits on security-critical patches. |

The installer also adds the Superpowers plugin to your `opencode.json` and merges the fields `default_agent`, `instructions`, `skills.paths`, `enable_experimental_skills`, and `autoupdate`. Everything else in your existing config — models, provider settings, API keys — is preserved.

> [!TIP]
> The installer backs up your original config to `~/.config/opencode/.backups/<timestamp>/` before any changes. See the [uninstall](#uninstall) section to revert.

([back to top](#readme-top))

## Protocols

These six custom protocols augment Superpowers' standard skills. They enforce discipline and security at specific gates in the development workflow:

| Gate | Protocol | What it prevents |
|---|---|---|
| Before any task | **Security triage** | Agent bypassing security review on a file that touches auth, secrets, tokens, or crypto |
| Before architecture | **Deliberation gate** | Designing a system on flawed assumptions without adversarial review |
| During implementation | **Social accountability** | Sub-agents producing low-quality work without understanding consequences |
| During batch fixes | **ASI loop** | Breaking one fix while applying another in overlapping code |
| On security patches | **Ephemeral hashing** | TOCTOU exploits where a compromised agent swaps payloads between check and use |
| During debugging and verification | **Self-consistency reasoning** | Confident-but-wrong single-chain failures; fixes based on incomplete root cause analysis |

### Integration flow

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
    [Self-Consistency] — multi-path validation during debugging & verification
         ↓
  finishing-a-development-branch → merge / PR / cleanup
```

([back to top](#readme-top))

## How It Works

When OpenCode starts with this configuration:

1. The **Superpowers plugin** loads and makes skills auto-trigger based on context.
2. **AGENTS.md** is loaded as the highest-priority instruction, forcing the agent to follow the workflow.
3. The **Zeus agent** is set as default, giving every session an orchestrator mindset.
4. **Enhanced skills** are registered via `skills.paths`, making them available for the orchestrator to invoke.

The result is an agent that **adapts to task complexity**:

- **Simple tasks** (≤2 files, single concern, no security risk): fast path — TDD directly, no brainstorming or sub-agent overhead
- **Complex tasks** (new features, cross-cutting, security-relevant): runs the full Superpowers pipeline below

On the full pipeline:

- Runs **security triage** before every task (pattern matching, not judgment)
- **Brainstorms** before building (explores intent, proposes approaches)
- **Deliberates** before architecture (triple-critique for complex tasks)
- Writes plans with **bite-sized tasks** (2-5 minutes each, complete code in every step)
- Dispatches sub-agents with **accountability-weighted** prompts
- Uses **ASI loop** when fixing batch issues (one fix at a time, re-scan between each)
- Verifies file integrity with **SHA-256 hashing** for security-critical work
- Reviews **spec compliance then code quality** between tasks
- Never claims completion without **fresh verification evidence**

Use `@quick` to force fast path or `@full` to force full pipeline on any task.

([back to top](#readme-top))

## Project Structure

```text
superpowers-enhanced/
├── AGENTS.md                 # User instructions (highest priority)
├── opencode-template.json    # OpenCode config template
├── install.sh                # One-liner installer (Linux / macOS / WSL)
├── install.ps1               # One-liner installer (Windows PowerShell)
├── setup.mjs                 # Cross-platform installer
├── uninstall.sh              # One-liner uninstaller (Bash)
├── uninstall.ps1             # One-liner uninstaller (PowerShell)
├── uninstall.mjs             # Cross-platform uninstaller
├── agent/
│   └── zeus.md               # Adaptive orchestrator agent (default)
├── tests/
│   └── agent/
│       └── zeus-structure.test.mjs  # Structural validation for zeus.md
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

([back to top](#readme-top))

## Updating

Re-run the one-liner installer — it's designed to be idempotent:

```bash
# Linux / macOS / WSL
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.sh)

# Windows (PowerShell)
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
```

On re-run, the installer:

- **Merges config** — only adds fields that are missing or have changed. If your `opencode.json` already has the right values, nothing happens.
- **Overwrites files** — AGENTS.md, zeus.md, verify-hash.sh, skills, and prompts get the latest versions. Originals are backed up first.
- **Preserves everything else** — model/provider config, API keys, custom files you added to the skills or prompts directories.

> [!TIP]
> Run `node setup.mjs --dry-run` from a local clone to preview what would change.

Restart OpenCode after updating for the changes to take effect.

([back to top](#readme-top))

## Uninstall

```bash
# One-liner (no clone needed)
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.sh)        # Linux / macOS / WSL
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.ps1 | iex                # Windows

# Or from a local clone
cd ~/superpowers-enhanced && node uninstall.mjs
```

The uninstaller reverts the `opencode.json` merge, removes managed files and directories, and restores your most recent backup. To fully remove the Superpowers plugin, also edit your `opencode.json` and delete the plugin entry.

## Troubleshooting

> [!NOTE]
> All installer actions are **safe by default**. Existing files are backed up before any change. Run `node setup.mjs --dry-run` to preview.

### "Superpowers is not installed" error

1. Add the plugin to `~/.config/opencode/opencode.json`:
   ```json
   "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
   ```
2. Restart OpenCode so it resolves and installs the plugin.
3. Run `node setup.mjs --force` again.

### Enhanced skills not auto-triggering

1. Verify files exist: `ls ~/.config/opencode/skills/superpowers-enhanced/`
2. Check `skills.paths` in your `opencode.json` includes `"skills/superpowers-enhanced"`
3. Each skill directory must contain a valid `SKILL.md` with YAML frontmatter (`name` and `description` fields)
4. Restart OpenCode — skills are loaded at startup, not dynamically

### Agent jumps straight to implementation

The Superpowers plugin or AGENTS.md is not being loaded. Check:

1. The plugin entry exists in your `opencode.json` plugin array
2. `~/.config/opencode/AGENTS.md` exists and is readable
3. Your config has `"instructions": ["AGENTS.md"]`
4. `"enable_experimental_skills": true` is set (skills won't load without it)
5. You restarted OpenCode after making changes

([back to top](#readme-top))
