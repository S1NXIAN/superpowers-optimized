import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  rmSync,
  lstatSync
} from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { execSync } from 'node:child_process';

export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function copyFileChecked(src, dest, options = {}) {
  const dryRunMode = options.dryRun || false;
  if (dryRunMode) return false;

  const destDir = dirname(dest);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }

  try {
    if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) {
      rmSync(dest);
    }
  } catch {
    // dest doesn't exist or isn't symlink
  }

  copyFileSync(src, dest);
  if (options.executable) {
    try {
      execSync(`chmod +x "${dest}"`, { stdio: 'ignore' });
    } catch {
      // Ignore chmod errors on Windows
    }
  }
  return true;
}

export function copyDirRecursive(src, dest, options = {}) {
  const dryRunMode = options.dryRun || false;
  if (dryRunMode) return false;

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath, options);
    } else {
      copyFileChecked(srcPath, destPath, options);
    }
  }
  return true;
}

export function copyDir(src, dest, options = {}) {
  return copyDirRecursive(src, dest, options);
}

let sessionBackupDir = null;

export function ensureBackupDir(backupParent) {
  if (!sessionBackupDir) {
    if (!existsSync(backupParent)) {
      mkdirSync(backupParent, { recursive: true });
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    sessionBackupDir = join(backupParent, ts);
    mkdirSync(sessionBackupDir, { recursive: true });
  }
  return sessionBackupDir;
}

export function backupFile(configRelPath, configDir, backupDir) {
  const dest = join(configDir, configRelPath);
  if (!existsSync(dest)) return;
  const backupPath = join(backupDir, configRelPath);
  const backupParentPath = dirname(backupPath);
  if (!existsSync(backupParentPath)) {
    mkdirSync(backupParentPath, { recursive: true });
  }
  copyFileSync(dest, backupPath);
}

export function backupDirContent(configRelPath, configDir, backupDir) {
  const dest = join(configDir, configRelPath);
  if (!existsSync(dest)) return;
  const backupPath = join(backupDir, configRelPath);
  if (!existsSync(backupPath)) {
    mkdirSync(backupPath, { recursive: true });
  }
  copyDirRecursive(dest, backupPath);
}

export function removeEmptyAncestors(destPath, boundaryDir) {
  let parent = dirname(destPath);
  while (parent.startsWith(boundaryDir + sep)) {
    try {
      if (existsSync(parent) && readdirSync(parent).length === 0) {
        rmSync(parent, { force: true, recursive: true });
      } else {
        break;
      }
    } catch {
      break;
    }
    parent = dirname(parent);
  }
}

export function removeFile(configRel, configDir) {
  const dest = join(configDir, configRel);
  if (!existsSync(dest)) return;
  rmSync(dest);
  removeEmptyAncestors(dest, configDir);
}

export function removeDir(configRel, configDir) {
  const dest = join(configDir, configRel);
  if (!existsSync(dest)) return;
  rmSync(dest, { recursive: true });
  removeEmptyAncestors(dest, configDir);
}

export function gitAvailable() {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getGitDiff(fileA, fileB) {
  if (!existsSync(fileA) || !existsSync(fileB)) return null;
  try {
    return execSync(`git diff --no-index --color=always "${fileA}" "${fileB}"`, { encoding: 'utf8' });
  } catch (err) {
    return err.stdout || null;
  }
}
