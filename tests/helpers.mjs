/**
 * tests/helpers.mjs — shared test utilities
 *
 * DRY helpers for git init, temp dirs, shell wrappers.
 * Import in any test file that needs them.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Create a minimal git repo with 1–2 commits.
 * @param {string} dir — temp directory path
 * @param {boolean} [extraCommit=false] — add a second commit
 */
export function createGitRepo(dir, extraCommit = false) {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email test@test.com', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name Test', { cwd: dir, stdio: 'pipe' });
  writeFileSync(join(dir, 'README.md'), '# test');
  execSync('git add . && git commit -m "init"', { cwd: dir, stdio: 'pipe' });
  if (extraCommit) {
    writeFileSync(join(dir, 'extra.js'), '// extra');
    execSync('git add . && git commit -m "extra"', { cwd: dir, stdio: 'pipe' });
  }
}

/**
 * Ensure zeus/memory/ directory exists within the project root.
 * @returns {string} — path to zeus/memory/
 */
export function ensureMemDir(dir) {
  const mem = join(dir, 'zeus', 'memory');
  mkdirSync(mem, { recursive: true });
  return mem;
}
