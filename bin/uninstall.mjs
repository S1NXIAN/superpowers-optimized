#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SUPERPOWERS_PLUGIN, SKILLS_PATH, CONFIG_DIR, CONFIG_JSON_PATH,
  BACKUP_PARENT, MANAGED_FILES, MANAGED_DIRS
} from '../lib/constants.mjs';
import { createConsole } from '../lib/console.mjs';
import {
  readJson, writeJson, removeFile, removeDir, copyDirRecursive
} from '../lib/fs-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..');
const con = createConsole();
const { c, BOLD, DIM, RED, GREEN, YELLOW, BLUE, RESET } = con;

let forceMode = false;
let dryRunMode = false;

function showHelp() {
  console.log(`${c(BOLD, 'opencode-zeus \u2014 config uninstaller')}\n`);
  console.log(`${c(DIM, 'Reverses the changes made by bin/setup.mjs and restores files from backup.')}\n`);
  console.log(`${c(BOLD, 'Usage:')}  node bin/uninstall.mjs [OPTIONS]\n`);
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
  const zeusInstructions = ['AGENTS.md', 'LITE.md'];
  const hasAny = zeusInstructions.some(i => instrArray.includes(i));
  if (hasAny) {
    const newInstr = instrArray.filter(i => !zeusInstructions.includes(i));
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

function planFileRemovals() {
  const changes = [];
  for (const rel of MANAGED_FILES) {
    if (existsSync(join(CONFIG_DIR, rel))) changes.push({ type: 'file', configRel: rel });
  }
  return changes;
}

function planDirRemovals() {
  const changes = [];
  for (const rel of MANAGED_DIRS) {
    if (existsSync(join(CONFIG_DIR, rel))) changes.push({ type: 'dir', configRel: rel });
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
    if (bak) restores.push({ type: 'file', configRel: fr.configRel, source: bak });
  }
  for (const dr of dirRemovals) {
    const bak = backupFileSource(backupPath, dr.configRel);
    if (bak) restores.push({ type: 'dir', configRel: dr.configRel, source: bak });
  }
  return restores;
}

function displayPlannedChanges(configChanges, fileRemovals, dirRemovals, backupPath, restores) {
  con.outHeader('Planned changes');
  con.outHeader('  opencode.json:');
  if (configChanges.length === 0) con.outSubdued('  (no changes needed)');
  else {
    for (const change of configChanges) {
      console.log(`\n    ${c(BOLD, change.field)}:`);
      con.outSubdued(`    remove: ${JSON.stringify(change.before)}`);
    }
  }
  if (backupPath) con.outInfo(`Backup found at: ${backupPath}`);
  else con.outSubdued('No backup directory found.');

  if (fileRemovals.length > 0) {
    con.outHeader('  Files to remove:');
    for (const fr of fileRemovals) con.outInfo(`Remove ${fr.configRel}`);
  }
  if (dirRemovals.length > 0) {
    con.outHeader('  Directories to remove:');
    for (const dr of dirRemovals) con.outInfo(`Remove ${dr.configRel}/`);
  }
  if (restores.length > 0) {
    con.outHeader('  Files to restore from backup:');
    for (const r of restores) {
      if (r.type === 'config_field') con.outInfo(`Restore default_agent to '${r.value}'`);
      else con.outInfo(`Restore ${r.configRel}`);
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
      process.stdout.write(`  ${c(BOLD, 'Proceed with uninstallation?')} [Y/n] `);
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

function revertConfig(configChanges) {
  if (configChanges.length === 0) return;
  const config = readJson(CONFIG_JSON_PATH);
  if (!config) return con.outWarn('Could not read opencode.json for revert');

  for (const change of configChanges) {
    if (change.field === 'plugin') {
      if (change.after === undefined) delete config.plugin;
      else config.plugin = change.after;
    } else if (change.field === 'default_agent') {
      delete config.default_agent;
    } else if (change.field === 'instructions') {
      if (change.after === undefined) delete config.instructions;
      else config.instructions = change.after;
    } else if (change.field === 'skills.paths') {
      if (change.after === undefined) {
        if (config.skills) {
          delete config.skills.paths;
          if (Object.keys(config.skills).length === 0) delete config.skills;
        }
      } else {
        if (!config.skills) config.skills = {};
        config.skills.paths = change.after;
      }
    } else if (change.field === 'autoupdate') {
      delete config.autoupdate;
    }
  }
  writeJson(CONFIG_JSON_PATH, config);
  con.outOk('Reverted opencode.json');
}

function restoreFromBackup(restores) {
  const config = readJson(CONFIG_JSON_PATH);
  for (const r of restores) {
    if (r.type === 'config_field' && r.field === 'default_agent') {
      if (!config) {
        con.outWarn(`Cannot restore ${r.field} — opencode.json not readable`);
        continue;
      }
      config.default_agent = r.value;
      writeJson(CONFIG_JSON_PATH, config);
      con.outOk(`Restored default_agent to '${r.value}'`);
    } else if (r.type === 'file') {
      const destPath = join(CONFIG_DIR, r.configRel);
      if (!existsSync(dirname(destPath))) mkdirSync(dirname(destPath), { recursive: true });
      copyFileSync(r.source, destPath);
      con.outOk(`Restored ${r.configRel}`);
    } else if (r.type === 'dir') {
      const destPath = join(CONFIG_DIR, r.configRel);
      copyDirRecursive(r.source, destPath);
      con.outOk(`Restored ${r.configRel}/`);
    }
  }
}

function verify(restoredPaths = []) {
  con.outHeader('Verification');
  let verifyFailed = false;
  const restoredSet = new Set(restoredPaths);

  const config = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  if (config) {
    const plugins = config.plugin || [];
    if (plugins.some(p => p === SUPERPOWERS_PLUGIN)) { con.outError('opencode.json still has superpowers plugin'); verifyFailed = true; }
    else con.outOk('Zeus Elite plugin removed from opencode.json');

    if (config.default_agent === 'zeus') { con.outError('default_agent still set to zeus'); verifyFailed = true; }
    else con.outOk('default_agent no longer zeus');

    const instructions = config.instructions || [];
    const instrArray = Array.isArray(instructions) ? instructions : [instructions];
    if (instrArray.includes('AGENTS.md')) { con.outError('AGENTS.md still in instructions'); verifyFailed = true; }
    else con.outOk('AGENTS.md removed from instructions');

    const skillsPaths = config.skills?.paths || [];
    if (skillsPaths.includes(SKILLS_PATH)) { con.outError('skills.paths still includes skills/opencode-zeus'); verifyFailed = true; }
    else con.outOk('skills/opencode-zeus removed from skills.paths');

    if (config.autoupdate === false) con.outWarn('autoupdate still false (left as-is, no harm)');
  } else {
    con.outOk('opencode.json not present (already clean)');
  }

  for (const rel of MANAGED_FILES) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      if (restoredSet.has(rel)) con.outOk(`File restored: ${rel} (from backup)`);
      else { con.outError(`File still exists: ${rel}`); verifyFailed = true; }
    } else con.outOk(`File removed: ${rel}`);
  }

  for (const rel of MANAGED_DIRS) {
    const dest = join(CONFIG_DIR, rel);
    if (existsSync(dest)) {
      if (restoredSet.has(rel)) con.outOk(`Directory restored: ${rel}/ (from backup)`);
      else { con.outError(`Directory still exists: ${rel}/`); verifyFailed = true; }
    } else con.outOk(`Directory removed: ${rel}/`);
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
  con.outHeader('opencode-zeus \u2014 config uninstaller');
  con.outSubdued(`Repo: ${REPO_DIR}`);
  con.outSubdued(`Config: ${CONFIG_DIR}\n`);

  const config = existsSync(CONFIG_JSON_PATH) ? readJson(CONFIG_JSON_PATH) : null;
  const configChanges = config ? planJsonRevert(config) : [];
  const fileRemovals = planFileRemovals();
  const dirRemovals = planDirRemovals();
  const backupPath = findLatestBackup();
  const restores = planBackupRestores(backupPath, configChanges, fileRemovals, dirRemovals);

  if (configChanges.length === 0 && fileRemovals.length === 0 && dirRemovals.length === 0) {
    con.outInfo('No superpowers-managed files found. Nothing to uninstall.');
    process.exit(0);
  }

  displayPlannedChanges(configChanges, fileRemovals, dirRemovals, backupPath, restores);

  if (dryRunMode) {
    console.log('');
    con.outInfo(`${c(BOLD, 'Dry run complete.')} No files were changed.`);
    process.exit(0);
  }

  if (!await confirm()) {
    console.log('');
    con.outInfo('Uninstallation cancelled.');
    process.exit(0);
  }

  con.outHeader('Uninstalling');
  revertConfig(configChanges);
  for (const fr of fileRemovals) {
    removeFile(fr.configRel, CONFIG_DIR);
    con.outOk(`Removed ${fr.configRel}`);
  }
  for (const dr of dirRemovals) {
    removeDir(dr.configRel, CONFIG_DIR);
    con.outOk(`Removed ${dr.configRel}/`);
  }

  if (restores.length > 0) {
    con.outHeader('Restoring from backup');
    restoreFromBackup(restores);
  }

  const restoredPaths = restores
    .filter(r => r.type === 'file' || r.type === 'dir')
    .map(r => r.configRel);
  const verified = verify(restoredPaths);

  console.log('');
  if (verified) {
    console.log(`  ${c(GREEN, c(BOLD, '\u2714 Uninstall complete.'))}`);
  } else {
    con.outWarn('Uninstall completed with verification warnings. Review errors above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c(RED, 'Error:'), err.stack || err.message);
  process.exit(1);
});