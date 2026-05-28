<div align="center">

# opencode-zeus

![Node version](https://img.shields.io/badge/Node.js->=18-3c873a?style=flat-square)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A high-discipline engineering pipeline and quality gate overlay for [OpenCode](https://opencode.ai).**

[Installation](#installation) • [Quickstart](#quickstart) • [Pipeline](#pipeline) • [Skills](#skills) • [Configuration](#configuration)

</div>

opencode-zeus transforms a vanilla OpenCode AI coding assistant into a structured engineering pipeline with mandatory TDD, security triage, architecture deliberation, and multi-stage code review — all orchestrated by the Zeus agent.

> [!NOTE]
> opencode-zeus extends the [Superpowers](https://github.com/obra/superpowers) methodology for OpenCode. It does not replace any existing OpenCode functionality.

## Features

- **Complexity-aware routing** — Zeus classifies every task as Fast Path (simple: fix, rename, typo) or Full Path (complex: new subsystem, 4+ files, cross-cutting), applying only the ceremony that fits.
- **Hard-coded security triage** — Every touched file is pattern-matched against 1,236 security patterns across 17 languages. No judgment calls. If a trigger fires, full audit is mandatory.
- **Multi-perspective architecture audits** — Deliberation Gate simulates Skeptic, Minimalist, and Maintainer roles before any tier-3 architecture work, with a confidence-weighted synthesis.
- **Consequence-weighted sub-agents** — Social accountability framing injected as the first line of every sub-agent prompt. Templates for Implementer, Spec Reviewer, Code Quality Reviewer, and Security Reviewer.
- **One-issue-at-a-time fix loop** — ASI Loop prevents regression cascades by fixing one overlapping-code issue per cycle with reproducer-first TDD and file-backed state.
- **Lite mode** — Optional token-saving compression. Add `lite-mode.md` to the `instructions` array to enable caveman-mode AI responses. Remove it to disable.
- **Zero dependencies** — Built with Node.js built-in modules only. No npm dependencies.

## Installation

```bash
git clone https://github.com/S1NXIAN/opencode-zeus.git
cd opencode-zeus
node bin/setup.mjs --force
```

This copies the skill files, agent definition, and prompts into `~/.config/opencode/` and merges the OpenCode configuration to register the Zeus agent and skill paths.

### Prerequisites

- [OpenCode](https://opencode.ai) installed and configured
- Node.js 18+
- The [Superpowers](https://github.com/obra/superpowers) plugin added to your `opencode.json` (setup.mjs does this automatically)

> [!TIP]
> Run `node bin/setup.mjs --dry-run` first to preview what changes will be made without touching anything.

## Quickstart

Once installed, opencode-zeus is active on every OpenCode session:

```
# Common development tasks — full pipeline with TDD, reviews, and verification
open "implement the user registration endpoint"

# Simple fixes skip the ceremony
open "fix the typo in login error message"

# Security-sensitive paths trigger automatic audit
open "refactor the auth middleware"
```

The Zeus agent classifies each request automatically:

| Classification | Trigger | What runs |
|---|---|---|
| **Fast Path** | `@quick`, or ≤2 files + fix/rename/update keywords + single concern | TDD → Verification |
| **Full Path** | `@full`, or 4+ files, security trigger, new subsystem, cross-cutting | Brainstorming → Security Triage → Plans → Sub-Agents (with social-accountability framing) → ASI Loop (if overlapping fixes) → Review → Merge |

### Manual Override

You can force the classification with annotations:

```
open "@full add a favicon"
open "@quick implement the entire auth system"
```

> [!IMPORTANT]
> Security triggers override all annotations. If T1/T2/T3 patterns fire on any touched file, the task is always routed to Full Path regardless of `@quick`.

## Pipeline

Full Path tasks execute the standard Superpowers pipeline with these stages:

1. **Brainstorming & Deliberation** — Explore requirements, propose approaches, present design. For tier-3 tasks (4+ files, new subsystem, cross-cutting), the Deliberation Gate runs a multi-perspective audit first.
2. **Security Triage** — Re-confirm all security triggers. Run the full security review checklist if any T1/T2/T3 match fired.
3. **Writing Plans** — Bite-sized implementation tasks (2-5 minutes each) with exact file paths and test-first steps. User approves the plan before execution.
4. **Sub-Agent Dispatch** — Tasks dispatched with social-accountability framing. Review order: Spec Reviewer → (Security Reviewer if triage fired) → Code Quality Reviewer.
5. **ASI Loop** — If overlapping-code issues are found, fix one per cycle with reproducer-first TDD and file-backed state.
6. **Verification & Self-Consistency** — Full test suite, side-effect checks, and 2-3 independent verification angles.
7. **Review & Merge** — Final summary with verification evidence. User approval required before merge.

Fast Path skips directly to TDD (RED → GREEN → REFACTOR) followed by self-consistency verification.

## Skills

opencode-zeus provides four skill files that are automatically loaded by OpenCode:

| Skill | File | Purpose |
|---|---|---|
| **asi-loop** | `skills/asi-loop/SKILL.md` | One-issue-at-a-time patching for overlapping-code fixes. State managed by `scripts/asi.sh`. |
| **deliberation-gate** | `skills/deliberation-gate/SKILL.md` | Multi-perspective architecture audit (Skeptic, Minimalist, Maintainer) with confidence-weighted synthesis. |
| **security-triage** | `skills/security-triage/SKILL.md` | Hard-coded T1/T2/T3 pattern matching against 1,236 patterns in 16 language-specific files. |
| **social-accountability** | `skills/social-accountability/SKILL.md` | Consequence-weighted sub-agent framing. Templates at `sub-agents/`. |

Configuration files and scripts are also deployed:

| File | Purpose |
|---|---|
| `agent/zeus.md` | Zeus orchestrator agent definition — decision tree routing and full pipeline. |
| `AGENTS.md` | Iron rules for Superpowers alignment (highest-priority system instructions). |
| `scripts/verify-hash.sh` | Anti-TOCTOU SHA-256 hash verification for security-critical work. |
| `lite-mode.md` | Optional instruction file — enables compressed caveman responses when added to `instructions` array. |
| `bin/setup.mjs` | Cross-platform installer — copies files, merges config, backs up originals. |
| `bin/uninstall.mjs` | Reverses setup — removes managed files and restores backups. |

## Configuration

The project is registered in OpenCode via `opencode.json`:

```json
{
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"],
  "default_agent": "zeus",
  "instructions": ["AGENTS.md"],
  "skills": {
    "paths": ["skills"]
  },
  "autoupdate": false
}
```

The setup script merges these settings into your existing `~/.config/opencode/opencode.json`. Backups are saved to `~/.config/opencode/.backups/` before any changes.

## Project Structure

```
├── agent/
│   └── zeus.md                   # Zeus orchestrator agent
├── lite-mode.md                  # Optional token-saving compression mode
├── bin/
│   ├── setup.mjs                 # Cross-platform installer
│   └── uninstall.mjs             # Cross-platform uninstaller
├── skills/
│   ├── asi-loop/
│   │   ├── SKILL.md              # ASI loop protocol
│   │   └── scripts/asi.sh        # State machine driver
│   ├── deliberation-gate/
│   │   └── SKILL.md              # Architecture audit protocol
│   ├── security-triage/
│   │   ├── SKILL.md              # Security trigger rules
│   │   └── patterns/             # 1,236 patterns across 17 languages
│   └── social-accountability/
│       ├── SKILL.md              # Consequence-weighted framing
│       └── sub-agents/           # 4 agent prompt templates
├── scripts/
│   └── verify-hash.sh            # Anti-TOCTOU hash verification
├── tests/                        # 84 tests (Node native test runner)
├── lib/                          # Core library modules
├── installers/                   # Shell/PowerShell install scripts
└── templates/                    # Config templates
```

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Run library unit tests
npm run test:agent    # Run agent structure tests
npm run test:integration  # Run CLI integration tests
```

## Uninstall

```bash
node bin/uninstall.mjs
```

Restores your OpenCode configuration and files from the backup created during installation.

---

<div align="center">
  <sub>Built with Node.js built-in modules. Zero dependencies.</sub>
</div>
