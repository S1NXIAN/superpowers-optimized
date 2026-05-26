# Installer Rework: Symlinks → Direct File Copy/Edit

**Date:** 2026-05-26
**Status:** Approved for implementation

## Objective

Replace the current `setup.sh` symlink-based installer with a cross-platform Node.js script (`setup.mjs`) that directly copies/edits files into `~/.config/opencode/`. Must work on Linux, macOS, and Windows.

## Design Summary

A Node.js script (`setup.mjs`) performs surgical editing of `opencode.json` and direct file copies for all other assets. An `uninstall.mjs` script reverses the changes. No symlinks.

## File Operations

| Source (repo) | Destination (`~/.config/opencode/`) | Operation |
|---|---|---|
| `opencode.json` | `opencode.json` | Surgical merge — read existing, merge fields, write |
| `AGENTS.md` | `AGENTS.md` | Copy — backup existing if present, then overwrite |
| `agent/zeus.md` | `agent/zeus.md` | Copy — create `agent/` dir if needed, backup + overwrite |
| `skills/` | `skills/superpowers-enhanced/` | Recursive copy — merge, overwrite newer files |
| `prompts/` | `prompts/` | Recursive copy — merge, overwrite newer files |
| `scripts/verify-hash.sh` | `scripts/verify-hash.sh` | Copy — make executable on Linux/macOS |

## opencode.json — Surgical Merge Rules

The script reads the existing config and only adds/overwrites these fields:

| Field | Merge Rule |
|---|---|
| `plugin` | Append `"superpowers@git+https://github.com/obra/superpowers.git"` if not present. Preserve all existing plugins. |
| `default_agent` | Set to `"zeus"`. |
| `instructions` | Ensure `"AGENTS.md"` is in the array. Preserve any other instructions. |
| `skills.paths` | Append `"skills/superpowers-enhanced"` if not present. Preserve existing paths. |
| `model` | **Not touched.** |
| `small_model` | **Not touched.** |
| All other fields | **Preserved as-is.** |

Key principle: additive, not destructive.

## Scripts

### `setup.mjs`
- Node.js script (ESM, no dependencies beyond Node built-ins: `fs`, `path`, `os`)
- Reads existing `~/.config/opencode/opencode.json`
- Merges fields per the table above
- Copies AGENTS.md, zeus.md, skills dir, prompts dir, verify-hash.sh
- Backs up any file being overwritten to `~/.config/opencode/.backups/<timestamp>/`
- Validates the repo is the source (detect by checking for known files)
- Supports `--force` (skip prompts), `--dry-run` (preview), `--help`

### `uninstall.mjs`
- Removes files copied by setup.mjs (not user-original files)
- Restores most recent backup if available
- Reverts opencode.json by reversing merge (remove added entries)
- Supports `--force`, `--dry-run`, `--help`

## Platform Support

- **Linux:** Native Node.js — full support
- **macOS:** Native Node.js — full support
- **Windows:** Node.js on Windows — full support (handles `\` vs `/` paths, respects `USERPROFILE` for `~`)

The script uses `os.homedir()` to locate `~/.config/opencode/` (or `%USERPROFILE%\.config\opencode\` on Windows).

## Backup & Safety

- Before overwriting any existing file, copy to `.backups/<timestamp>/` directory
- `--dry-run` shows planned changes without touching anything
- `--force` skips confirmation prompt
- Verify after install: check destination files exist and have correct content

## What Happens to the Old Scripts

- `setup.sh` — **removed** (replaced by `setup.mjs`)
- `uninstall.sh` — **removed** (replaced by `uninstall.mjs`)
- `setup.sh --force` → `setup.mjs --force`
- `setup.sh --dry-run` → `setup.mjs --dry-run`