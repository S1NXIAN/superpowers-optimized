#!/usr/bin/env node

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join, dirname, sep } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REPO_DIR = __dirname;
const CONFIG_DIR = join(homedir(), '.config', 'opencode');
const CONFIG_JSON_PATH = join(CONFIG_DIR, 'opencode.json');
const BACKUP_PARENT = join(CONFIG_DIR, '.backups');

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

let forceMode = false;
let dryRunMode = false;

function showHelp() {
  console.log(`${c(BOLD, 'Superpowers Enhanced \u2014 config uninstaller')}\n`);
  console.log(`${c(DIM, 'Reverses the changes made by setup.mjs and restores files from backup.')}\n`);
  console.log(`${c(BOLD, 'Usage:')}  node uninstall.mjs [OPTIONS]\n`);
  console.log(`${c(BOLD, 'Options:')}`);
  console.log('  --force       Non-interactive; skip confirmation prompt');
  console.log('  --dry-run     Show what would change; don\'t touch anything');
  console.log('  --help        Show this help and exit\n');
  console.log(`${c(BOLD, 'What it does:')}`);
  console.log('  1. Removes superpowers entries from opencode.json');
  console.log('  2. Removes managed files and directories from ~/.config/opencode/');
  console.log('  3. Restores previous versions from the most recent backup');
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

function findLatestBackup() {
  if (!existsSync(BACKUP_PARENT)) return null;
  const entries = readdirSync(BACKUP_PARENT).map(name => {
    const fullPath = join(BACKUP_PARENT, name);
    return { name, path: fullPath, mtime: statSync(fullPath).mtimeMs };
  });
  entries.sort((a, b) => b.mtime - a.mtime);
  return entries.length > 0 ? entries[0].path : null;
}

function backupFileSource(backupPath, configRelPath) {
  const src = join(backupPath, configRelPath);
  return existsSync(src) ? src : null;
}

function readChar() {
  return new Promise((resolve) => {
    const { stdin } = process;
    if (stdin.isTTY) {
      stdin.setRawMode(true);
      stdin.resume();
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

function planJsonRevert(config) {
  const changes = [];

  const plugins = config.plugin || [];
  const pluginIndex = plugins.indexOf(SUPERPOWERS_PLUGIN);
  if (pluginIndex !== -1) {
    const newPlugins = [...plugins];
    newPlugins.splice(pluginIndex, 1);
    changes.push({ field: 'plugin', before: plugins, after: newPlugins.length > 0 ? newPlugins : undefined });
  }

  if (config.default_agent === 'zeus') {
    changes.push({ field: 'default_agent', before: 'zeus', after: undefined });
  }

  const instructions = config.instructions || [];
  const instrArray = Array.isArray(instructions) ? instructions : [instructions];
  if (instrArray.includes('AGENTS.md')) {
    const newInstr = instrArray.filter(i => i !== 'AGENTS.md');
    changes.push({ field: 'instructions', before: instructions, after: newInstr.length > 0 ? newInstr : undefined });
  }

  const skillsPaths = config.skills?.paths || [];
  if (skillsPaths.includes(SKILLS_PATH)) {
    const newPaths = skillsPaths.filter(p => p !== SKILLS_PATH);
    changes.push({ field: 'skills.paths', before: [...skillsPaths], after: newPaths.length > 0 ? newPaths : undefined });
  }

  if (config.autoupdate === false) {
    changes.push({ field: 'autoupdate', before: false, after: undefined });
  }

  return changes;
}

const MANAGED_FILES = [
  'AGENTS.md',
  'agent/zeus.md',
  'scripts/verify-hash.sh',
];

const MANAGED_DIRS = [
  SKILLS_PATH,
  'prompts',
];

function planFileRemovals() {
  const changes = [];
  for (const rel of MANAGED_FILES) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      changes.push({ type: 'file', configRel: rel });
    }
  }
  return changes;
}

function planDirRemovals() {
  const changes = [];
  for (const rel of MANAGED_DIRS) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      changes.push({ type: 'dir', configRel: rel });
    }
  }
  return changes;
}

function planBackupRestores(backupPath, configChanges, fileRemovals, dirRemovals) {
  if (!backupPath) return [];
  const restores = [];

  for (const change of configChanges) {
    if (change.field === 'default_agent' && change.after === undefined) {
      const bak = backupFileSource(backupPath, 'opencode.json');
      if (bak) {
        const bakConfig = readJson(bak);
        if (bakConfig && bakConfig.default_agent && bakConfig.default_agent !== 'zeus') {
          restores.push({ type: 'config_field', field: 'default_agent', value: bakConfig.default_agent, source: 'backup' });
        }
      }
    }
  }

  for (const fr of fileRemovals) {
    const bak = backupFileSource(backupPath, fr.configRel);
    if (bak) {
      restores.push({ type: 'file', configRel: fr.configRel, source: bak });
    }
  }

  for (const dr of dirRemovals) {
    const bak = backupFileSource(backupPath, dr.configRel);
    if (bak) {
      restores.push({ type: 'dir', configRel: dr.configRel, source: bak });
    }
  }

  return restores;
}

function displayPlannedChanges(configChanges, fileRemovals, dirRemovals, backupPath, restores) {
  outHeader('Planned changes');

  outHeader('  opencode.json:');
  if (configChanges.length === 0) {
    outSubdued('  (no changes needed)');
  } else {
    for (const change of configChanges) {
      console.log(`\n    ${c(BOLD, change.field)}:`);
      outSubdued(`    remove: ${JSON.stringify(change.before)}`);
    }
  }

  if (backupPath) {
    outInfo(`Backup found at: ${backupPath}`);
  } else {
    outSubdued('No backup directory found.');
  }

  if (fileRemovals.length > 0) {
    outHeader('  Files to remove:');
    for (const fr of fileRemovals) {
      outInfo(`Remove ${fr.configRel}`);
    }
  }

  if (dirRemovals.length > 0) {
    outHeader('  Directories to remove:');
    for (const dr of dirRemovals) {
      outInfo(`Remove ${dr.configRel}/`);
    }
  }

  if (restores.length > 0) {
    outHeader('  Files to restore from backup:');
    for (const r of restores) {
      if (r.type === 'config_field') {
        outInfo(`Restore default_agent to '${r.value}'`);
      } else {
        outInfo(`Restore ${r.configRel}`);
      }
    }
  }
}

async function confirm() {
  if (forceMode) return true;
  process.stdout.write(`  ${c(BOLD, 'Proceed with uninstallation?')} [Y/n] `);
  return readChar();
}

function revertConfig(configChanges) {
  if (configChanges.length === 0) return;
  const config = readJson(CONFIG_JSON_PATH);
  if (!config) {
    outWarn('Could not read opencode.json for revert');
    return;
  }

  for (const change of configChanges) {
    switch (change.field) {
      case 'plugin':
        if (change.after === undefined) {
          delete config.plugin;
        } else {
          config.plugin = change.after;
        }
        break;
      case 'default_agent':
        delete config.default_agent;
        break;
      case 'instructions':
        if (change.after === undefined) {
          delete config.instructions;
        } else {
          config.instructions = change.after;
        }
        break;
      case 'skills.paths':
        if (change.after === undefined) {
          if (config.skills) {
            delete config.skills.paths;
            if (Object.keys(config.skills).length === 0) {
              delete config.skills;
            }
          }
        } else {
          if (!config.skills) config.skills = {};
          config.skills.paths = change.after;
        }
        break;
      case 'autoupdate':
        delete config.autoupdate;
        break;
    }
  }

  writeJson(CONFIG_JSON_PATH, config);
  outOk('Reverted opencode.json');
}

function removeEmptyAncestors(destPath) {
  let parent = dirname(destPath);
  while (parent.startsWith(CONFIG_DIR + sep)) {
    try {
      if (existsSync(parent) && readdirSync(parent).length === 0) {
        rmSync(parent, { force: true });
        const rel = parent.replace(CONFIG_DIR + sep, '');
        outSubdued(`Removed empty directory: ${rel}`);
      } else {
        break;
      }
    } catch {
      break;
    }
    parent = dirname(parent);
  }
}

function removeFile(configRel) {
  const dest = join(CONFIG_DIR, configRel);
  if (!existsSync(dest)) return;
  rmSync(dest);
  outOk(`Removed ${configRel}`);

  removeEmptyAncestors(dest);
}

function removeDir(configRel) {
  const dest = join(CONFIG_DIR, configRel);
  if (!existsSync(dest)) return;
  rmSync(dest, { recursive: true });
  outOk(`Removed ${configRel}/`);

  removeEmptyAncestors(dest);
}

function restoreFromBackup(restores) {
  const config = readJson(CONFIG_JSON_PATH);

  for (const r of restores) {
    if (r.type === 'config_field' && r.field === 'default_agent') {
      if (!config) {
        outWarn(`Cannot restore ${r.field} — opencode.json not readable`);
        continue;
      }
      config.default_agent = r.value;
      writeJson(CONFIG_JSON_PATH, config);
      outOk(`Restored default_agent to '${r.value}'`);
    } else if (r.type === 'file') {
      if (!existsSync(dirname(join(CONFIG_DIR, r.configRel)))) {
        mkdirSync(dirname(join(CONFIG_DIR, r.configRel)), { recursive: true });
      }
      copyFileSync(r.source, join(CONFIG_DIR, r.configRel));
      outOk(`Restored ${r.configRel}`);
    } else if (r.type === 'dir') {
      const dest = join(CONFIG_DIR, r.configRel);
      if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
      const entries = readdirSync(r.source);
      for (const entry of entries) {
        const srcPath = join(r.source, entry);
        const destPath = join(dest, entry);
        if (statSync(srcPath).isDirectory()) {
          copyDirRecursive(srcPath, destPath);
        } else {
          if (!existsSync(dirname(destPath))) mkdirSync(dirname(destPath), { recursive: true });
          copyFileSync(srcPath, destPath);
        }
      }
      outOk(`Restored ${r.configRel}/`);
    }
  }
}

function copyDirRecursive(src, dest) {
  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      if (!existsSync(destPath)) mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      if (!existsSync(dirname(destPath))) mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(srcPath, destPath);
    }
  }
}

function verify(restoredPaths = []) {
  outHeader('Verification');
  let verifyFailed = false;
  const restoredSet = new Set(restoredPaths);

  const config = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  if (config) {
    const plugins = config.plugin || [];
    if (plugins.some(p => p === SUPERPOWERS_PLUGIN)) {
      outError('opencode.json still has superpowers plugin');
      verifyFailed = true;
    } else {
      outOk('Superpowers plugin removed from opencode.json');
    }

    if (config.default_agent === 'zeus') {
      outError('default_agent still set to zeus');
      verifyFailed = true;
    } else {
      outOk('default_agent no longer zeus');
    }

    const instructions = config.instructions || [];
    const instrArray = Array.isArray(instructions) ? instructions : [instructions];
    if (instrArray.includes('AGENTS.md')) {
      outError('AGENTS.md still in instructions');
      verifyFailed = true;
    } else {
      outOk('AGENTS.md removed from instructions');
    }

    const skillsPaths = config.skills?.paths || [];
    if (skillsPaths.includes(SKILLS_PATH)) {
      outError('skills.paths still includes skills/superpowers-enhanced');
      verifyFailed = true;
    } else {
      outOk('skills/superpowers-enhanced removed from skills.paths');
    }

    if (config.autoupdate === false) {
      outWarn('autoupdate still false (left as-is, no harm)');
    }
  } else {
    outOk('opencode.json not present (already clean)');
  }

  for (const rel of MANAGED_FILES) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      if (restoredSet.has(rel)) {
        outOk(`File restored: ${rel} (from backup)`);
      } else {
        outError(`File still exists: ${rel}`);
        verifyFailed = true;
      }
    } else {
      outOk(`File removed: ${rel}`);
    }
  }

  for (const rel of MANAGED_DIRS) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      if (restoredSet.has(rel)) {
        outOk(`Directory restored: ${rel}/ (from backup)`);
      } else {
        outError(`Directory still exists: ${rel}/`);
        verifyFailed = true;
      }
    } else {
      outOk(`Directory removed: ${rel}/`);
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
  outHeader('Superpowers Enhanced \u2014 config uninstaller');
  outSubdued(`Repo: ${REPO_DIR}`);
  outSubdued(`Config: ${CONFIG_DIR}\n`);

  const config = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  const configChanges = config ? planJsonRevert(config) : [];

  const fileRemovals = planFileRemovals();
  const dirRemovals = planDirRemovals();

  const backupPath = findLatestBackup();
  const restores = planBackupRestores(backupPath, configChanges, fileRemovals, dirRemovals);

  if (configChanges.length === 0 && fileRemovals.length === 0 && dirRemovals.length === 0) {
    outInfo('No superpowers-managed files found. Nothing to uninstall.');
    process.exit(0);
  }

  displayPlannedChanges(configChanges, fileRemovals, dirRemovals, backupPath, restores);

  if (dryRunMode) {
    console.log('');
    outInfo(`${c(BOLD, 'Dry run complete.')} No files were changed.`);
    process.exit(0);
  }

  if (!await confirm()) {
    console.log('');
    outInfo('Uninstallation cancelled.');
    process.exit(0);
  }

  outHeader('Uninstalling');

  revertConfig(configChanges);

  for (const fr of fileRemovals) {
    removeFile(fr.configRel);
  }

  for (const dr of dirRemovals) {
    removeDir(dr.configRel);
  }

  if (restores.length > 0) {
    outHeader('Restoring from backup');
    restoreFromBackup(restores);
  }

  // Collect paths that were restored — verification should not flag these
  const restoredPaths = restores
    .filter(r => r.type === 'file' || r.type === 'dir')
    .map(r => r.configRel);

  const verified = verify(restoredPaths);

  console.log('');
  if (verified) {
    console.log(`  ${c(GREEN, c(BOLD, '\u2714 Uninstall complete.'))}`);
  } else {
    outWarn('Uninstall completed with verification warnings. Review errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c(RED, 'Error:'), err.stack || err.message);
  process.exit(1);
});