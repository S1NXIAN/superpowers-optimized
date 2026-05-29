import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildSnapshot(projectRoot) {
  try {
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'pipe' });
  } catch {
    return null;
  }

  try {
    const gitHash = execSync('git rev-parse HEAD', { cwd: projectRoot, stdio: 'pipe' })
      .toString()
      .trim();

    let changedFiles = [];
    try {
      const changedFilesRaw = execSync('git diff --name-only HEAD~1..HEAD', {
        cwd: projectRoot,
        stdio: 'pipe',
      }).toString().trim();
      changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];
    } catch {
      // Single commit — no parent to diff against
      changedFiles = [];
    }

    let changeStat;
    try {
      changeStat = execSync('git diff --stat HEAD~1..HEAD', {
        cwd: projectRoot,
        stdio: 'pipe',
      }).toString().trim();
    } catch {
      changeStat = '';
    }

    const recentCommitsRaw = execSync('git log --oneline -5', {
      cwd: projectRoot,
      stdio: 'pipe',
    }).toString().trim();
    const recentCommits = recentCommitsRaw ? recentCommitsRaw.split('\n').filter(Boolean) : [];

    // Check for ripgrep (preferred) or fall back to native grep
    let hasRg = false;
    try {
      execSync('rg --version', { stdio: 'pipe' });
      hasRg = true;
    } catch { /* rg not available */ }

    const blastRadius = {};
    const skipBlastRadius = changedFiles.length > 10;

    for (const file of changedFiles) {
      if (skipBlastRadius) {
        blastRadius[file] = [];
        continue;
      }
      const baseName = file.split('/').pop().replace(/\.[^/.]+$/, '');
      const searchPattern = `require\\(.*['"]${baseName}['"]\\)|from\\s*['"]${baseName}['"]`;
      try {
        let refs;
        if (hasRg) {
          refs = execSync(
            `rg -l "${searchPattern}" --glob '!node_modules' --glob '!.git'`,
            { cwd: projectRoot, stdio: 'pipe' }
          ).toString().trim();
        } else {
          refs = execSync(
            `grep -rl "${searchPattern}" --include='*.{js,mjs,cjs,ts,jsx,tsx}' . 2>/dev/null || true`,
            { cwd: projectRoot, stdio: 'pipe' }
          ).toString().trim();
        }
        if (refs) {
          blastRadius[file] = refs.split('\n').filter(Boolean)
            .filter(f => f !== file);
        } else {
          blastRadius[file] = [];
        }
      } catch {
        blastRadius[file] = [];
      }
    }

    return {
      git_hash: gitHash,
      changed_files: changedFiles,
      change_stat: changeStat,
      recent_commits: recentCommits,
      blast_radius: blastRadius,
      generated: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function validateSnapshot(snap) {
  if (snap === null || typeof snap !== 'object' || Array.isArray(snap)) {
    return false;
  }

  const requiredKeys = ['git_hash', 'changed_files', 'blast_radius', 'generated'];
  for (const key of requiredKeys) {
    if (!(key in snap)) {
      return false;
    }
  }

  if (typeof snap.git_hash !== 'string' || snap.git_hash.length === 0) {
    return false;
  }

  if (!Array.isArray(snap.changed_files)) {
    return false;
  }

  if (typeof snap.blast_radius !== 'object' || Array.isArray(snap.blast_radius)) {
    return false;
  }

  return true;
}

// ── CLI entry point ──────────────────────────────────────────────────
//
//   --build <dir>       JSON to stdout
//   --write <dir>       write to zeus/memory/context-snapshot.json
//   --check <jsonpath>  FRESH | STALE | INVALID | NO_FILE | NO_GIT
//   --validate <path>   VALID | INVALID
//   --help

const _filename = fileURLToPath(import.meta.url);
const _isMain = process.argv[1] && (process.argv[1] === _filename || basename(process.argv[1]) === 'context-snapshot.mjs');

export function cli(args) {
  const argv = args || process.argv.slice(2);

  if (argv.length === 0 || argv.includes('--help')) {
    console.log(`context-snapshot.mjs — snapshot builder CLI

Usage:
  --build <dir>         Build snapshot JSON, print to stdout
  --write <dir>         Build snapshot, write to <dir>/zeus/memory/context-snapshot.json
  --check <jsonpath>    Check if snapshot matches HEAD: FRESH | STALE | INVALID | NO_GIT
  --validate <path>     Validate snapshot file: VALID | INVALID
  --help                This message
`);
    return;
  }

  if (argv[0] === '--build') {
    const dir = argv[1] || process.cwd();
    const snap = buildSnapshot(dir);
    if (snap) {
      console.log(JSON.stringify(snap, null, 2));
    } else {
      process.stderr.write('Failed to build snapshot\n');
      process.exit(1);
    }
    return;
  }

  if (argv[0] === '--write') {
    const dir = argv[1] || process.cwd();
    const snap = buildSnapshot(dir);
    const memDir = join(dir, 'zeus', 'memory');
    mkdirSync(memDir, { recursive: true });
    const snapPath = join(memDir, 'context-snapshot.json');
    if (snap) {
      writeFileSync(snapPath, JSON.stringify(snap, null, 2) + '\n', 'utf8');
      console.log('Wrote ' + snapPath);
    } else {
      // Non-git — write minimal stub
      const stub = {
        git_hash: 'no-git',
        changed_files: [],
        change_stat: '',
        recent_commits: [],
        blast_radius: {},
        generated: new Date().toISOString(),
      };
      writeFileSync(snapPath, JSON.stringify(stub, null, 2) + '\n', 'utf8');
      console.log('Wrote stub ' + snapPath + ' (no git repo)');
    }
    return;
  }

  if (argv[0] === '--check') {
    const jsonPath = argv[1];
    if (!jsonPath || !existsSync(jsonPath)) {
      console.log('NO_FILE');
      return;
    }
    let snap;
    try {
      snap = JSON.parse(readFileSync(jsonPath, 'utf8'));
    } catch {
      console.log('INVALID');
      return;
    }
    if (!validateSnapshot(snap)) {
      console.log('INVALID');
      return;
    }
    // Derive project root: <root>/zeus/memory/context-snapshot.json
    const projectRoot = join(dirname(dirname(dirname(jsonPath))));
    try {
      const headHash = execSync('git rev-parse HEAD', {
        cwd: projectRoot,
        stdio: 'pipe',
      }).toString().trim();
      console.log(headHash === snap.git_hash ? 'FRESH' : 'STALE');
    } catch {
      console.log('NO_GIT');
    }
    return;
  }

  if (argv[0] === '--validate') {
    const jsonPath = argv[1];
    if (!jsonPath || !existsSync(jsonPath)) {
      console.log('INVALID');
      return;
    }
    try {
      const snap = JSON.parse(readFileSync(jsonPath, 'utf8'));
      console.log(validateSnapshot(snap) ? 'VALID' : 'INVALID');
    } catch {
      console.log('INVALID');
    }
    return;
  }

  console.error('Unknown option: ' + argv[0]);
  process.exit(1);
}

if (_isMain) {
  cli();
}
