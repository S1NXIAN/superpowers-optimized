# Design Doc: Zeus Elite Zero (Full Sovereignty)

**Date:** 2026-05-29  
**Status:** Approved  
**Topic:** Transitioning Zeus to a 100% independent system by removing Zeus Elite dependencies and hardening for Unix-only high-performance environments.

## 1. Problem Statement
Zeus currently relies on the Zeus Elite plugin for its execution engine and terminology. To achieve full ownership and maximum performance, we must decouple from the upstream project and implement our own native logic.

## 2. Proposed Architecture: Zeus Elite Zero
A 100% independent orchestration layer designed specifically for Unix environments with high-performance modern tooling.

### 2.1 Component Map
- **`agent/zeus.md` (The Router)**:
  - **Identity:** Global orchestrator (Zeus Elite).
  - **Logic:** Unix-only Session Init, Security Scan, Routing.
  - **Purpose:** Directs workflows without external plugin dependencies.
- **`skills/` Registry**:
  - All logic is now owned by `opencode-zeus`. All "Zeus Elite" references are purged.

### 2.2 Modern Tooling & Performance
Zeus Elite prioritizes modern CLI utilities for maximum speed:
- **`rg` (ripgrep)**: Replaces standard `grep` for lightning-fast content search.
- **`fd`**: Replaces standard `find` for rapid file discovery.
- **`git`**: Absolute requirement for staleness tracking.

### 2.3 Automatic Tooling Injection
The Zeus installer (`setup.mjs`) will now automatically detect the Linux package manager and install dependencies:
- **apt**: `sudo apt install -y ripgrep fd-find`
- **dnf/yum**: `sudo dnf install -y ripgrep fd-find`
- **pacman**: `sudo pacman -S --noconfirm ripgrep fd`
- **brew**: `brew install ripgrep fd`

## 3. Platform Constraint: Unix-Only
Zeus Elite officially removes all support for Windows (PowerShell/CMD).
- Target directory: `$HOME/.config/opencode`.
- All `.ps1` files and Windows-specific path-handling code will be deleted.

## 4. Success Criteria
- **Zero Dependencies**: `zeus` plugin removed from `opencode.json`.
- **Instruction Sovereignty**: All markdown files reflect "Zeus Elite" standards.
- **Performance Boost**: System tools (`rg`, `fd`) are available and utilized by the orchestrator.

