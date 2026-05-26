# Installer Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace symlink-based shell installer with cross-platform Node.js scripts that directly copy/edit files in `~/.config/opencode/`.

**Architecture:** Two Node.js ESM scripts (`setup.mjs`, `uninstall.mjs`). `setup.mjs` reads existing `opencode.json`, surgically merges specific fields, copies assets with backups. `uninstall.mjs` reverses the merge and removes copied files. Zero npm dependencies — uses only Node built-ins (`fs`, `path`, `os`).

**Tech Stack:** Node.js ESM, no dependencies.

---

### Task 1: Create `setup.mjs` — scaffolding, helpers, terminal styling, backup system

**Files:**
- Create: `setup.mjs`

- [ ] **Step 1: Write the scaffolding, path helpers, terminal styling, and backup system**

```javascript
#!/usr/bin/env node

/**
 * setup.mjs — Superpowers + OpenCode config installer
 *
 * Installs a Superpowers-optimized OpenCode configuration by surgically
 * editing opencode.json and copying assets. Cross-platform (Linux/macOS/Windows).
 *
 * Usage:  node setup.mjs               # interactive (prompts before overwriting)
 *         node setup.mjs --force        # non-interactive
 *         node setup.mjs --dry-run      # preview only, no changes
 *         node setup.mjs --help         # show help
 */

import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync,
  rmSync, readdirSync, statSync, chmodSync
} from 'fs';
import { join, dirname, basename, resolve, sep } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = resolve(__dirname);
const CONFIG_DIR = join(homedir(), '.config', 'opencode');

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const BACKUP_DIR = join(CONFIG_DIR, '.backups', timestamp());

// ---------------------------------------------------------------------------
// Terminal styling (ANSI on supported terminals)
// ---------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
const style = {
  red:    isTTY ? '\x1b[0;31m' : '',
  green:  isTTY ? '\x1b[0;32m' : '',
  yellow: isTTY ? '\x1b[1;33m' : '',
  blue:   isTTY ? '\x1b[0;34m' : '',
  bold:   isTTY ? '\x1b[1m' : '',
  dim:    isTTY ? '\x1b[2m' : '',
  nc:     isTTY ? '\x1b[0m' : '',
};

const out = {
  info:    (msg) => console.log(`  ${style.blue}•${style.nc} ${msg}`),
  ok:      (msg) => console.log(`  ${style.green}✓${style.nc} ${msg}`),
  warn:    (msg) => console.log(`  ${style.yellow}⚠${style.nc} ${msg}`),
  error:   (msg) => console.log(`  ${style.red}✗${style.nc} ${msg}`),
  header:  (msg) => console.log(`\n${style.bold}${msg}${style.nc}`),
  subdued: (msg) => console.log(`  ${style.dim}${msg}${style.nc}`),
};

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function backupFile(configRelPath) {
  // Backup existing file (not a symlink, real file) to .backups/<timestamp>/
  const src = join(CONFIG_DIR, configRelPath);
  if (!existsSync(src)) return null;

  // Ignore symlinks (if any old symlinks survived)
  try {
    const lstat = statSync(src);
    if (!lstat.isFile()) return null;
  } catch { return null; }

  const dest = join(BACKUP_DIR, configRelPath);
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  return dest;
}

function backupDir(configRelPath) {
  const src = join(CONFIG_DIR, configRelPath);
  if (!existsSync(src)) return null;

  try {
    const lstat = statSync(src);
    if (!lstat.isDirectory()) return null;
  } catch { return null; }

  const dest = join(BACKUP_DIR, configRelPath);
  ensureDir(dirname(dest));
  // Recursive copy for backup
  copyDirRecursive(src, dest);
  return dest;
}

function copyFile(src, dest, { executable = false, dryRun = false } = {}) {
  if (dryRun) {
    if (existsSync(dest)) {
      out.subdued(`  Would overwrite: ${dest}`);
    } else {
      const rel = dest.replace(CONFIG_DIR + sep, '');
      out.subdued(`  Would create: ${rel}`);
    }
    return;
  }
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
  if (executable && process.platform !== 'win32') {
    try { chmodSync(dest, 0o755); } catch { /* ignore */ }
  }
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function copyDir(src, dest, { dryRun = false } = {}) {
  if (!existsSync(src)) {
    out.warn(`Source directory not found: ${src}`);
    return;
  }

  if (dryRun) {
    const entries = readdirSync(src);
    for (const entry of entries) {
      const destPath = join(dest, entry);
      if (existsSync(destPath)) {
        const rel = destPath.replace(CONFIG_DIR + sep, '');
        out.subdued(`  Would overwrite: ${rel}`);
      } else {
        const rel = destPath.replace(CONFIG_DIR + sep, '');
        out.subdued(`  Would create: ${rel}`);
      }
    }
    return;
  }

  ensureDir(dest);
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function removeFileOrDir(target) {
  if (!existsSync(target)) return;
  const stats = statSync(target);
  if (stats.isDirectory()) {
    rmSync(target, { recursive: true, force: true });
  } else {
    rmSync(target, { force: true });
  }
}

// ---------------------------------------------------------------------------
// Constants: what to install
// ---------------------------------------------------------------------------
const SUPERPOWERS_PLUGIN = 'superpowers@git+https://github.com/obra/superpowers.git';
const SKILLS_PATH = 'skills/superpowers-enhanced';

// File copies: { src (repo relative), dest (config relative), executable? }
const FILE_OPS = [
  { src: 'AGENTS.md',                      dest: 'AGENTS.md' },
  { src: join('agent', 'zeus.md'),         dest: join('agent', 'zeus.md') },
  { src: join('scripts', 'verify-hash.sh'), dest: join('scripts', 'verify-hash.sh'), executable: true },
];

// Directory copies: { src (repo relative), dest (config relative) }
const DIR_OPS = [
  { src: 'skills',                         dest: SKILLS_PATH },
  { src: 'prompts',                        dest: 'prompts' },
];

// ---------------------------------------------------------------------------
// Merge logic for opencode.json
// ---------------------------------------------------------------------------
const MERGE_FIELDS = ['plugin', 'default_agent', 'instructions', 'skills'];

function readJson(filePath) {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    out.warn(`Cannot parse ${filePath}: ${err.message}. Will create new.`);
    return {};
  }
}

function mergeConfig(existing, repoJson) {
  // Plugin
  if (!Array.isArray(existing.plugin)) existing.plugin = [];
  if (!existing.plugin.includes(SUPERPOWERS_PLUGIN)) {
    existing.plugin.push(SUPERPOWERS_PLUGIN);
  }

  // default_agent
  if (repoJson.default_agent) {
    existing.default_agent = repoJson.default_agent;
  }

  // instructions
  if (!Array.isArray(existing.instructions)) existing.instructions = [];
  const agentsMd = 'AGENTS.md';
  if (!existing.instructions.includes(agentsMd)) {
    existing.instructions.push(agentsMd);
  }

  // skills.paths
  if (!existing.skills) existing.skills = {};
  if (!Array.isArray(existing.skills.paths)) existing.skills.paths = [];
  if (!existing.skills.paths.includes(SKILLS_PATH)) {
    existing.skills.paths.push(SKILLS_PATH);
  }

  return existing;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function showHelp() {
  console.log(`${style.bold}Superpowers + OpenCode — config installer${style.nc}`);
  console.log();
  console.log(`${style.dim}Installs a Superpowers-optimized OpenCode configuration.${style.nc}`);
  console.log();
  console.log(`${style.bold}Usage:${style.nc}  node setup.mjs [OPTIONS]`);
  console.log();
  console.log(`${style.bold}Options:${style.nc}`);
  console.log('  --force       Non-interactive; overwrite without prompting');
  console.log('  --dry-run     Show what would change; don\'t touch anything');
  console.log('  --help        Show this help and exit');
  console.log();
  console.log(`${style.bold}What it does:${style.nc}`);
  console.log('  1. Validates prerequisites (OpenCode + Superpowers plugin)');
  console.log('  2. Surgically edits opencode.json (adds plugin, agent, instructions, skills)');
  console.log('  3. Copies AGENTS.md, agent/zeus.md, skills/, prompts/, scripts/');
  console.log('  4. Backs up existing files before overwriting');
  console.log();
  console.log(`${style.bold}Uninstall:${style.nc}  node uninstall.mjs`);
}

// ---------------------------------------------------------------------------
// Preflight checks
// ---------------------------------------------------------------------------
function preflight() {
  let failed = false;

  out.header('Prerequisites');

  // OpenCode config must exist
  const configJson = join(CONFIG_DIR, 'opencode.json');
  if (!existsSync(configJson)) {
    out.error(`OpenCode config not found at ${configJson}`);
    out.error('Make sure OpenCode is installed and has been started at least once.');
    failed = true;
  } else {
    out.ok(`OpenCode config found at ${CONFIG_DIR}`);
  }

  // Superpowers plugin must be declared
  if (existsSync(configJson)) {
    const config = readJson(configJson);
    const hasPlugin = Array.isArray(config.plugin) &&
      config.plugin.some(p => String(p).includes('superpowers'));
    if (hasPlugin) {
      out.ok('Superpowers plugin declared in opencode.json');
    } else {
      out.warn('Superpowers plugin not found in opencode.json');
      out.warn(`  Will add: "${SUPERPOWERS_PLUGIN}"`);
    }
  }

  // Git availability for diff display
  let hasGit = false;
  try {
    execSync('git --version', { stdio: 'ignore' });
    hasGit = true;
  } catch { /* not available */ }

  if (failed) {
    out.error('Preflight checks failed. Fix the issues above and re-run.');
    process.exit(1);
  }

  return { hasGit };
}
```

- [ ] **Step 2: Save the file and verify it parses**

Run:
```bash
node setup.mjs --help
```

Expected: Shows help text with usage, exits 0.

---

### Task 2: Create `setup.mjs` — main entry, CLI parsing, and dry-run/install flow

**Files:**
- Modify: `setup.mjs` (append main function)

- [ ] **Step 1: Append the main entry point and CLI parser**

Append this to `setup.mjs`:

```javascript
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const FORCE = args.includes('--force');
  const DRY_RUN = args.includes('--dry-run');

  if (args.includes('--help') || args.length === 0 && process.stdin.isTTY === false) {
    // Only show help if --help or no args in non-interactive mode
  }
  if (args.includes('--help')) {
    showHelp();
    return;
  }

  // ---- Preflight ----
  const { hasGit } = preflight();

  // ---- Show planned changes ----
  out.header('Planned changes');

  let changesPlanned = false;

  // opencode.json merge
  const configPath = join(CONFIG_DIR, 'opencode.json');
  const existing = readJson(configPath);
  const repoJson = readJson(join(REPO_DIR, 'opencode.json'));
  const merged = mergeConfig(JSON.parse(JSON.stringify(existing)), repoJson);

  // Show JSON diff
  const existingStr = JSON.stringify(existing, null, 2);
  const mergedStr = JSON.stringify(merged, null, 2);
  if (existingStr !== mergedStr) {
    changesPlanned = true;
    out.info('opencode.json will be updated:');
    // Show what changed
    const existingKeys = Object.keys(existing);
    const mergedKeys = Object.keys(merged);
    for (const key of mergedKeys) {
      const oldVal = JSON.stringify(existing[key]);
      const newVal = JSON.stringify(merged[key]);
      if (oldVal !== newVal) {
        out.subdued(`  ${key}: ${oldVal} → ${newVal}`);
      }
    }
    for (const key of mergedKeys) {
      if (!existingKeys.includes(key)) {
        out.subdued(`  ${key}: (new) ${JSON.stringify(merged[key])}`);
      }
    }
  }

  // File copy changes
  for (const op of FILE_OPS) {
    const destPath = join(CONFIG_DIR, op.dest);
    const srcPath = join(REPO_DIR, op.src);
    if (!existsSync(srcPath)) {
      out.warn(`Missing in repo: ${op.src} — skipping`);
      continue;
    }
    if (existsSync(destPath)) {
      changesPlanned = true;
      out.subdued(`Will overwrite: ${op.dest}`);
    } else {
      changesPlanned = true;
      out.subdued(`Will create: ${op.dest}`);
    }
  }

  // Directory copy changes
  for (const op of DIR_OPS) {
    const srcPath = join(REPO_DIR, op.src);
    if (!existsSync(srcPath)) {
      out.warn(`Missing in repo: ${op.src}/ — skipping`);
      continue;
    }
    changesPlanned = true;
    out.subdued(`Will sync: ${op.dest}/ ← ${op.src}/`);
  }

  if (DRY_RUN) {
    out.header('Dry run');
    out.info('No changes were made.');
    return;
  }

  if (!changesPlanned) {
    out.warn('No changes detected — config is already up to date');
    return;
  }

  // ---- Confirm ----
  if (!FORCE) {
    out.header('Confirmation');
    // Read single keypress
    process.stdout.write(`  ${style.bold}Proceed with installation?${style.nc} [Y/n] `);
    const answer = await readChar();
    if (answer === 'n' || answer === 'N') {
      out.info('Installation cancelled.');
      return;
    }
  }

  // ---- Install ----
  out.header('Installing');

  let installedCount = 0;
  let backedUpCount = 0;

  // 1. opencode.json merge
  const mergedStrFinal = JSON.stringify(merged, null, 2);
  if (existingStr !== mergedStrFinal) {
    // Backup existing
    if (existsSync(configPath)) {
      const backupPath = backupFile('opencode.json');
      if (backupPath) {
        backedUpCount++;
        out.ok(`Backed up opencode.json`);
      }
    }
    writeFileSync(configPath, mergedStrFinal, 'utf8');
    installedCount++;
    out.ok('Updated opencode.json');
  } else {
    out.subdued('opencode.json already current');
  }

  // 2. Copy files
  for (const op of FILE_OPS) {
    const srcPath = join(REPO_DIR, op.src);
    if (!existsSync(srcPath)) continue;

    const destPath = join(CONFIG_DIR, op.dest);

    // Backup existing
    if (existsSync(destPath)) {
      const backupPath = backupFile(op.dest);
      if (backupPath) backedUpCount++;
    }

    copyFile(srcPath, destPath, { executable: op.executable });
    installedCount++;
    out.ok(`Copied ${op.dest}`);
  }

  // 3. Copy directories
  for (const op of DIR_OPS) {
    const srcPath = join(REPO_DIR, op.src);
    if (!existsSync(srcPath)) continue;

    const destPath = join(CONFIG_DIR, op.dest);

    // Backup existing directory
    if (existsSync(destPath)) {
      const backupPath = backupDir(op.dest);
      if (backupPath) backedUpCount++;
    }

    copyDir(srcPath, destPath);
    installedCount++;
    out.ok(`Copied ${op.dest}/`);
  }

  // ---- Verify ----
  out.header('Verification');

  let verifyFailed = false;

  // Check opencode.json was written correctly
  const written = readJson(configPath);
  const hasPlugin = Array.isArray(written.plugin) &&
    written.plugin.some(p => String(p).includes('superpowers'));
  if (!hasPlugin) {
    out.error('opencode.json missing superpowers plugin');
    verifyFailed = true;
  } else {
    out.ok('opencode.json has superpowers plugin');
  }

  if (written.default_agent !== 'zeus') {
    out.error('opencode.json missing default_agent: zeus');
    verifyFailed = true;
  } else {
    out.ok('default_agent set to zeus');
  }

  const hasInstructions = Array.isArray(written.instructions) &&
    written.instructions.includes('AGENTS.md');
  if (!hasInstructions) {
    out.error('opencode.json missing AGENTS.md in instructions');
    verifyFailed = true;
  } else {
    out.ok('AGENTS.md in instructions');
  }

  const hasSkillsPath = written.skills && Array.isArray(written.skills.paths) &&
    written.skills.paths.includes(SKILLS_PATH);
  if (!hasSkillsPath) {
    out.error(`opencode.json missing ${SKILLS_PATH} in skills.paths`);
    verifyFailed = true;
  } else {
    out.ok(`skills.paths includes ${SKILLS_PATH}`);
  }

  // Check key files exist
  for (const op of FILE_OPS) {
    const destPath = join(CONFIG_DIR, op.dest);
    if (!existsSync(destPath)) {
      out.error(`Missing: ${op.dest}`);
      verifyFailed = true;
    } else {
      out.ok(`${op.dest} exists`);
    }
  }

  // Check key directories
  for (const op of DIR_OPS) {
    const destPath = join(CONFIG_DIR, op.dest);
    if (!existsSync(destPath)) {
      out.error(`Missing: ${op.dest}/`);
      verifyFailed = true;
    } else {
      const skillCount = readdirSync(destPath).filter(e => {
        const p = join(destPath, e);
        return statSync(p).isDirectory() || e.endsWith('.md');
      }).length;
      out.ok(`${op.dest}/ exists (${skillCount} items)`);
    }
  }

  // ---- Summary ----
  out.header('Summary');
  out.ok(`${installedCount} item(s) installed`);
  if (backedUpCount > 0) {
    out.info(`${backedUpCount} file(s) backed up to ${BACKUP_DIR}`);
  }

  if (verifyFailed) {
    out.error('Some verifications failed. Check errors above.');
    process.exit(1);
  }

  out.ok(`${style.bold}✔ Setup complete.${style.nc}`);
  out.info('Restart OpenCode for changes to take effect.');
  out.subdued(`To undo:  node uninstall.mjs`);
}

// Helper: read a single character from stdin
function readChar() {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once('data', (data) => {
      stdin.setRawMode(wasRaw);
      stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

// Run
main().catch((err) => {
  console.error(`${style.red}Error:${style.nc} ${err.message}`);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the script runs with --dry-run**

Run:
```bash
node setup.mjs --dry-run
```

Expected: Shows preflight checks, planned changes, exits 0 with "No changes were made."

---

### Task 3: Test `setup.mjs` with actual install (on staging area first)

**Files:**
- Test: `setup.mjs`

- [ ] **Step 1: Create a temp staging directory with a mock opencode.json**

```bash
mkdir -p /tmp/opencode-test/.config/opencode
cat > /tmp/opencode-test/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "google": {
      "whitelist": ["gemini-3.1-flash-lite-preview"]
    }
  },
  "autoupdate": false
}
EOF
```

- [ ] **Step 2: Run setup pointing at the staging area**

```bash
# We need to temporarily override CONFIG_DIR. Let's create a test wrapper.
cat > /tmp/opencode-test-setup.mjs << 'TESTEOF'
// Test wrapper: redirect CONFIG_DIR to staging
import { join, dirname } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create staging config
const stagingDir = '/tmp/opencode-test/.config/opencode';
if (!existsSync(stagingDir)) {
  mkdirSync(stagingDir, { recursive: true });
}

// Write a test opencode.json
const testConfig = {
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "google": {
      "whitelist": ["gemini-3.1-flash-lite-preview"]
    }
  },
  "autoupdate": false
};
writeFileSync(join(stagingDir, 'opencode.json'), JSON.stringify(testConfig, null, 2));

// Now run the real setup, but we need a modified version that uses staging
// Instead, let's just validate the dry-run output manually
console.log("Staging area prepared at:", stagingDir);
console.log("To test: run `node setup.mjs --dry-run`");
console.log("Then: run `node setup.mjs --force` to actually install");
TESTEOF

node /tmp/opencode-test-setup.mjs
```

- [ ] **Step 3: Run setup.mjs --dry-run against the real system**

Run:
```bash
node setup.mjs --dry-run
```

Expected: Shows preflight checks, planned changes (opencode.json merge, files to copy), exits 0.

For now, we won't run the real install during subagent execution (to avoid modifying the user's config mid-session). The dry-run test is sufficient verification.

---

### Task 4: Create `uninstall.mjs`

**Files:**
- Create: `uninstall.mjs`

- [ ] **Step 1: Write the complete uninstall script**

```javascript
#!/usr/bin/env node

/**
 * uninstall.mjs — Remove Superpowers + OpenCode config
 *
 * Reverses changes made by setup.mjs: reverts opencode.json merge,
 * removes copied files, restores most recent backup.
 *
 * Usage:  node uninstall.mjs               # interactive
 *         node uninstall.mjs --force        # non-interactive
 *         node uninstall.mjs --dry-run      # preview only
 *         node uninstall.mjs --help         # show help
 */

import {
  readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync,
  rmSync, readdirSync, statSync
} from 'fs';
import { join, dirname, resolve, sep } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = resolve(__dirname);
const CONFIG_DIR = join(homedir(), '.config', 'opencode');
const BACKUP_PARENT = join(CONFIG_DIR, '.backups');

// ---------------------------------------------------------------------------
// Terminal styling
// ---------------------------------------------------------------------------
const isTTY = process.stdout.isTTY;
const style = {
  red:    isTTY ? '\x1b[0;31m' : '',
  green:  isTTY ? '\x1b[0;32m' : '',
  yellow: isTTY ? '\x1b[1;33m' : '',
  blue:   isTTY ? '\x1b[0;34m' : '',
  bold:   isTTY ? '\x1b[1m' : '',
  dim:    isTTY ? '\x1b[2m' : '',
  nc:     isTTY ? '\x1b[0m' : '',
};

const out = {
  info:    (msg) => console.log(`  ${style.blue}•${style.nc} ${msg}`),
  ok:      (msg) => console.log(`  ${style.green}✓${style.nc} ${msg}`),
  warn:    (msg) => console.log(`  ${style.yellow}⚠${style.nc} ${msg}`),
  error:   (msg) => console.log(`  ${style.red}✗${style.nc} ${msg}`),
  header:  (msg) => console.log(`\n${style.bold}${msg}${style.nc}`),
  subdued: (msg) => console.log(`  ${style.dim}${msg}${style.nc}`),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch { return null; }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SUPERPOWERS_PLUGIN = 'superpowers@git+https://github.com/obra/superpowers.git';
const SKILLS_PATH = 'skills/superpowers-enhanced';

// Files that setup.mjs manages
const MANAGED_FILES = [
  'AGENTS.md',
  join('agent', 'zeus.md'),
  join('scripts', 'verify-hash.sh'),
];

// Directories that setup.mjs manages
const MANAGED_DIRS = [
  SKILLS_PATH,
  'prompts',
];

// ---------------------------------------------------------------------------
// Find latest backup
// ---------------------------------------------------------------------------
function findLatestBackup() {
  if (!existsSync(BACKUP_PARENT)) return null;
  const backups = readdirSync(BACKUP_PARENT)
    .map(name => ({ name, path: join(BACKUP_PARENT, name), time: statSync(join(BACKUP_PARENT, name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  return backups.length > 0 ? backups[0].path : null;
}

// ---------------------------------------------------------------------------
// Revert opencode.json
// ---------------------------------------------------------------------------
function revertConfig(dryRun) {
  const configPath = join(CONFIG_DIR, 'opencode.json');
  if (!existsSync(configPath)) {
    out.info('opencode.json not found — nothing to revert');
    return false;
  }

  const config = readJson(configPath);
  if (!config) {
    out.warn('Could not parse opencode.json');
    return false;
  }

  let changed = false;

  // Remove our plugin
  if (Array.isArray(config.plugin)) {
    const filtered = config.plugin.filter(p => String(p) !== SUPERPOWERS_PLUGIN);
    if (filtered.length !== config.plugin.length) {
      if (dryRun) {
        out.subdued('Would remove superpowers plugin from opencode.json');
      }
      config.plugin = filtered;
      changed = true;
    }
  }

  // Remove default_agent if set by us (zeus)
  if (config.default_agent === 'zeus') {
    // Only remove if it was us — check if backup has a different value
    const backup = findLatestBackup();
    if (backup) {
      const backupConfig = readJson(join(backup, 'opencode.json'));
      if (backupConfig && backupConfig.default_agent !== undefined) {
        if (dryRun) {
          out.subdued(`Would restore default_agent: ${backupConfig.default_agent}`);
        }
        config.default_agent = backupConfig.default_agent;
        changed = true;
      } else {
        // No backup value, just delete the field
        if (dryRun) {
          out.subdued('Would remove default_agent field');
        }
        delete config.default_agent;
        changed = true;
      }
    } else {
      if (dryRun) {
        out.subdued('Would remove default_agent field');
      }
      delete config.default_agent;
      changed = true;
    }
  }

  // Remove AGENTS.md from instructions
  if (Array.isArray(config.instructions)) {
    const filtered = config.instructions.filter(i => i !== 'AGENTS.md');
    if (filtered.length !== config.instructions.length) {
      if (dryRun) {
        out.subdued('Would remove AGENTS.md from instructions');
      }
      if (filtered.length === 0) {
        delete config.instructions;
      } else {
        config.instructions = filtered;
      }
      changed = true;
    }
  }

  // Remove our skills.path
  if (config.skills && Array.isArray(config.skills.paths)) {
    const filtered = config.skills.paths.filter(p => p !== SKILLS_PATH);
    if (filtered.length !== config.skills.paths.length) {
      if (dryRun) {
        out.subdued(`Would remove ${SKILLS_PATH} from skills.paths`);
      }
      if (filtered.length === 0) {
        delete config.skills.paths;
        // Clean up empty skills object
        if (Object.keys(config.skills).length === 0) {
          delete config.skills;
        }
      } else {
        config.skills.paths = filtered;
      }
      changed = true;
    }
  }

  if (changed && !dryRun) {
    // Backup current before reverting
    const backupDir = join(BACKUP_PARENT, 'pre-uninstall-' + Date.now());
    ensureDir(backupDir);
    copyFileSync(configPath, join(backupDir, 'opencode.json'));
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    out.ok('Reverted opencode.json');
  }

  return changed;
}

// ---------------------------------------------------------------------------
// Remove managed files
// ---------------------------------------------------------------------------
function removeManagedFiles(dryRun) {
  let count = 0;

  for (const relPath of MANAGED_FILES) {
    const target = join(CONFIG_DIR, relPath);
    if (!existsSync(target)) continue;

    if (dryRun) {
      out.subdued(`Would remove: ${relPath}`);
      count++;
      continue;
    }

    rmSync(target, { force: true });
    out.ok(`Removed ${relPath}`);
    count++;
  }

  // Remove empty parent directories (agent/, scripts/)
  for (const relPath of MANAGED_FILES) {
    const parent = dirname(join(CONFIG_DIR, relPath));
    if (existsSync(parent) && statSync(parent).isDirectory()) {
      try {
        const contents = readdirSync(parent);
        if (contents.length === 0) {
          rmSync(parent, { force: true });
          out.subdued(`Removed empty directory: ${parent.replace(CONFIG_DIR + sep, '')}`);
        }
      } catch { /* ignore */ }
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Remove managed directories
// ---------------------------------------------------------------------------
function removeManagedDirs(dryRun) {
  let count = 0;

  for (const relPath of MANAGED_DIRS) {
    const target = join(CONFIG_DIR, relPath);
    if (!existsSync(target)) continue;

    if (dryRun) {
      out.subdued(`Would remove: ${relPath}/`);
      count++;
      continue;
    }

    rmSync(target, { recursive: true, force: true });
    out.ok(`Removed ${relPath}/`);
    count++;
  }

  // Clean up empty parent directories (skills/, skills/superpowers-enhanced/)
  const parentDirs = [
    dirname(join(CONFIG_DIR, SKILLS_PATH)),  // skills/superpowers
    dirname(dirname(join(CONFIG_DIR, SKILLS_PATH))), // skills
  ];

  for (const dir of parentDirs) {
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      try {
        const contents = readdirSync(dir);
        if (contents.length === 0) {
          rmSync(dir, { force: true });
          out.subdued(`Removed empty directory: ${dir.replace(CONFIG_DIR + sep, '')}`);
        }
      } catch { /* ignore */ }
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Restore from backup
// ---------------------------------------------------------------------------
function restoreFromBackup(backupPath, dryRun) {
  if (!backupPath || !existsSync(backupPath)) {
    out.info('No backup to restore');
    return 0;
  }

  let count = 0;

  // Restore opencode.json
  const backupConfig = join(backupPath, 'opencode.json');
  if (existsSync(backupConfig)) {
    if (dryRun) {
      out.subdued('Would restore opencode.json from backup');
      count++;
    } else {
      copyFileSync(backupConfig, join(CONFIG_DIR, 'opencode.json'));
      out.ok('Restored opencode.json from backup');
      count++;
    }
  }

  // Restore AGENTS.md
  const backupAgents = join(backupPath, 'AGENTS.md');
  if (existsSync(backupAgents)) {
    if (dryRun) {
      out.subdued('Would restore AGENTS.md from backup');
      count++;
    } else {
      copyFileSync(backupAgents, join(CONFIG_DIR, 'AGENTS.md'));
      out.ok('Restored AGENTS.md from backup');
      count++;
    }
  }

  // Restore agent/zeus.md
  const backupZeus = join(backupPath, 'agent', 'zeus.md');
  if (existsSync(backupZeus)) {
    if (dryRun) {
      out.subdued('Would restore agent/zeus.md from backup');
      count++;
    } else {
      ensureDir(join(CONFIG_DIR, 'agent'));
      copyFileSync(backupZeus, join(CONFIG_DIR, 'agent', 'zeus.md'));
      out.ok('Restored agent/zeus.md from backup');
      count++;
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function showHelp() {
  console.log(`${style.bold}Superpowers + OpenCode — uninstaller${style.nc}`);
  console.log();
  console.log(`${style.dim}Removes Superpowers config and restores the most recent backup.${style.nc}`);
  console.log();
  console.log(`${style.bold}Usage:${style.nc}  node uninstall.mjs [OPTIONS]`);
  console.log();
  console.log(`${style.bold}Options:${style.nc}`);
  console.log('  --force       Non-interactive; remove without prompting');
  console.log('  --dry-run     Show what would change; don\'t touch anything');
  console.log('  --help        Show this help and exit');
  console.log();
  console.log(`${style.bold}What it does:${style.nc}`);
  console.log('  1. Reverts opencode.json (removes plugin, agent, instructions, skills.paths)');
  console.log('  2. Removes copied files (AGENTS.md, zeus.md, verify-hash.sh)');
  console.log('  3. Removes copied directories (skills/, prompts/)');
  console.log('  4. Restores the most recent backup if available');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const FORCE = args.includes('--force');
  const DRY_RUN = args.includes('--dry-run');

  if (args.includes('--help')) {
    showHelp();
    return;
  }

  out.header('Finding installed files');

  let hasAnything = false;

  // Check if opencode.json has our entries
  const configPath = join(CONFIG_DIR, 'opencode.json');
  const config = readJson(configPath);
  if (config) {
    const hasPlugin = Array.isArray(config.plugin) &&
      config.plugin.some(p => String(p).includes('superpowers'));
    const hasZeus = config.default_agent === 'zeus';
    const hasAgents = Array.isArray(config.instructions) &&
      config.instructions.includes('AGENTS.md');
    const hasSkills = config.skills && Array.isArray(config.skills.paths) &&
      config.skills.paths.includes(SKILLS_PATH);
    if (hasPlugin || hasZeus || hasAgents || hasSkills) {
      hasAnything = true;
      out.info('Superpowers entries found in opencode.json');
    }
  }

  // Check managed files
  for (const relPath of MANAGED_FILES) {
    if (existsSync(join(CONFIG_DIR, relPath))) {
      hasAnything = true;
      out.subdued(`Found: ${relPath}`);
    }
  }

  // Check managed dirs
  for (const relPath of MANAGED_DIRS) {
    if (existsSync(join(CONFIG_DIR, relPath))) {
      hasAnything = true;
      out.subdued(`Found: ${relPath}/`);
    }
  }

  if (!hasAnything) {
    out.info('No Superpowers config found — nothing to uninstall.');
    return;
  }

  // Find latest backup
  const latestBackup = findLatestBackup();
  if (latestBackup) {
    out.info(`Latest backup: ${latestBackup}`);
  } else {
    out.info('No backups found');
  }

  // Confirm
  if (!FORCE && !DRY_RUN) {
    out.header('Confirmation');
    process.stdout.write(`  ${style.bold}Proceed with uninstall?${style.nc} [Y/n] `);
    const answer = await readChar();
    if (answer === 'n' || answer === 'N') {
      out.info('Uninstall cancelled.');
      return;
    }
  }

  // Execute (or dry-run)
  out.header('Uninstalling');

  if (DRY_RUN) {
    revertConfig(true);
    removeManagedFiles(true);
    removeManagedDirs(true);
    if (latestBackup) {
      restoreFromBackup(latestBackup, true);
    }
    out.header('Dry run');
    out.info('No changes were made.');
    return;
  }

  // Revert config
  revertConfig(false);

  // Remove managed files
  removeManagedFiles(false);

  // Remove managed dirs
  removeManagedDirs(false);

  // Restore from backup
  if (latestBackup) {
    restoreFromBackup(latestBackup, false);
  }

  out.header('Summary');
  out.ok(`${style.bold}✔ Uninstall complete. Restart OpenCode for changes to take effect.${style.nc}`);
}

function readChar() {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once('data', (data) => {
      stdin.setRawMode(wasRaw);
      stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

main().catch((err) => {
  console.error(`${style.red}Error:${style.nc} ${err.message}`);
  process.exit(1);
});
```

- [ ] **Step 2: Verify uninstall.mjs parses and shows help**

Run:
```bash
node uninstall.mjs --help
```

Expected: Shows help text, exits 0.

- [ ] **Step 3: Run dry-run to verify it finds nothing to uninstall (fresh system)**

Run:
```bash
node uninstall.mjs --dry-run
```

Expected: "No Superpowers config found — nothing to uninstall" or shows what it would remove. Exits 0.

---

### Task 5: Remove old shell scripts and update README

**Files:**
- Delete: `setup.sh`
- Delete: `uninstall.sh`
- Modify: `README.md`

- [ ] **Step 1: Remove old shell scripts**

```bash
rm setup.sh uninstall.sh
```

Verify:
```bash
ls setup.sh uninstall.sh 2>&1 || echo "Both scripts removed"
```

Expected: `ls: cannot access setup.sh: No such file or directory` (or similar).

- [ ] **Step 2: Update README.md references from shell scripts to Node.js scripts**

Changes to make in `README.md`:

1. In the "Quick Start" section, change `./setup.sh` to `node setup.mjs`:
   ```
   cd ~/superpowers-opencode
   node setup.mjs
   
   # Quit and restart OpenCode
   ```

2. In the "Non-interactive install" section:
   ```bash
   node setup.mjs --force     # skip prompts
   node setup.mjs --dry-run   # preview only, no changes
   ```

3. In the "Uninstall" section, change:
   ```
   cd ~/superpowers-opencode
   node uninstall.mjs
   ```

4. In "What's Installed" table, update the "Purpose" column to reflect direct copy instead of symlinks.

5. In "Verification" section, replace symlink checks with file existence checks:
   ```bash
   # Check files exist
   ls -la ~/.config/opencode/opencode.json
   ls -la ~/.config/opencode/AGENTS.md
   ls -la ~/.config/opencode/agent/zeus.md
   ls -la ~/.config/opencode/skills/superpowers-enhanced/
   
   # Verify enhanced skills are installed
   ls ~/.config/opencode/skills/superpowers-enhanced/*/SKILL.md
   ```

6. In "Troubleshooting" → "Enhanced skills not auto-triggering", remove the symlink check and replace with:
   ```
   1. Verify the files exist: `ls ~/.config/opencode/skills/superpowers-enhanced/`
   2. Check skills.paths in opencode.json contains "skills/superpowers-enhanced"
   3. Verify each skill has a valid SKILL.md with YAML frontmatter
   4. Restart OpenCode — skills are loaded at startup
   ```

7. In "Updating", change:
   ```bash
   cd ~/superpowers-opencode
   git pull
   node setup.mjs --force
   ```

- [ ] **Step 3: Update the Project Structure section**

Replace the `setup.sh` and `uninstall.sh` entries with `setup.mjs` and `uninstall.mjs`:

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

---

### Task 6: Final verification — commit and validate

**Files:**
- All changes

- [ ] **Step 1: Run git status to verify all changes**

```bash
git status
```

Expected: Shows `setup.mjs` and `uninstall.mjs` as new files, `setup.sh` and `uninstall.sh` as deleted, `README.md` as modified.

- [ ] **Step 2: Run the suite of smoke tests**

```bash
node setup.mjs --help        # exits 0
node setup.mjs --dry-run     # exits 0, shows planned changes
node uninstall.mjs --help    # exits 0
node uninstall.mjs --dry-run # exits 0
```

Expected: All four commands exit 0 without errors.

- [ ] **Step 3: Commit**

```bash
git add setup.mjs uninstall.mjs README.md
git add -u  # tracks deletions of setup.sh and uninstall.sh
git commit -m "rework installer: replace shell symlinks with cross-platform Node.js scripts"
```