import { execSync } from 'node:child_process';

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

    const changedFilesRaw = execSync('git diff --name-only HEAD~1..HEAD', {
      cwd: projectRoot,
      stdio: 'pipe',
    }).toString().trim();
    const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];

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

    const blastRadius = {};
    for (const file of changedFiles) {
      const baseName = file.split('/').pop().replace(/\.[^/.]+$/, '');
      try {
        const refs = execSync(`rg -l "require\\(.*['"]${baseName}['"]\\)|from\\s*['"]${baseName}['"]" --glob '!node_modules' --glob '!.git'`, {
          cwd: projectRoot,
          stdio: 'pipe',
        }).toString().trim();
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
