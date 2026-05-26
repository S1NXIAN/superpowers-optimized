# Superpowers + OpenCode

**Optimized OpenCode configuration for [Superpowers](https://github.com/obra/superpowers)-driven development.**

Turns OpenCode into a disciplined orchestrator that brainstorms designs, writes plans, dispatches
subagents with TDD, reviews code systematically, and verifies before claiming completion.

## Features

- **Zeus default agent** — orchestrator mindset with hard-coded security triage, not an implementer
- **AGENTS.md alignment** — user instructions that reinforce skill authority (highest priority)
- **DeepSeek V4 Flash Free** — capable reasoning for architecture/planning/review, fast enough for iteration
- **Cross-platform installer** — Node.js script works on Linux, macOS, and Windows
- **Safe install** — backs up existing files before overwriting, dry-run mode for preview

### Enhanced Protocols

| Protocol | What it does |
|----------|-------------|
| **Security Triage** | Hard-coded triggers (file paths, code patterns, directories) that mandate full security audit — bypasses LLM blindness to security context. |
| **ASI Loop** | Batch-fix isolation — one issue at a time, re-scan, re-prioritize. Prevents merge conflicts and regressions when fixing multiple bugs in overlapping code. |
| **Deliberation Gate** | Multi-perspective architecture audit — spawns Skeptic, Minimalist, and Maintainer roles before drafting blueprints for complex tasks. |
| **Ephemeral State Hashing** | Anti-TOCTOU protection — SHA-256 hash verification loop prevents file tampering between check and use. |
| **Social Accountability** | Consequence-weighted sub-agent prompts — reduces hallucination by assigning real-world cost to mistakes. |

## Prerequisites

- [OpenCode](https://opencode.ai) installed and started at least once
- [Superpowers plugin](https://github.com/obra/superpowers) installed in OpenCode:

  ```json
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
  ```

- A Zen model subscription or free model access (the default `deepseek-v4-flash-free` is a free Zen model)

## Quick Start

```bash
# Clone
git clone <repo-url> ~/superpowers-opencode

# Install (copies repo files into ~/.config/opencode/)
cd ~/superpowers-opencode
node setup.mjs

# Quit and restart OpenCode
```

The setup script will:
1. Verify OpenCode exists at `~/.config/opencode/`
2. Verify the Superpowers plugin is declared and installed
3. Show planned changes (opencode.json merge diff + files to copy)
4. Prompt for confirmation (unless `--force`)
5. Back up existing files before overwriting
6. Surgically edit opencode.json (merge specific fields, preserve everything else)
7. Copy AGENTS.md, agent/zeus.md, skills/, prompts/, scripts/ to config directory
8. Verify everything is installed correctly

### Non-interactive install

```bash
node setup.mjs --force     # skip prompts
node setup.mjs --dry-run   # preview only, no changes
```

## What's Installed

| File | Destination | Purpose |
|------|-------------|---------|
| `opencode.json` | `~/.config/opencode/opencode.json` | Merges plugin, default_agent, instructions, skills.paths (preserves everything else) |
| `AGENTS.md` | `~/.config/opencode/AGENTS.md` | User instructions — highest priority (outranks skills) |
| `agent/zeus.md` | `~/.config/opencode/agent/zeus.md` | Custom orchestrator agent, set as default |
| `skills/` | `~/.config/opencode/skills/superpowers-enhanced/` | Custom skills (ASI Loop, Deliberation Gate, Social Accountability) |
| `prompts/` | `~/.config/opencode/prompts/` | Enhanced subagent prompt templates |
| `scripts/verify-hash.sh` | `~/.config/opencode/scripts/verify-hash.sh` | Ephemeral State Hashing (anti-TOCTOU) |

### Configuration details

- **`default_agent: "zeus"`** — every session starts with the orchestrator agent
- **`instructions: ["AGENTS.md"]`** — Superpowers alignment is prepended to every conversation
- **`model: "opencode/deepseek-v4-flash-free"`** — primary reasoning model
- **`small_model: "opencode/deepseek-v4-flash-free"`** — used for subagent dispatch tasks
- **`skills.paths: ["skills/superpowers-enhanced"]`** — custom skills registered for auto-discovery
- **`zeus` agent** — has full tool access (`edit`, `bash`, `task`, `read`) for orchestrator duties

## Enhanced Protocols

### 1. Mandatory Security Triage

**File:** `skills/security-triage/SKILL.md`

Before ANY work begins, every file to be created or modified is checked against hard-coded
trigger rules. This is NOT a judgment call — it is pattern matching.

Three tiers of triggers:
- **T1 (File paths):** Any file matching `*auth*/**`, `*secret*/**`, `*token*/**`, `*crypto*/**`,
  `*cert*/**`, `*deploy*/**`, etc., triggers a full security audit.
- **T2 (Code content):** Any file containing `import *auth*`, `SECRET_KEY`, `def authenticate*`,
  `eval(`, etc., triggers a full security audit — regardless of file path.
- **T3 (Security-adjacent directories):** Any file in `auth/`, `security/`, `crypto/`, `certs/`,
  `secrets/`, `audit/`, `compliance/`, etc., triggers a full security audit.

When a trigger fires:
1. STOP — do not proceed with the task as described
2. FLAG — annotate with `[SECURITY-TRIAGE: <trigger> <pattern>]`
3. AUDIT — run the full security review checklist (code, dependencies, config, tests)
4. ESCALATE — production-sensitive findings go to the user before proceeding

### 2. ASI Loop — Batch Fix Isolation

**File:** `skills/asi-loop/SKILL.md`

When a scan or review surfaces multiple issues, the ASI Loop prevents the most common failure mode
of batch-fixing: breaking overlapping code by fixing two bugs at once.

```
[Issue List] → Isolate ONE → TDD Fix → Re-test → Re-scan → Update List → Repeat
```

**When it triggers:** 3+ issues in overlapping code, interdependent bugs, or a prior batch-fix failure.

### 3. Deliberation Gate — Multi-Perspective Architecture Audit

**File:** `skills/deliberation-gate/SKILL.md`

Before drafting architecture for complex (tier-3) tasks, three stakeholder roles critique the
core idea — each getting exactly one un-debated response:

| Role | Focus |
|------|-------|
| **Skeptic** | Why it fails at scale (concurrency, bottlenecks, race conditions) |
| **Minimalist** | How to achieve it with existing utilities, no new deps |
| **Maintainer** | Long-term tech debt, testability, next-developer comprehension |

**Result:** A synthesized, corrected architecture that survived all three critiques.

### 4. Ephemeral State Hashing — Anti-TOCTOU Protection

**File:** `scripts/verify-hash.sh`

Prevents Time-of-Check to Time-of-Use exploits where a compromised sub-agent passes a scan
then swaps the payload before execution:

```bash
# After sub-agent writes a file
./scripts/verify-hash.sh store path/to/file.py

# Before test execution or deployment
./scripts/verify-hash.sh verify path/to/file.py

# If hash changed: exit code 1, alert thrown, execution blocked
```

All tracked files can be checked at once:
```bash
./scripts/verify-hash.sh check
./scripts/verify-hash.sh status
./scripts/verify-hash.sh clear
```

### 5. Social Accountability Framing

**Files:** `skills/social-accountability/SKILL.md`, `prompts/implementer.md`, `prompts/spec-reviewer.md`, `prompts/code-quality-reviewer.md`

Sub-agent prompts with consequence-weighted framing. Each role gets clear downstream
consequences for failure:

- **Implementer:** "A missed test case ships regressions. A bug wastes a full validation cycle."
- **Spec Reviewer:** "A false positive wastes a cycle. A missed spec gap ships without a feature."
- **Code Reviewer:** "You are the LAST gate before production. Structural issues compound tech debt."

The `prompts/` directory contains pre-framed templates that the orchestrator dispatches
instead of generic instructions.

### Integration Flow

These five protocols integrate into the standard Superpowers workflow:

```
[Deliberation Gate] — before blueprint for tier-3 tasks
         ↓
  brainstorming → design doc → user approval
         ↓
  [Security Triage] — BEFORE ANY WORK: hard-coded pattern matching
         ↓
  writing-plans → implementation plan → user approval
         ↓
  [Social Accountability] — in subagent dispatch prompts
         ↓
  subagent-driven-development → execute task-by-task
         ↓
    [ASI Loop] — when multiple issues found in reviews
    [Ephemeral Hashing] — for security-critical patches
         ↓
  finishing-a-development-branch → merge/PR/cleanup
```

## How It Works

When OpenCode starts, it:

1. Loads the Superpowers plugin → injects bootstrap → skills auto-trigger
2. Loads `AGENTS.md` → the agent is instructed to trust skills, follow workflow, use TDD
3. Uses the `zeus` agent → orchestrator mindset by default
4. Loads enhanced skills from `skills.paths` → Security Triage, ASI Loop, Deliberation Gate, Social Accountability

The result is an agent that:

- **Runs security triage** before ANY work (hard-coded pattern matching, not judgment)
- **Brainstorms** before building (captures intent, proposes 2-3 approaches)
- **Deliberates** before architecture (Skeptic → Minimalist → Maintainer critique for complex tasks)
- **Writes plans** with bite-sized tasks (2-5 min each, complete code in every step)
- **Dispatches subagents** with accountability-framed prompts
- **Uses ASI Loop** when fixing batch issues (one fix at a time, re-scan between each)
- **Verifies file integrity** with SHA-256 hashing for security-critical work
- **Reviews** spec compliance then code quality between tasks
- **Verifies** with fresh evidence before claiming completion
- **Debugs** systematically (root cause first, never random fixes)

## Verification

After installation, verify the setup:

```bash
# Check files exist
ls -la ~/.config/opencode/opencode.json
ls -la ~/.config/opencode/AGENTS.md
ls -la ~/.config/opencode/agent/zeus.md
ls -la ~/.config/opencode/skills/superpowers-enhanced/

# Verify each skill has a SKILL.md
ls ~/.config/opencode/skills/superpowers-enhanced/*/SKILL.md

# Test the hash verification script
./scripts/verify-hash.sh store scripts/verify-hash.sh
./scripts/verify-hash.sh verify scripts/verify-hash.sh
# Should exit 0 — "Integrity verified"
```

Then restart OpenCode and try:

> "Let's build a todo list"

Superpowers should auto-trigger the `brainstorming` skill before any code is written.

## Customization

### Changing the model

Edit `opencode.json`:

```json
{
  "model": "opencode/gpt-5.5-pro",
  "small_model": "opencode/gpt-5.4-mini"
}
```

### Modifying enhanced skills

Edit the files in `skills/` or `prompts/`. The skills are registered via `skills.paths`
in `opencode.json`. No symlink update needed — changes are live after restart.

### Adding project-specific instructions

Add an `AGENTS.md` or `CLAUDE.md` to your project root. It merges with the global file
(project-level instructions take precedence).

### Modifying agent behavior

Edit `agent/zeus.md`. The YAML frontmatter controls model, permissions, and visibility.
The body is the system prompt.

## Uninstall

```bash
cd ~/superpowers-opencode
node uninstall.mjs
```

This reverts opencode.json changes, removes copied files and directories, and restores
the most recent backup if one exists.

To fully remove Superpowers from your config, delete the plugin line from `opencode.json`:

```diff
- "superpowers@git+https://github.com/obra/superpowers.git",
```

## Troubleshooting

### "Superpowers is not installed" error

1. Add the plugin to your `~/.config/opencode/opencode.json`:
   ```json
   "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
   ```
2. Restart OpenCode so it resolves and installs the plugin.
3. Run `node setup.mjs` again.

### Enhanced skills not auto-triggering

1. Verify the files exist: `ls ~/.config/opencode/skills/superpowers-enhanced/`
2. Check skills.paths in opencode.json contains `"skills/superpowers-enhanced"`
3. Verify each skill has a valid `SKILL.md` with YAML frontmatter
4. Restart OpenCode — skills are loaded at startup

### Skills not auto-triggering

1. Verify Superpowers is in your plugin list: `grep superpowers ~/.config/opencode/opencode.json`
2. Check the plugin installed: `ls ~/.config/opencode/node_modules/superpowers/`
3. Restart OpenCode — config is loaded once at startup.
4. OpenCode >= 0.11.0 required for `experimental.chat.system.transform` hook support.

### Setup script fails

The setup script requires Node.js (which OpenCode also requires). Install Node.js from [nodejs.org](https://nodejs.org/) if not already available.

## Updating

```bash
cd ~/superpowers-opencode
git pull
node setup.mjs --force
```

Changes take effect after restarting OpenCode.

## Project Structure

```
superpowers-opencode/
├── AGENTS.md              # User instructions (highest priority)
├── LICENSE                # MIT
├── README.md              # This file
├── opencode.json          # OpenCode configuration
├── setup.mjs              # Installer script (cross-platform Node.js)
├── uninstall.mjs          # Uninstaller script (cross-platform Node.js)
├── agent/
│   └── zeus.md             # Custom orchestrator agent (default)
├── skills/
│   ├── asi-loop/
│   │   └── SKILL.md       # ASI Batch Patching protocol
│   ├── deliberation-gate/
│   │   └── SKILL.md       # Multi-perspective architecture audit
│   ├── security-triage/
│   │   └── SKILL.md       # Hard-coded security trigger rules
│   └── social-accountability/
│       └── SKILL.md       # Consequence-weighted subagent framing
├── prompts/
│   ├── implementer.md     # Enhanced subagent prompt with accountability
│   ├── spec-reviewer.md   # Enhanced spec reviewer prompt
│   └── code-quality-reviewer.md  # Enhanced code reviewer prompt
├── scripts/
│   └── verify-hash.sh     # Ephemeral State Hashing (anti-TOCTOU)
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

## License

MIT
