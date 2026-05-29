#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  SKILLS_PATH, CONFIG_DIR, CONFIG_JSON_PATH,
  FILE_COPIES, DIR_COPIES
} from '../lib/constants.mjs';
import { createConsole } from '../lib/console.mjs';
import {
  readJson, writeJson, copyFileChecked, copyDirRecursive,
  backupFile, backupDirContent, ensureBackupDir, gitAvailable, getGitDiff
} from '../lib/fs-utils.mjs';
import { validateConfig } from '../lib/config-schema.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..');
const con = createConsole();
const { c, BOLD, DIM, RED, GREEN, YELLOW, BLUE, RESET } = con;

let forceMode = false;
let dryRunMode = false;
let backupDir = null;

function showHelp() {
  console.log(`${c(BOLD, 'opencode-zeus \u2014 config installer')}\n`);
  console.log(`${c(DIM, 'Installs a Zeus Elite-optimized OpenCode configuration.')}\n`);
  console.log(`${c(BOLD, 'Usage:')}  node bin/setup.mjs [OPTIONS]\n`);
  console.log(`${c(BOLD, 'Options:')}`);
  console.log('  --force       Non-interactive; overwrite without prompting');
  console.log('  --dry-run     Show what would change; don\'t touch anything');
  console.log('  --help        Show this help and exit\n');
  console.log(`${c(BOLD, 'What it does:')}`);
  console.log('  1. Validates that OpenCode is installed');
  console.log('  2. Merges opencode.json config');
  console.log('  3. Shows planned changes before applying');
  console.log('  4. Backs up existing files to ~/.config/opencode/.backups/<timestamp>/');
  console.log('  5. Copies repo files and skills into ~/.config/opencode/');
  console.log('  6. Installs git post-checkout hook for automatic context snapshots');
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

function checkNodeVersion() {
  const match = process.version.match(/^v(\d+)\./);
  if (!match) return con.outWarn('Could not detect Node.js version');
  const major = parseInt(match[1], 10);
  if (major < 18) {
    con.outError(`Node.js ${process.version} is too old. Version 18+ is required.`);
    process.exit(1);
  }
  con.outOk(`Node.js ${process.version} (>=18)`);
}

function preflight() {
  con.outHeader('Prerequisites');
  checkNodeVersion();

  if (!existsSync(CONFIG_JSON_PATH)) {
    con.outWarn(`OpenCode config not found at ${CONFIG_JSON_PATH}`);
    con.outInfo('Creating config directory and default opencode.json...');
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeJson(CONFIG_JSON_PATH, {});
    con.outOk(`Created ${CONFIG_JSON_PATH}`);
  } else {
    con.outOk('OpenCode config found at ' + CONFIG_DIR);
  }

  if (existsSync(CONFIG_JSON_PATH)) {
    const config = readJson(CONFIG_JSON_PATH);
    if (config) {
      const plugins = config.plugin || [];
      if (plugins.some(p => p.includes('superpowers'))) {
        con.outOk('Zeus Elite plugin declared in opencode.json');
      } else {
        con.outWarn('Zeus Elite plugin not found in opencode.json plugin array');
        con.outSubdued('Will be added during installation.');
      }
    }
  }

  if (gitAvailable()) con.outOk('git is available');
  else con.outWarn('git not found \u2014 diff display will be limited');

  for (const fc of FILE_COPIES) {
    const dest = join(CONFIG_DIR, fc.configRel);
    try {
      if (lstatSync(dest).isSymbolicLink()) {
        con.outWarn(`Symlink detected: ${fc.configRel} will be replaced with a regular file`);
      }
    } catch {}
  }
}

function planJsonMerge(existingConfig) {
  const changes = [];
  if (existingConfig.default_agent !== 'zeus') {
    changes.push({ field: 'default_agent', before: existingConfig.default_agent, after: 'zeus' });
  }
  const instructions = existingConfig.instructions || [];
  const instrArray = Array.isArray(instructions) ? instructions : [instructions];
  const requiredInstructions = ['AGENTS.md', 'LITE.md'];
  const missing = requiredInstructions.filter(i => !instrArray.includes(i));
  if (missing.length > 0) {
    changes.push({ field: 'instructions', before: instructions, after: [...instrArray, ...missing] });
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

function planFileChanges() {
  const changes = [];
  for (const fc of FILE_COPIES) {
    const src = join(REPO_DIR, fc.repoRel);
    const dest = join(CONFIG_DIR, fc.configRel);
    if (!existsSync(src)) continue;
    changes.push({ type: 'file', configRel: fc.configRel, src, dest, executable: fc.executable, exists: existsSync(dest) });
  }
  return changes;
}

function planDirChanges() {
  const changes = [];
  for (const dc of DIR_COPIES) {
    const src = join(REPO_DIR, dc.repoRel);
    const dest = join(CONFIG_DIR, dc.configRel);
    if (!existsSync(src)) continue;
    changes.push({ type: 'dir', configRel: dc.configRel, src, dest, exists: existsSync(dest) });
  }
  return changes;
}

function displayPlannedChanges(configChanges, fileChanges, dirChanges) {
  con.outHeader('Planned changes');
  con.outHeader('  opencode.json:');
  if (configChanges.length === 0) con.outSubdued('  (no changes needed)');
  else {
    for (const change of configChanges) {
      console.log(`\n    ${c(BOLD, change.field)}:`);
      con.outSubdued(`    before: ${JSON.stringify(change.before)}`);
      con.outSubdued(`    after:  ${JSON.stringify(change.after)}`);
    }
  }

  const hasFileDiffs = fileChanges.some(fc => fc.exists) || dirChanges.some(dc => dc.exists);
  if (hasFileDiffs && gitAvailable()) {
    con.outHeader('  File diffs:');
    for (const fc of fileChanges) {
      if (!fc.exists) continue;
      const diff = getGitDiff(fc.dest, fc.src);
      if (diff) {
        console.log(`\n    ${c(DIM, fc.configRel)}:`);
        console.log(diff.split('\n').map(line => `    ${line}`).join('\n'));
      } else {
        con.outSubdued(`    ${fc.configRel}: no differences`);
      }
    }
  }

  if (fileChanges.length > 0) {
    con.outHeader('  Files to copy:');
    for (const fc of fileChanges) con.outInfo(`${fc.exists ? 'Overwrite' : 'Copy'} ${fc.configRel}`);
  }
  if (dirChanges.length > 0) {
    con.outHeader('  Directories to sync:');
    for (const dc of dirChanges) con.outInfo(`${dc.exists ? 'Merge into' : 'Create'} ${dc.configRel}/`);
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

function installSystemDependencies() {
  con.outHeader('System Dependencies');
  const tools = [
    { name: 'rg', check: 'rg --version' },
    { name: 'fd', check: 'fd --version || fdfind --version' }
  ];

  const missing = tools.filter(t => {
    try {
      execSync(t.check, { stdio: 'ignore' });
      con.outOk(`${t.name} is already installed`);
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length === 0) return;

  if (dryRunMode) {
    con.outInfo(`Would install missing tools: ${missing.map(m => m.name).join(', ')}`);
    return;
  }

  con.outInfo('Installing missing dependencies...');

  try {
    if (existsSync('/etc/debian_version')) {
      execSync('sudo apt-get update -qq && sudo apt-get install -y ripgrep fd-find', { stdio: 'inherit' });
    } else if (existsSync('/etc/fedora-release') || existsSync('/etc/redhat-release')) {
      execSync('sudo dnf install -y ripgrep fd-find', { stdio: 'inherit' });
    } else if (existsSync('/etc/arch-release')) {
      execSync('sudo pacman -S --noconfirm ripgrep fd', { stdio: 'inherit' });
    } else if (process.platform === 'darwin') {
      execSync('brew install ripgrep fd', { stdio: 'inherit' });
    } else {
      con.outWarn('Automatic installation not supported for this OS. Please install ripgrep and fd manually.');
    }
  } catch (err) {
    con.outError(`Failed to install dependencies: ${err.message}`);
  }
}

function installConfig(configChanges) {
  if (configChanges.length === 0) return;
  const config = readJson(CONFIG_JSON_PATH);
  if (!config) return con.outError('Could not read opencode.json for merge');

  for (const change of configChanges) {
    if (change.field === 'plugin') config.plugin = change.after;
    else if (change.field === 'default_agent') config.default_agent = change.after;
    else if (change.field === 'instructions') config.instructions = change.after;
    else if (change.field === 'skills.paths') {
      if (!config.skills) config.skills = {};
      config.skills.paths = change.after;
    } else if (change.field === 'autoupdate') config.autoupdate = change.after;
  }
  writeJson(CONFIG_JSON_PATH, config);
  con.outOk('Updated opencode.json');
}

function installFiles(fileChanges, dirChanges) {
  for (const fc of fileChanges) {
    backupDir = ensureBackupDir(join(CONFIG_DIR, '.backups'));
    backupFile(fc.configRel, CONFIG_DIR, backupDir);
    if (copyFileChecked(fc.src, fc.dest, { executable: fc.executable, dryRun: dryRunMode })) {
      con.outOk(`Copied ${fc.configRel}`);
    }
  }
  for (const dc of dirChanges) {
    backupDir = ensureBackupDir(join(CONFIG_DIR, '.backups'));
    backupDirContent(dc.configRel, CONFIG_DIR, backupDir);
    if (copyDirRecursive(dc.src, dc.dest, { dryRun: dryRunMode })) {
      con.outOk(`Synced ${dc.configRel}/`);
    }
  }
}

function ensureMemoryDir() {
  if (dryRunMode) {
    con.outInfo('Would create zeus/memory/ directory');
    return;
  }
  const memDir = join(REPO_DIR, 'zeus', 'memory');
  try {
    mkdirSync(memDir, { recursive: true });
    con.outOk('Created zeus/memory/');
  } catch (err) {
    con.outWarn(`Could not create zeus/memory/: ${err.message}`);
  }
}

function installGitHook() {
  if (dryRunMode) {
    con.outInfo('Would install git post-checkout hook');
    return;
  }
  const gitDir = join(REPO_DIR, '.git');
  if (!existsSync(gitDir)) {
    con.outSubdued('No .git directory — skipping git hook installation');
    return;
  }
  const hookSrc = join(REPO_DIR, 'scripts', 'post-checkout-hook.sh');
  const hookDest = join(gitDir, 'hooks', 'post-checkout');
  if (!existsSync(hookSrc)) {
    con.outWarn('post-checkout-hook.sh not found — skipping');
    return;
  }
  try {
    copyFileChecked(hookSrc, hookDest, { executable: true });
    con.outOk('Installed .git/hooks/post-checkout');
  } catch (err) {
    con.outWarn(`Could not install git hook: ${err.message}`);
  }
}

function verify() {
  con.outHeader('Verification');
  let verifyFailed = false;

  const config = readJson(CONFIG_JSON_PATH);
  if (!config) {
    con.outError('Could not read opencode.json for verification');
    verifyFailed = true;
  } else {
    const schemaCheck = validateConfig(config);
    for (const w of schemaCheck.warnings) con.outWarn(w);
    for (const e of schemaCheck.errors) {
      con.outError(`Schema Error: ${e}`);
      verifyFailed = true;
    }

    if (config.default_agent === 'zeus') con.outOk('default_agent is zeus');
    else { con.outError(`default_agent is '${config.default_agent}', expected 'zeus'`); verifyFailed = true; }

    const instructions = config.instructions || [];
    const instrArray = Array.isArray(instructions) ? instructions : [instructions];
    if (instrArray.includes('AGENTS.md')) con.outOk('AGENTS.md in instructions');
    else { con.outError('AGENTS.md missing from instructions'); verifyFailed = true; }
    if (instrArray.includes('LITE.md')) con.outOk('LITE.md in instructions');
    else con.outInfo('LITE.md not in instructions — optional, enable for token-saving mode');

    const skillsPaths = config.skills?.paths || [];
    if (skillsPaths.includes(SKILLS_PATH)) con.outOk('skills.paths includes skills/opencode-zeus');
    else { con.outError('skills.paths missing skills/opencode-zeus'); verifyFailed = true; }

    if (config.autoupdate === false) con.outOk('autoupdate is false');
    else con.outWarn('autoupdate is not false — update may overwrite config');
  }

  for (const fc of FILE_COPIES) {
    if (existsSync(join(CONFIG_DIR, fc.configRel))) con.outOk(`File exists: ${fc.configRel}`);
    else { con.outError(`File missing: ${fc.configRel}`); verifyFailed = true; }
  }

  for (const dc of DIR_COPIES) {
    if (existsSync(join(CONFIG_DIR, dc.configRel))) con.outOk(`Directory exists: ${dc.configRel}/`);
    else con.outWarn(`Directory missing: ${dc.configRel}/`);
  }

  if (verifyFailed) {
    con.outError('Verification failed. Check errors above.');
    return false;
  }
  return true;
}

async function main() {
  parseArgs();
  console.log('');
  con.outHeader('opencode-zeus \u2014 config installer');
  con.outSubdued(`Repo: ${REPO_DIR}`);
  con.outSubdued(`Config: ${CONFIG_DIR}\n`);

  preflight();

  const existingConfig = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  const configChanges = existingConfig ? planJsonMerge(existingConfig) : [];
  const fileChanges = planFileChanges();
  const dirChanges = planDirChanges();

  displayPlannedChanges(configChanges, fileChanges, dirChanges);

  if (dryRunMode) {
    console.log('');
    con.outInfo(`${c(BOLD, 'Dry run complete.')} No files were changed.`);
    process.exit(0);
  }

  if (!await confirm()) {
    console.log('');
    con.outInfo('Installation cancelled.');
    process.exit(0);
  }

  con.outHeader('Installing');
  installSystemDependencies();
  installConfig(configChanges);
  installFiles(fileChanges, dirChanges);
  installGitHook();
  ensureMemoryDir();
  const verified = verify();

  if (backupDir) con.outInfo(`Backups saved to ${backupDir}`);

  console.log('');
  if (verified) {
    console.log(`  ${c(GREEN, c(BOLD, '\u2714 Setup complete.'))}`);
  } else {
    con.outWarn('Setup completed with verification warnings. Review errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c(RED, 'Error:'), err.stack || err.message);
  process.exit(1);
});
