<!-- prettier-ignore -->
<div align="center">

# Superpowers Enhanced

*Optimized OpenCode configuration for [Superpowers](https://github.com/obra/superpowers)-driven development.*

[![Node version](https://img.shields.io/badge/Node.js->=18-3c873a?style=flat-square)](https://nodejs.org/)
[![Bash](https://img.shields.io/badge/Script-Bash-4EAA25?style=flat-square&logo=gnu-bash&logoColor=white)](install.sh)
[![PowerShell](https://img.shields.io/badge/Script-PowerShell-5391FE?style=flat-square&logo=powershell&logoColor=white)](install.ps1)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

Turns OpenCode into a disciplined orchestrator that brainstorms designs, writes plans, dispatches
subagents with TDD, reviews code systematically, and verifies before claiming completion.

[Features](#features) • [Quick Start](#quick-start) • [Protocols](#enhanced-protocols) • [Project Structure](#project-structure)

</div>

## Features

- 🧠 **Zeus Default Agent** — Orchestrator mindset with hard-coded security triage; plans and delegates instead of blindly implementing.
- 📜 **AGENTS.md Alignment** — Strict user instructions that reinforce skill authority as the highest priority.
- 🌍 **Cross-Platform** — Native one-liner installers for Linux, macOS, WSL, and Windows PowerShell.
- 🛡️ **Safe Installation** — Backs up existing OpenCode configuration before surgically merging changes.

## Quick Start

The quickest way to install is via our one-liner scripts. The installer will auto-detect your OS, install Node.js if missing, download the configuration, and apply it to your OpenCode setup.

> [!NOTE]  
> No dependencies needed — the installer handles everything automatically.

### Linux / macOS / WSL

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.sh)
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
```

> [!IMPORTANT]  
> **Restart OpenCode** after the installation completes to activate Superpowers.

---

### Manual Install

If you prefer to clone the repository (useful for customization):

```bash
git clone https://github.com/S1NXIAN/superpowers-enhanced.git ~/superpowers-enhanced
cd ~/superpowers-enhanced
node setup.mjs
```

### Non-Interactive Install

```bash
node setup.mjs --force     # skip confirmation prompts
node setup.mjs --dry-run   # preview changes only, no files modified
```

## What's Installed

When you run the installer, the following happens:

1. **`opencode.json`** is surgically merged to include the Superpowers plugin, set `zeus` as the default agent, and register custom skills.
2. **`AGENTS.md`** is copied to `~/.config/opencode/AGENTS.md` to enforce the instruction hierarchy.
3. **`agent/zeus.md`** is installed as your primary orchestrator agent.
4. **`skills/`** and **`prompts/`** are copied to enhance agent capabilities.
5. **`scripts/verify-hash.sh`** is installed to support ephemeral state hashing.

> [!TIP]  
> Existing files are backed up automatically. You can always revert changes if needed.

## Enhanced Protocols

This optimized configuration includes five custom protocols designed to enforce discipline and security during agentic development:

### 1. Mandatory Security Triage
Before any work begins, every file is checked against hard-coded triggers (paths, content, directories). If a trigger fires, the agent halts, annotates the finding, and mandates a full security audit.

### 2. ASI Loop (Batch Fix Isolation)
When multiple issues overlap, this protocol forces the agent to isolate and fix exactly **one issue per iteration** using TDD, preventing merge conflicts and regressions.

### 3. Deliberation Gate (Architecture Audit)
Before drafting blueprints for complex tasks, the agent spawns three stakeholder roles (**Skeptic**, **Minimalist**, **Maintainer**) to critique the core idea and synthesize a robust architecture.

### 4. Ephemeral State Hashing (Anti-TOCTOU)
Uses SHA-256 hash verification to ensure files aren't tampered with between the time they are checked by a sub-agent and the time they are executed or deployed.

### 5. Social Accountability Framing
Injects consequence-weighted framing into sub-agent prompts. Implementers and reviewers are explicitly told the downstream costs of their failures (e.g., "A missed test case ships regressions").

## Project Structure

```text
superpowers-enhanced/
├── AGENTS.md              # User instructions (highest priority)
├── install.sh             # One-liner installer (Linux / macOS / WSL)
├── install.ps1            # One-liner installer (Windows PowerShell)
├── opencode.json          # OpenCode configuration
├── setup.mjs              # Full installer script (cross-platform Node.js)
├── uninstall.mjs          # Uninstaller script (cross-platform Node.js)
├── agent/
│   └── zeus.md            # Custom orchestrator agent (default)
├── scripts/
│   └── verify-hash.sh     # Ephemeral State Hashing (anti-TOCTOU)
├── skills/
│   ├── asi-loop/          # ASI Batch Patching protocol
│   ├── deliberation-gate/ # Multi-perspective architecture audit
│   ├── security-triage/   # Hard-coded security trigger rules
│   └── social-accountability/ # Consequence-weighted framing
├── prompts/               # Pre-framed subagent prompt templates
```
