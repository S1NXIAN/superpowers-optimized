import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { buildSnapshot, validateSnapshot } from '../../lib/context-snapshot.mjs';

function createGitRepo(dir) {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email test@test.com', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name Test', { cwd: dir, stdio: 'pipe' });
  writeFileSync(join(dir, 'README.md'), '# test');
  execSync('git add . && git commit -m "init"', { cwd: dir, stdio: 'pipe' });
}

describe('lib/context-snapshot', () => {
  describe('buildSnapshot()', () => {
    it('returns object with all required keys in git repo', () => {
      const dir = mkdtempSync(join(tmpdir(), 'cs-test-'));
      createGitRepo(dir);
      mkdirSync(join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'src', 'index.js'), '// v2');
      execSync('git add . && git commit -m "add index"', { cwd: dir, stdio: 'pipe' });
      writeFileSync(join(dir, 'src', 'lib.js'), '// lib');
      execSync('git add . && git commit -m "add lib"', { cwd: dir, stdio: 'pipe' });

      const result = buildSnapshot(dir);
      assert.ok(result.git_hash);
      assert.ok(Array.isArray(result.changed_files));
      assert.ok(result.change_stat);
      assert.ok(Array.isArray(result.recent_commits));
      assert.ok(result.recent_commits.length <= 5);
      assert.ok(result.generated);
    });

    it('returns null in non-git directory', () => {
      const dir = mkdtempSync(join(tmpdir(), 'cs-test-'));
      const result = buildSnapshot(dir);
      assert.equal(result, null);
    });
  });

  describe('validateSnapshot()', () => {
    it('returns true for valid snapshot', () => {
      const valid = {
        git_hash: 'abc123',
        changed_files: ['src/index.js'],
        change_stat: '1 file changed',
        recent_commits: ['abc123 fix'],
        blast_radius: {},
        generated: '2026-01-01T00:00:00.000Z',
      };
      assert.equal(validateSnapshot(valid), true);
    });

    it('returns false when git_hash is missing', () => {
      assert.equal(validateSnapshot({ changed_files: [] }), false);
    });

    it('returns false when changed_files is not an array', () => {
      assert.equal(validateSnapshot({ git_hash: 'abc', changed_files: 'not-array' }), false);
    });

    it('returns false for null', () => {
      assert.equal(validateSnapshot(null), false);
    });

    it('returns false for non-object', () => {
      assert.equal(validateSnapshot('string'), false);
    });
  });
});
