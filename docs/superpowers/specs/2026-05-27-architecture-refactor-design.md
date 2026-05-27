# Design Spec: Architecture Refactoring — Extract Shared Library + Comprehensive Tests

This specification details the complete architectural overhaul of the Superpowers Enhanced codebase, extracting shared utilities into a modular `lib/` layer, adding comprehensive test coverage using `node:test`, implementing JSON schema validation, and establishing a `package.json` for metadata and scripts.

## 1. Goals & Value Proposition

The refactoring should:

* **Eliminate all code duplication** between `setup.mjs` (579 lines) and `uninstall.mjs` (560 lines), extracting ~200 lines of identical utility code into shared modules.
* **Establish a `lib/` module layer** with focused, independently testable modules following 2026 ESM best practices (granular `lib/` modules, pure utility functions, explicit `.mjs` extensions).
* **Add comprehensive test coverage** using Node.js built-in `node:test` runner — unit tests for each `lib/` module and integration tests for the install/uninstall lifecycle.
* **Implement defensive JSON schema validation** for `opencode.json` that warns on unrecognized keys and rejects invalid types, preventing the `enable_experimental_skills` crash class proactively.
* **Create a `package.json`** for project metadata and `npm test` scripts, with zero external dependencies.
* **Migrate existing tests** to use `node:test` for consistency across the codebase.

## 2. Module Architecture

### 2.1 `lib/constants.mjs`

Single source of truth for all shared configuration data. Currently duplicated between:
- `setup.mjs` lines 11-16, 295-304
- `uninstall.mjs` lines 10-16, 151-160

Exports:
- `SUPERPOWERS_PLUGIN` — plugin URI string
- `SKILLS_PATH` — relative skills directory path
- `CONFIG_DIR` — absolute path to `~/.config/opencode/`
- `CONFIG_JSON_PATH` — absolute path to `opencode.json`
- `BACKUP_PARENT` — absolute path to backups directory
- `FILE_COPIES` — array of `{ repoRel, configRel, executable }` objects
- `DIR_COPIES` — array of `{ repoRel, configRel }` objects
- `MANAGED_FILES` — array of config-relative paths managed by install (used by uninstall)
- `MANAGED_DIRS` — array of config-relative directory paths managed by install

### 2.2 `lib/console.mjs`

Terminal styling and output helpers. Currently copy-pasted identically across both scripts (lines 18-37 in both files).

Exports a **factory function** for testability:
```javascript
export function createConsole(isTTY = process.stdout.isTTY) {
  // Returns: { c, outInfo, outOk, outWarn, outError, outHeader, outSubdued }
}
```

The factory pattern allows tests to create a non-TTY console and capture/suppress output without side effects.

### 2.3 `lib/fs-utils.mjs`

All filesystem operations, consolidated from both scripts. Functions accept explicit path parameters (no global state) for testability.

Exports:
- `readJson(path)` — Parse JSON from file, return null on failure
- `writeJson(path, data)` — Write JSON with 2-space indent and trailing newline
- `copyFileChecked(src, dest, options)` — Copy with symlink replacement and optional chmod
- `copyDirRecursive(src, dest, options)` — Recursive directory copy with dry-run support
- `copyDir(src, dest, options)` — Higher-level directory copy with existence checks
- `backupFile(configRelPath, configDir, backupDir)` — Backup a single file
- `backupDirContent(configRelPath, configDir, backupDir)` — Backup a directory tree
- `ensureBackupDir(backupParent)` — Create timestamped backup directory on first call
- `removeFile(configRel, configDir)` — Remove file and clean empty ancestor directories
- `removeDir(configRel, configDir)` — Remove directory tree and clean empty ancestors
- `removeEmptyAncestors(destPath, configDir)` — Walk up and remove empty parent directories
- `gitAvailable()` — Check if git is on PATH
- `getGitDiff(fileA, fileB)` — Get diff between two files using git

### 2.4 `lib/config-schema.mjs`

Defensive validation following warn-not-reject strategy for unknown keys (per Deliberation Gate / Maintainer critique: OpenCode may add new fields).

Exports:
- `validateConfig(config)` — Returns `{ warnings: string[], errors: string[], valid: boolean }`

Validation rules:
- **Type checks** for all known fields: `plugin` must be array, `default_agent` must be string, `instructions` must be array or string, `skills` must be object, `skills.paths` must be array, `autoupdate` must be boolean, `provider` must be object.
- **Unknown key warnings**: Any top-level key not in the known set (`$schema`, `plugin`, `provider`, `autoupdate`, `default_agent`, `instructions`, `skills`, `model`) produces a warning (not an error).
- **Structural checks**: `plugin` array entries must be strings, `skills.paths` array entries must be strings, `instructions` array entries must be strings.

## 3. Entry Point Refactoring

### 3.1 `setup.mjs` (target: ~180 lines, down from 579)

Remains at repo root. Imports all utilities from `lib/`. Contains only:
- `parseArgs()` — CLI parsing (setup-specific: `--force`, `--dry-run`, `--help`)
- `showHelp()` — Setup-specific help text
- `checkNodeVersion()` — Node.js version gate
- `preflight()` — Pre-installation checks
- `planJsonMerge(existingConfig)` — Compute config changes needed
- `displayPlannedChanges(...)` — Show planned changes to user
- `confirm()` — Interactive confirmation prompt
- `installConfig(configChanges)` — Apply config merge
- `installFiles(fileChanges, dirChanges)` — Copy files and directories
- `verify()` — Post-install verification including schema validation
- `main()` — Orchestrator

### 3.2 `uninstall.mjs` (target: ~180 lines, down from 560)

Remains at repo root. Same pattern — thin orchestrator importing from `lib/`. Contains only:
- `parseArgs()` — CLI parsing (uninstall-specific)
- `showHelp()` — Uninstall-specific help text
- `planJsonRevert(config)` — Compute config reversions
- `findLatestBackup()` — Locate most recent backup
- `planFileRemovals()` / `planDirRemovals()` — Plan file cleanup
- `planBackupRestores(...)` — Plan restoration from backup
- `displayPlannedChanges(...)` — Show planned changes
- `confirm()` — Interactive confirmation prompt
- `revertConfig(configChanges)` — Apply config reversion
- `restoreFromBackup(restores)` — Restore files from backup
- `verify(restoredPaths)` — Post-uninstall verification
- `main()` — Orchestrator

## 4. Test Architecture

All tests use `node:test` with `describe`/`it`/`assert` from `node:assert/strict`.

### 4.1 Unit Tests (`tests/lib/`)

#### `tests/lib/constants.test.mjs`
- All exported constants are defined and non-empty
- `FILE_COPIES` entries have `repoRel`, `configRel`, `executable` properties
- `DIR_COPIES` entries have `repoRel`, `configRel` properties
- `MANAGED_FILES` and `MANAGED_DIRS` arrays are non-empty
- `CONFIG_DIR` and `CONFIG_JSON_PATH` resolve to valid absolute paths

#### `tests/lib/console.test.mjs`
- `createConsole()` returns object with all expected function properties
- Non-TTY mode: color function `c()` returns raw string without ANSI codes
- TTY mode: color function `c()` wraps string with ANSI codes
- All output functions are callable without error

#### `tests/lib/fs-utils.test.mjs`
- `readJson()` reads valid JSON correctly
- `readJson()` returns null for missing files
- `readJson()` returns null for invalid JSON
- `writeJson()` writes JSON with proper formatting (2-space indent, trailing newline)
- `readJson`/`writeJson` roundtrip preserves data
- `copyFileChecked()` copies file to destination
- `copyFileChecked()` replaces symlinks with regular files
- `copyFileChecked()` respects dry-run mode
- `copyDirRecursive()` copies nested directory structure
- `backupFile()` creates backup in timestamped directory
- `removeFile()` removes file and cleans empty ancestors
- `removeDir()` removes directory tree recursively
- `removeEmptyAncestors()` stops at config root boundary

All tests use `beforeEach`/`afterEach` with `fs.mkdtemp`/`fs.rm` for temp directory isolation.

#### `tests/lib/config-schema.test.mjs`
- Valid minimal config passes validation
- Valid full config passes validation
- Invalid `plugin` type (not array) returns error
- Invalid `default_agent` type (not string) returns error
- Invalid `instructions` type (not array/string) returns error
- Invalid `skills` type (not object) returns error
- Unknown top-level key produces warning (not error)
- `enable_experimental_skills` specifically produces warning
- Empty config passes validation (all fields optional)
- Plugin array with non-string entries produces error
- Result includes `valid: true` when no errors, `valid: false` when errors present

### 4.2 Integration Tests (`tests/integration/`)

#### `tests/integration/setup.test.mjs`
- Full install cycle in temp directory: creates config, copies files, verifies state
- Idempotent re-run: running setup twice produces same result
- `--dry-run` mode: no files modified
- Schema validation warning displayed for existing unrecognized keys
- Verify all managed files exist after install

#### `tests/integration/uninstall.test.mjs`
- Full uninstall cycle in temp directory: removes config entries, cleans files
- Backup restoration: files restored from latest backup
- Verify all managed files removed after uninstall

### 4.3 Existing Test Migration (`tests/agent/`)

#### `tests/agent/zeus-structure.test.mjs`
- Migrate from plain `console.log`/`process.exit` assertions to `node:test` `describe`/`it`/`assert`
- Preserve all 25 existing check assertions
- Backward compatible: same checks, modern test runner

## 5. `package.json`

```json
{
  "name": "superpowers-enhanced",
  "version": "1.0.0",
  "description": "A high-discipline engineering pipeline and quality gate overlay for OpenCode",
  "type": "module",
  "scripts": {
    "test": "node --test tests/**/*.test.mjs",
    "test:unit": "node --test tests/lib/*.test.mjs",
    "test:integration": "node --test tests/integration/*.test.mjs",
    "test:agent": "node --test tests/agent/*.test.mjs",
    "setup": "node setup.mjs",
    "uninstall": "node uninstall.mjs"
  },
  "engines": {
    "node": ">=18"
  },
  "license": "MIT"
}
```

Zero external dependencies. `node:test` and `node:assert/strict` are built-in.

## 6. Installer Updates

### 6.1 `install.sh`
No changes required. It already invokes `node "${EXTRACTED}/setup.mjs" --force`, which will continue to work since `setup.mjs` remains at repo root.

### 6.2 `install.ps1`
No changes required. Same reasoning — `setup.mjs` stays at root.

## 7. Files Changed Summary

### New Files
- `lib/constants.mjs`
- `lib/console.mjs`
- `lib/fs-utils.mjs`
- `lib/config-schema.mjs`
- `package.json`
- `tests/lib/constants.test.mjs`
- `tests/lib/console.test.mjs`
- `tests/lib/fs-utils.test.mjs`
- `tests/lib/config-schema.test.mjs`
- `tests/integration/setup.test.mjs`
- `tests/integration/uninstall.test.mjs`

### Modified Files
- `setup.mjs` — Slim down from 579 to ~180 lines by importing from `lib/`
- `uninstall.mjs` — Slim down from 560 to ~180 lines by importing from `lib/`
- `tests/agent/zeus-structure.test.mjs` — Migrate to `node:test`
- `.gitignore` — Ensure `node_modules/` is listed (already present)

### Unchanged Files
- `AGENTS.md`, `agent/zeus.md`, `scripts/verify-hash.sh` — No changes
- `install.sh`, `install.ps1`, `uninstall.sh`, `uninstall.ps1` — No changes
- `prompts/*`, `skills/*` — No changes
- `opencode-template.json` — No changes

## 8. Formatting & Design Rules

- **ESM only**: All new files use `import`/`export` with explicit `.mjs` extensions
- **No external dependencies**: Zero npm packages; only Node.js built-in modules
- **Functions accept explicit parameters**: No global state, no module-level side effects in `lib/`
- **Factory patterns for testability**: Console creation via factory, not global singletons
- **Defensive validation**: Warn on unknown config keys, error only on invalid types
- **Temp directory isolation**: All integration tests use `fs.mkdtemp` + `afterEach` cleanup
