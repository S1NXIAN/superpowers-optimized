import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { buildSnapshot, validateSnapshot, cli } from '../../lib/context-snapshot.mjs';

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

describe('lib/context-snapshot CLI', () => {
  const LIB = new URL('../../lib/context-snapshot.mjs', import.meta.url).pathname;

  it('--build prints JSON to stdout', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-cli-'));
    createGitRepo(dir);
    writeFileSync(join(dir, 'extra.js'), '// extra');
    execSync('git add . && git commit -m "extra"', { cwd: dir, stdio: 'pipe' });
    const out = execSync(`node ${LIB} --build ${dir}`, { encoding: 'utf8' });
    const snap = JSON.parse(out);
    assert.ok(snap.git_hash);
    assert.ok(snap.changed_files.length > 0);
  });

  it('--write creates zeus/memory/context-snapshot.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-cli-'));
    createGitRepo(dir);
    execSync(`node ${LIB} --write ${dir}`, { encoding: 'utf8' });
    const snapPath = join(dir, 'zeus', 'memory', 'context-snapshot.json');
    assert.ok(existsSync(snapPath));
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
    assert.ok(snap.git_hash);
  });

  it('--validate outputs VALID for good snapshot', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-cli-'));
    createGitRepo(dir);
    execSync(`node ${LIB} --write ${dir}`, { encoding: 'utf8' });
    const snapPath = join(dir, 'zeus', 'memory', 'context-snapshot.json');
    const out = execSync(`node ${LIB} --validate ${snapPath}`, { encoding: 'utf8' });
    assert.equal(out.trim(), 'VALID');
  });

  it('--check outputs FRESH when hash matches HEAD', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-cli-'));
    createGitRepo(dir);
    execSync(`node ${LIB} --write ${dir}`, { encoding: 'utf8' });
    const snapPath = join(dir, 'zeus', 'memory', 'context-snapshot.json');
    const out = execSync(`node ${LIB} --check ${snapPath}`, { encoding: 'utf8', cwd: dir });
    assert.equal(out.trim(), 'FRESH');
  });

  it('--check outputs NO_FILE when file missing', () => {
    const out = execSync(`node ${LIB} --check /nonexistent/snap.json`, { encoding: 'utf8' });
    assert.equal(out.trim(), 'NO_FILE');
  });

  it('--help prints usage', () => {
    const out = execSync(`node ${LIB} --help`, { encoding: 'utf8' });
    assert.ok(out.includes('--build'));
    assert.ok(out.includes('--write'));
  });
});
});
