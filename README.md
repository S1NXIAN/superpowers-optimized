<div align="center">

# opencode-zeus

*Sovereign Elite engineering processor and high-discipline quality gate for [OpenCode](https://opencode.ai)*

[![Build Status](https://img.shields.io/github/actions/workflow/status/S1NXIAN/opencode-zeus/build-test.yaml?style=flat-square&label=Build)](https://github.com/S1NXIAN/opencode-zeus/actions)
![Node version](https://img.shields.io/badge/Node.js->=18-3c873a?style=flat-square)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub — it helps a lot!

[Overview](#overview) • [Features](#features) • [Getting Started](#getting-started) • [Quickstart](#quickstart) • [How it Works](#how-it-works) • [Skills Reference](#skills-reference) • [Testing](#testing) • [Uninstallation](#uninstallation)

</div>

## Overview

`opencode-zeus` is a 100% independent, Unix-optimized engineering machine that transforms OpenCode into a structured, high-IQ processor. It enforces mandatory test-driven development (TDD), adversarial security siege, and multi-perspective architecture audits. 

Orchestrated by a modular Zeus core, the system dynamically routes tasks through specialized workflows, utilizing a Strike Team of hyper-focused agents to ensure zero-defect production code.

> [!IMPORTANT]
> **Full Sovereignty:** This project has diverged from its predecessors. It is a standalone system with zero external plugin dependencies, running purely on Node.js built-in modules and standard Unix binaries.

## Features

* 🎯 **Complexity-Aware Router** - Operates as a high-SNR decision engine. Dynamically loads specialized workflows (Fast Path vs. Full Path) to minimize token waste and eliminate instruction contamination.
* 🛡️ **Strike Team Strike Forces** - Dispatches hyper-specialized sub-agents with 100% mission focus:
    * **HACKER**: Offensive security and logic bypass detection.
    * **ARCHITECT**: SOLID integrity and system boundary enforcement.
    * **QA_PRO**: SDET-level exhaustive test coverage and edge cases.
    * **CLEANER**: Technical debt elimination and DRY enforcement.
* 🧠 **Adversarial Design Gates** - Mandates a "Triple Failure-Mode" check during brainstorming. No design is approved until the system identifies three concrete ways it could fail.
* 📏 **Somatic Blast Radius Analysis** - Automatically audits call-graphs and dependencies before implementation to prevent remote regressions.
* ⚡ **Parallel Wave Execution** - Dispatches disjoint implementation tasks in single-turn bursts, increasing development velocity by up to 60% while optimizing KV-cache hits.
* 🔄 **Deterministic State Machine** - Utilizes `skills.sh` for content-aware semantic routing and `asi.sh` for conflict-free overlapping-code resolution.

## Getting Started

### Prerequisites

* [OpenCode](https://opencode.ai) CLI
* Node.js LTS (v18+)
* Linux or macOS (Windows/PowerShell is NOT supported)

### Installation

The Zeus Elite installer automatically manages both configuration and system dependencies.

#### Option A: One-Liner Installer (Quickest)

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/install.sh)
```

#### Option B: Standard Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/S1NXIAN/opencode-zeus.git
   cd opencode-zeus
   ```

2. Execute the sovereign setup utility:
   ```bash
   node bin/setup.mjs
   ```

The installer will probe your system (apt, pacman, dnf, or brew) and install any recommended system tools.

## Quickstart

Once installed, Zeus Elite is active on every `open` command. You can trigger different pipeline intensities using standard annotations:

```bash
# Standard engineering task: runs adversarial brainstorming and Strike Team review
open "implement the user registration endpoint"

# Fast path: RED-GREEN-REFACTOR for trivial fixes or updates
open "@quick fix the typo in login error message"

# Semantic trigger: files with 'auth' signatures automatically force the HACKER strike team
open "refactor the oauth middleware"
```

> [!TIP]
> You can manually force a full specialist siege on any file by adding a comment:
> `// @zeus: strike-team`

## How it Works

Zeus Elite operates as a **Somatic Processor** with three distinct layers:

1.  **The Router (`zeus.md`)**: A lightweight entry point that handles session initialization and task classification.
2.  **The Workflow (`skills/zeus/`)**: Dynamically loaded procedural logic.
    - **Full Path**: 8-stage pipeline including Premise Check, Adversarial Brainstorming, and Parallel SDD.
    - **Fast Path**: High-speed TDD sprint for micro-tasks.
3.  **The Strike Team**: Persona-driven specialists dispatched for deep-dive reviews and implementation.

## Skills Reference

| Skill Name | Description |
| :--- | :--- |
| **`premise-check`** | Mandatory YAGNI gate. Validates if work should exist at all. |
| **`deliberation-gate`**| High-SNR strategy gate with explicit Abort/Reframe logic. |
| **`token-efficiency`** | Always-on operational standard for absolute token economy. |
| **`self-consistency`** | Multi-path reasoning engine for high-stakes verification. |
| **`skills.sh`** | Deterministic semantic router and system utility. |

## Testing

Zeus Elite is backed by 150+ native Node.js tests verifying architectural integrity and routing logic.

```bash
npm test              # Run full suite
npm run test:agent    # Verify Router/Workflow handoffs
npm run test:unit     # Test core somatic utilities
```

## Uninstallation

To restore your original OpenCode configuration and remove all Zeus Elite assets:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/S1NXIAN/opencode-zeus/main/installers/uninstall.sh)
```

---

<div align="center">
  <sub>Diverged & Sovereign. Optimized for Linux/macOS. Zero-Slop Engineering.</sub>
</div>
