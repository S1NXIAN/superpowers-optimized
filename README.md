<div align="center">

# opencode-zeus

*A high-discipline engineering pipeline and quality gate overlay for [OpenCode](https://opencode.ai)*

[![Build Status](https://img.shields.io/github/actions/workflow/status/S1NXIAN/opencode-zeus/build-test.yaml?style=flat-square&label=Build)](https://github.com/S1NXIAN/opencode-zeus/actions)
![Node version](https://img.shields.io/badge/Node.js->=18-3c873a?style=flat-square)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub — it helps a lot!

[Overview](#overview) • [Features](#features) • [Getting Started](#getting-started) • [Quickstart](#quickstart) • [How it Works](#how-it-works) • [Skills Reference](#skills-reference) • [Testing](#testing) • [Uninstallation](#uninstallation)

</div>

## Overview

`opencode-zeus` transforms a vanilla OpenCode AI coding assistant into a structured, high-discipline engineering pipeline with mandatory test-driven development (TDD), security triage, architecture deliberation, and multi-stage code review. All processes are orchestrated by a central Zeus agent that dynamically scales its quality gate ceremony to match the complexity of the incoming task.

> [!NOTE]
> This overlay extends the [Zeus Elite](https://github.com/obra/superpowers) engineering methodology specifically optimized for OpenCode environments. It operates completely locally, with zero third-party dependencies, running purely on Node.js built-in modules.

## Features

* 🎯 **Complexity-Aware Routing** - Dynamically classifies incoming developer tasks. Simple tasks (typos, single file changes) bypass unnecessary pipeline stages to execute on the Fast Path, while larger or riskier tasks route to the Full Path.
* 🛡️ **Automated Security Triage** - Executes an automated pattern match checking every single touched file against 1,236 security patterns across 17 languages. If any trigger is matched, the workflow escalates to Full Path for a mandatory manual audit.
* 🧠 **Multi-Perspective Architecture Audits** - Implements the `deliberation-gate` skill to simulate distinct agent perspectives (Skeptic, Minimalist, Maintainer) before any complex, multi-file architectural work begins.
* 🤝 **Consequence-Weighted Sub-Agents** - Dispatches isolated units of implementation work to sub-agents with strict, context-injected social-accountability framing (roles include Implementer, Spec Reviewer, Code Quality Reviewer, and Security Reviewer).
* 🔄 **ASI (Anti-Regression) Fix Loop** - Resolves complex, overlapping-code errors one file and one issue at a time using test-reproducer isolation and `asi.sh` state machines to prevent cascading regressions.
* ⚡ **Optional Token-Saving Lite Mode** - Supports response compression via a highly optimized "caveman" communication standard (defined in `LITE.md`) that reduces LLM token consumption by up to 75% without compromising technical precision.

## Getting Started

### Prerequisites

Before installing `opencode-zeus`, ensure you have the following installed on your machine:
* [OpenCode](https://opencode.ai) CLI and runtime environment
* Node.js LTS (version 18 or higher)

### Installation

Choose the installation method that fits your workflow:

#### Option A: One-Liner Installer (Quickest)

You can install `opencode-zeus` directly using a preflight-checked shell script. This script automatically checks your environment, installs Node.js if missing, and executes the installer:

* **macOS / Linux:**
  ```bash
  bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/install.sh)
  ```
* **Windows (PowerShell):**
  ```powershell
  irm https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/install.ps1 | iex
  ```

#### Option B: Standard Manual Installation

1. Clone this repository to your local workspace:
   ```bash
   git clone https://github.com/S1NXIAN/opencode-zeus.git
   cd opencode-zeus
   ```

2. Run the cross-platform setup utility:
   ```bash
   node bin/setup.mjs
   ```

   > [!TIP]
   > You can run a dry-run first to see exactly what files and configurations will be updated without modifying anything on your local disk:
   > ```bash
   > node bin/setup.mjs --dry-run
   > ```

The installer copies skills, agent instructions, and scripts into `~/.config/opencode/` and merges required configurations into your local `opencode.json`. Existing settings are automatically backed up prior to any write operations.

## Quickstart

Once installed, the Zeus orchestrator automatically wraps all OpenCode developer interactions. You can trigger different pipeline ceremonies using standard developer command patterns or inline annotations:

```bash
# Standard engineering task: runs full brainstorming, planning, and review pipeline
open "implement the user registration endpoint"

# Bypass ceremony for simple copy changes or single-file fixes
open "fix the typo in login error message"

# Security-sensitive modules trigger mandatory audit and full pipeline regardless of size
open "refactor the auth middleware"
```

### Manual Overrides

You can explicitly force specific routing behaviors by prepending commands with standard directives:

```bash
# Force the full quality gate pipeline on a simple task
open "@full add a favicon"

# Force the fast path workflow on a task
open "@quick implement the entire auth system"
```

> [!IMPORTANT]
> Security triggers always override manual overrides. If T1, T2, or T3 patterns match any modified file, the Zeus agent escalates the task to the Full Path workflow even if `@quick` is specified.

### Task Routing Matrix

| Route | Trigger Conditions | Pipeline Execution Flow |
| :--- | :--- | :--- |
| **Fast Path** | `@quick` annotation, OR files touched ≤ 2 with task keywords in `{fix, typo, rename, update, bump, refactor}` and a single logical concern. | Security Triage (passed) &rarr; TDD (RED &rarr; GREEN &rarr; REFACTOR) &rarr; Self-Consistency Verification &rarr; Automated Cleanup. |
| **Full Path** | `@full` annotation, OR 4+ files touched, OR security pattern trigger, OR new subsystem, OR cross-cutting changes. | Brainstorming & Deliberation &rarr; Security Triage &rarr; Action Plans &rarr; Sub-Agent Implementation & Review &rarr; ASI Fix Loop (if needed) &rarr; Verification &rarr; User Approval &rarr; Automated Cleanup. |

## How it Works

### Full Path Workflow

Complex or risky developer tasks proceed through the complete high-discipline execution pipeline:

1. **Brainstorming & Deliberation** - The active workspace is analyzed, options are evaluated, and a concrete design blueprint is drafted. For tier-3 tasks (4+ files or major subsystems), the `deliberation-gate` skill is executed to simulate Minimalist, Skeptic, and Maintainer perspectives before final design approval.
2. **Security Triage** - Files are audited against the comprehensive language-specific patterns in `skills/security-triage/patterns/`. Any production impacts are flagged and presented directly to the user.
3. **Writing Plans** - The approved design is broken down into bite-sized tasks (2-5 minutes each) with precise file paths, verification steps, and test-first requirements.
4. **Sub-Agent Dispatch** - Implementation tasks are delegated to isolated sub-agents. The agent prompt is automatically injected with consequence-weighted social-accountability instructions matching their assigned role (Implementer, Spec Reviewer, Code Quality Reviewer, or Security Reviewer).
5. **ASI Loop** - If multiple overlapping issues are found, the `asi-loop` protocol isolates and corrects one issue per cycle using reproducer-first TDD.
6. **Verification & Self-Consistency** - The full test suite runs, and the agent generates 2-3 independent verification checks from different analytical angles to confirm complete functionality.
7. **Review & Merge** - A comprehensive summary of the changes and test evidence is presented. No branch changes are merged without explicit user approval.
8. **Cleanup** - The cleanup process (`node bin/cleanup.mjs`) automatically purges all temporary files (design documents, plans, state files) generated during the session.

### Fast Path Workflow

For simple changes, Zeus streamlines the process to maintain speed without sacrificing code quality:
1. **TDD Execution** - Bypasses planning to jump straight into test-driven development (RED &rarr; GREEN &rarr; REFACTOR).
2. **Self-Consistency Verification** - Runs tests, inspects git diffs, and checks edge cases before claiming success.
3. **Automated Cleanup** - Purges AI-generated temporary files automatically.

## Skills Reference

`opencode-zeus` installs several modular engineering skills and automation drivers:

### Skill Protocols

| Skill Name | Location | Purpose |
| :--- | :--- | :--- |
| **`asi-loop`** | `skills/asi-loop/SKILL.md` | One-issue-at-a-time patching mechanism for overlapping-code fixes. Driven by `skills/asi-loop/scripts/asi.sh`. |
| **`deliberation-gate`** | `skills/deliberation-gate/SKILL.md` | Multi-perspective architecture audit protocol (Skeptic, Minimalist, Maintainer). |
| **`security-triage`** | `skills/security-triage/SKILL.md` | Pre-execution pattern-matching engine using 1,236 signatures across 17 languages. |
| **`social-accountability`** | `skills/social-accountability/SKILL.md` | Context-injected agent prompts forcing strict role accountability and peer-review structures. |

### Core System Files

| File Path | Description |
| :--- | :--- |
| **`agent/zeus.md`** | The primary Zeus orchestrator agent definition, housing decision trees and routing workflows. |
| **`AGENTS.md`** | Global superpowers alignment rules and non-negotiable instruction hierarchy. |
| **`LITE.md`** | Communication protocol definition for caveman-style, token-saving responses. |
| **`scripts/verify-hash.sh`** | Anti-TOCTOU hash verification utility for security-critical environments. |
| **`bin/setup.mjs`** | Installation script for merging configuration files and registering skills. |
| **`bin/uninstall.mjs`** | Uninstallation script to cleanly restore original configurations and remove files. |

## Testing

The project is backed by a comprehensive suite of 154 unit and integration tests written using Node.js's native test runner (no third-party dependencies required).

You can run the entire test suite or target specific layers of the system:

```bash
# Run the complete test suite
npm test

# Run unit tests for core libraries (fs-utils, constants, command-guard, etc.)
npm run test:unit

# Run orchestrator agent structure and rule validation tests
npm run test:agent

# Run CLI installation and setup integration tests
npm run test:integration
```

## Uninstallation

If you need to remove the `opencode-zeus` overlay and restore your original OpenCode configuration, you can use either of the following methods:

### Option A: One-Liner Uninstaller

* **macOS / Linux:**
  ```bash
  bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/uninstall.sh)
  ```
* **Windows (PowerShell):**
  ```powershell
  irm https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/uninstall.ps1 | iex
  ```

### Option B: Local Clean

If you have the repository checked out locally:

```bash
node bin/uninstall.mjs
```

This utility restores the backup of `opencode.json` that was captured during the initial installation and recursively removes all deployed files.

---

<div align="center">
  <sub>Built purely with Node.js built-in modules. Zero third-party dependencies.</sub>
</div>