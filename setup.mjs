#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, chmodSync, lstatSync, unlinkSync } from 'fs';
import { join, dirname, sep } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPO_DIR = __dirname;
const CONFIG_DIR = join(homedir(), '.config', 'opencode');
const CONFIG_JSON_PATH = join(CONFIG_DIR, 'opencode.json');

const SUPERPOWERS_PLUGIN = 'superpowers@git+https://github.com/obra/superpowers.git';
const SKILLS_PATH = 'skills/superpowers-enhanced';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const useColor = process.stdout.isTTY;

function c(code, str) {
  return useColor ? `${code}${str}${RESET}` : str;
}

function outInfo(msg) { console.log(`  ${c(BLUE, '\u2022')} ${msg}`); }
function outOk(msg) { console.log(`  ${c(GREEN, '\u2713')} ${msg}`); }
function outWarn(msg) { console.log(`  ${c(YELLOW, '\u26A0')} ${msg}`); }
function outError(msg) { console.log(`  ${c(RED, '\u2717')} ${msg}`); }
function outHeader(msg) { console.log(`\n${c(BOLD, msg)}`); }
function outSubdued(msg) { console.log(`  ${c(DIM, msg)}`); }

let backupDir = null;
let forceMode = false;
let dryRunMode = false;

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function showHelp() {
  console.log(`${c(BOLD, 'Superpowers Enhanced \u2014 config installer')}\n`);
  console.log(`${c(DIM, 'Installs a Superpowers-optimized OpenCode configuration.')}\n`);
  console.log(`${c(BOLD, 'Usage:')}  node setup.mjs [OPTIONS]\n`);
  console.log(`${c(BOLD, 'Options:')}`);
  console.log('  --force       Non-interactive; overwrite without prompting');
  console.log('  --dry-run     Show what would change; don\'t touch anything');
  console.log('  --help        Show this help and exit\n');
  console.log(`${c(BOLD, 'What it does:')}`);
  console.log('  1. Validates that OpenCode is installed');
  console.log('  2. Merges opencode.json config (plugin, default_agent, instructions, skills.paths,\n     autoupdate)');
  console.log('  3. Shows planned changes before applying');
  console.log('  4. Backs up existing files to ~/.config/opencode/.backups/<timestamp>/');
  console.log('  5. Copies repo files into ~/.config/opencode/');
  console.log('  6. Copies enhanced skills (asi-loop, deliberation-gate, security-triage, social-accountability)');
  process.exit(0);
}

function parseArgs() {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg === '--help') showHelp();
    else if (arg === '--force') forceMode = true;
    else if (arg === '--dry-run') dryRunMode = true;
    else {
      console.error(`${c(RED, 'Unknown option:')} ${arg}`);
      showHelp();
    }
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function gitAvailable() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getGitDiff(fileA, fileB) {
  try {
    const result = execSync(`git --no-pager diff --no-color --no-index "${fileA}" "${fileB}" 2>/dev/null | tail -n +5`, { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    if (e.stdout) return e.stdout.trim();
    return '';
  }
}

function ensureBackupDir() {
  if (!backupDir) {
    backupDir = join(CONFIG_DIR, '.backups', timestamp());
    mkdirSync(backupDir, { recursive: true });
  }
}

function backupFile(configRelPath) {
  const src = join(CONFIG_DIR, configRelPath);
  if (!existsSync(src)) return null;
  ensureBackupDir();
  const dest = join(backupDir, configRelPath);
  const destDir = dirname(dest);
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  return dest;
}

function backupDirContent(configRelPath) {
  const src = join(CONFIG_DIR, configRelPath);
  if (!existsSync(src)) return;
  ensureBackupDir();
  const dest = join(backupDir, configRelPath);
  copyDirRecursive(src, dest, {});
}

function copyDirRecursive(src, dest, { dryRun = false } = {}) {
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      if (!dryRun) {
        if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath, { dryRun });
    } else {
      if (!dryRun) {
        if (!existsSync(dirname(destPath))) mkdirSync(dirname(destPath), { recursive: true });
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

function copyFile(src, dest, { executable = false, dryRun = false } = {}) {
  if (!existsSync(src)) {
    outWarn(`Source not found: ${src}`);
    return false;
  }
  if (!existsSync(dirname(dest))) {
    if (!dryRun) mkdirSync(dirname(dest), { recursive: true });
  }
  if (!dryRun) {
    // If dest is a symlink (e.g. from a previous install method),
    // remove it first so copyFileSync creates a regular file instead
    // of writing through the symlink to a stale target.
    try {
      if (lstatSync(dest).isSymbolicLink()) {
        unlinkSync(dest);
        outSubdued(`Replaced symlink with regular file: ${dest.replace(CONFIG_DIR + sep, '')}`);
      }
    } catch {
      // lstatSync throws on ENOENT — dest doesn't exist, that's fine
    }
    copyFileSync(src, dest);
    if (executable && process.platform !== 'win32') {
      chmodSync(dest, 0o755);
    }
  }
  return true;
}

function copyDir(src, dest, { dryRun = false } = {}) {
  if (!existsSync(src)) {
    outWarn(`Source directory not found: ${src}`);
    return false;
  }
  if (!existsSync(dest)) {
    if (!dryRun) mkdirSync(dest, { recursive: true });
  }
  copyDirRecursive(src, dest, { dryRun });
  return true;
}

function checkNodeVersion() {
  const match = process.version.match(/^v(\d+)\./);
  if (!match) {
    outWarn('Could not detect Node.js version');
    return;
  }
  const major = parseInt(match[1], 10);
  if (major < 18) {
    outError(`Node.js ${process.version} is too old. Version 18+ is required.`);
    outInfo('Install Node.js 18+ from https://nodejs.org/ and try again.');
    process.exit(1);
  }
  outOk(`Node.js ${process.version} (>=18)`);
}

function preflight() {
  outHeader('Prerequisites');

  checkNodeVersion();

  if (!existsSync(CONFIG_JSON_PATH)) {
    outWarn(`OpenCode config not found at ${CONFIG_JSON_PATH}`);
    outInfo('Creating config directory and default opencode.json...');
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeJson(CONFIG_JSON_PATH, {});
    outOk(`Created ${CONFIG_JSON_PATH}`);
  } else {
    outOk('OpenCode config found at ' + CONFIG_DIR);
  }

  if (existsSync(CONFIG_JSON_PATH)) {
    const config = readJson(CONFIG_JSON_PATH);
    if (config) {
      const plugins = config.plugin || [];
      if (plugins.some(p => p.includes('superpowers'))) {
        outOk('Superpowers plugin declared in opencode.json');
      } else {
        outWarn('Superpowers plugin not found in opencode.json plugin array');
        outSubdued('Will be added during installation.');
      }
    }
  }

  if (gitAvailable()) {
    outOk('git is available');
  } else {
    outWarn('git not found \u2014 diff display will be limited');
  }

  checkSymlinks();
}

function checkSymlinks() {
  for (const fc of FILE_COPIES) {
    const configRel = fc.configRel;
    const dest = join(CONFIG_DIR, configRel);
    try {
      if (lstatSync(dest).isSymbolicLink()) {
        outWarn(`Symlink detected: ${configRel} will be replaced with a regular file`);
      }
    } catch {
      // dest doesn't exist — no problem
    }
  }
}

function planJsonMerge(existingConfig) {
  const changes = [];

  const plugins = existingConfig.plugin || [];
  if (!plugins.some(p => p === SUPERPOWERS_PLUGIN)) {
    changes.push({ field: 'plugin', before: plugins, after: [...plugins, SUPERPOWERS_PLUGIN] });
  }

  if (existingConfig.default_agent !== 'zeus') {
    changes.push({ field: 'default_agent', before: existingConfig.default_agent, after: 'zeus' });
  }

  const instructions = existingConfig.instructions || [];
  const instrArray = Array.isArray(instructions) ? instructions : [instructions];
  if (!instrArray.includes('AGENTS.md')) {
    changes.push({ field: 'instructions', before: instructions, after: [...instrArray, 'AGENTS.md'] });
  }

  const skillsPaths = existingConfig.skills?.paths || [];
  if (!skillsPaths.includes(SKILLS_PATH)) {
    const beforePaths = existingConfig.skills?.paths ? [...existingConfig.skills.paths] : [];
    const afterPaths = [...skillsPaths, SKILLS_PATH];
    changes.push({ field: 'skills.paths', before: beforePaths, after: afterPaths });
  }

  if (existingConfig.autoupdate !== false) {
    changes.push({ field: 'autoupdate', before: existingConfig.autoupdate, after: false });
  }

  return changes;
}

const FILE_COPIES = [
  { repoRel: 'AGENTS.md', configRel: 'AGENTS.md', executable: false },
  { repoRel: 'agent/zeus.md', configRel: 'agent/zeus.md', executable: false },
  { repoRel: 'scripts/verify-hash.sh', configRel: 'scripts/verify-hash.sh', executable: true },
];

const DIR_COPIES = [
  { repoRel: 'skills', configRel: SKILLS_PATH },
  { repoRel: 'prompts', configRel: 'prompts' },
];

function planFileChanges() {
  const changes = [];
  for (const fc of FILE_COPIES) {
    const src = join(REPO_DIR, fc.repoRel);
    const dest = join(CONFIG_DIR, fc.configRel);
    if (!existsSync(src)) continue;
    const exists = existsSync(dest);
    changes.push({ type: 'file', configRel: fc.configRel, src, dest, executable: fc.executable, exists });
  }
  return changes;
}

function planDirChanges() {
  const changes = [];
  for (const dc of DIR_COPIES) {
    const src = join(REPO_DIR, dc.repoRel);
    const dest = join(CONFIG_DIR, dc.configRel);
    if (!existsSync(src)) continue;
    const exists = existsSync(dest);
    changes.push({ type: 'dir', configRel: dc.configRel, src, dest, exists });
  }
  return changes;
}

function displayPlannedChanges(configChanges, fileChanges, dirChanges) {
  outHeader('Planned changes');

  outHeader('  opencode.json:');
  if (configChanges.length === 0) {
    outSubdued('  (no changes needed)');
  } else {
    for (const change of configChanges) {
      console.log(`\n    ${c(BOLD, change.field)}:`);
      outSubdued(`    before: ${JSON.stringify(change.before)}`);
      outSubdued(`    after:  ${JSON.stringify(change.after)}`);
    }
  }

  const hasFileDiffs = fileChanges.some(fc => fc.exists) || dirChanges.some(dc => dc.exists);
  if (hasFileDiffs && gitAvailable()) {
    outHeader('  File diffs:');
    for (const fc of fileChanges) {
      if (!fc.exists) continue;
      const configPath = join(CONFIG_DIR, fc.configRel);
      const repoPath = fc.src;
      const diff = getGitDiff(configPath, repoPath);
      if (diff) {
        console.log(`\n    ${c(DIM, fc.configRel)}:`);
        console.log(diff.split('\n').map(line => `    ${line}`).join('\n'));
      } else {
        outSubdued(`    ${fc.configRel}: no differences`);
      }
    }
  }

  if (fileChanges.length > 0) {
    outHeader('  Files to copy:');
    for (const fc of fileChanges) {
      const verb = fc.exists ? 'Overwrite' : 'Copy';
      outInfo(`${verb} ${fc.configRel}`);
    }
  }

  if (dirChanges.length > 0) {
    outHeader('  Directories to sync:');
    for (const dc of dirChanges) {
      const verb = dc.exists ? 'Merge into' : 'Create';
      outInfo(`${verb} ${dc.configRel}/`);
    }
  }
}

async function confirm() {
  if (forceMode) return true;
  return new Promise((resolve) => {
    const { stdin } = process;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
      process.stdout.write(`  ${c(BOLD, 'Proceed with installation?')} [Y/n] `);
      stdin.once('data', (buf) => {
        stdin.setRawMode(false);
        stdin.pause();
        console.log('');
        const char = buf.toString().trim().toLowerCase();
        resolve(char !== 'n' && char !== 'no');
      });
    } else {
      resolve(true);
    }
  });
}

function installConfig(configChanges) {
  if (configChanges.length === 0) return;
  const config = readJson(CONFIG_JSON_PATH);
  if (!config) {
    outError('Could not read opencode.json for merge');
    return;
  }

  for (const change of configChanges) {
    switch (change.field) {
      case 'plugin':
        config.plugin = change.after;
        break;
      case 'default_agent':
        config.default_agent = change.after;
        break;
      case 'instructions':
        config.instructions = change.after;
        break;
      case 'skills.paths':
        if (!config.skills) config.skills = {};
        config.skills.paths = change.after;
        break;
      case 'autoupdate':
        config.autoupdate = change.after;
        break;
    }
  }

  writeJson(CONFIG_JSON_PATH, config);
  outOk('Updated opencode.json');
}

function installFiles(fileChanges, dirChanges) {
  for (const fc of fileChanges) {
    backupFile(fc.configRel);
    const success = copyFile(fc.src, join(CONFIG_DIR, fc.configRel), { executable: fc.executable, dryRun: dryRunMode });
    if (success) {
      outOk(`Copied ${fc.configRel}`);
    }
  }

  for (const dc of dirChanges) {
    backupDirContent(dc.configRel);
    const success = copyDir(dc.src, join(CONFIG_DIR, dc.configRel), { dryRun: dryRunMode });
    if (success) {
      outOk(`Synced ${dc.configRel}/`);
    }
  }
}

function verify() {
  outHeader('Verification');

  let verifyFailed = false;

  const config = readJson(CONFIG_JSON_PATH);
  if (!config) {
    outError('Could not read opencode.json for verification');
    verifyFailed = true;
  } else {
    const plugins = config.plugin || [];
    if (plugins.some(p => p === SUPERPOWERS_PLUGIN)) {
      outOk('opencode.json has superpowers plugin');
    } else {
      outError('opencode.json missing superpowers plugin');
      verifyFailed = true;
    }

    if (config.default_agent === 'zeus') {
      outOk('default_agent is zeus');
    } else {
      outError(`default_agent is '${config.default_agent}', expected 'zeus'`);
      verifyFailed = true;
    }

    const instructions = config.instructions || [];
    const instrArray = Array.isArray(instructions) ? instructions : [instructions];
    if (instrArray.includes('AGENTS.md')) {
      outOk('AGENTS.md in instructions');
    } else {
      outError('AGENTS.md missing from instructions');
      verifyFailed = true;
    }

    const skillsPaths = config.skills?.paths || [];
    if (skillsPaths.includes(SKILLS_PATH)) {
      outOk('skills.paths includes skills/superpowers-enhanced');
    } else {
      outError('skills.paths missing skills/superpowers-enhanced');
      verifyFailed = true;
    }

    if (config.autoupdate === false) {
      outOk('autoupdate is false');
    } else {
      outWarn('autoupdate is not false — update may overwrite config');
    }
  }

  for (const fc of FILE_COPIES) {
    const dest = join(CONFIG_DIR, fc.configRel);
    if (existsSync(dest)) {
      outOk(`File exists: ${fc.configRel}`);
    } else {
      outError(`File missing: ${fc.configRel}`);
      verifyFailed = true;
    }
  }

  for (const dc of DIR_COPIES) {
    const dest = join(CONFIG_DIR, dc.configRel);
    if (existsSync(dest)) {
      outOk(`Directory exists: ${dc.configRel}/`);
    } else {
      outWarn(`Directory missing: ${dc.configRel}/`);
    }
  }

  if (verifyFailed) {
    outError('Verification failed. Check errors above.');
    return false;
  }
  return true;
}

async function main() {
  parseArgs();

  console.log('');
  outHeader('Superpowers Enhanced \u2014 config installer');
  outSubdued(`Repo: ${REPO_DIR}`);
  outSubdued(`Config: ${CONFIG_DIR}\n`);

  preflight();

  const existingConfig = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  const configChanges = existingConfig ? planJsonMerge(existingConfig) : [];

  const fileChanges = planFileChanges();
  const dirChanges = planDirChanges();

  displayPlannedChanges(configChanges, fileChanges, dirChanges);

  if (dryRunMode) {
    console.log('');
    outInfo(`${c(BOLD, 'Dry run complete.')} No files were changed.`);
    process.exit(0);
  }

  if (!await confirm()) {
    console.log('');
    outInfo('Installation cancelled.');
    process.exit(0);
  }

  outHeader('Installing');

  installConfig(configChanges);
  installFiles(fileChanges, dirChanges);

  const verified = verify();

  if (backupDir) {
    outInfo(`Backups saved to ${backupDir}`);
  }

  console.log('');
  if (verified) {
    console.log(`  ${c(GREEN, c(BOLD, '\u2714 Setup complete.'))}`);
  } else {
    outWarn('Setup completed with verification warnings. Review errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c(RED, 'Error:'), err.stack || err.message);
  process.exit(1);
});
