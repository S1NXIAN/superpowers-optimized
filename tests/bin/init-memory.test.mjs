import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createGitRepo } from '../helpers.mjs';

const BIN = new URL('../../bin/init-memory.mjs', import.meta.url).pathname;

function runScript(cwd, args = []) {
  return execSync(`node ${BIN} ${args.join(' ')}`, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

describe('bin/init-memory', () => {
  it('--help prints usage and exits', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    const out = runScript(dir, ['--help']);
    assert.ok(out.includes('init-memory'));
    assert.ok(out.includes('zeus/memory'));
  });

  it('--dry-run creates no files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    runScript(dir, ['--dry-run']);
    assert.equal(existsSync(join(dir, 'zeus', 'memory')), false);
  });

  it('creates zeus/memory/ directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    runScript(dir);
    assert.ok(existsSync(join(dir, 'zeus', 'memory')));
  });

  it('creates known-issues.md template in zeus/memory/', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    runScript(dir);
    const path = join(dir, 'zeus', 'memory', 'known-issues.md');
    assert.ok(existsSync(path));
    const content = readFileSync(path, 'utf8');
    assert.ok(content.includes('# Known Issues'));
  });

  it('creates context-snapshot.json in zeus/memory/', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    runScript(dir);
    const path = join(dir, 'zeus', 'memory', 'context-snapshot.json');
    assert.ok(existsSync(path));
    const content = JSON.parse(readFileSync(path, 'utf8'));
    assert.ok(content.git_hash);
    assert.ok(Array.isArray(content.changed_files));
  });

  it('does not overwrite existing files without --force', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    const memDir = join(dir, 'zeus', 'memory');
    mkdirSync(memDir, { recursive: true });
    const knownPath = join(memDir, 'known-issues.md');
    const originalContent = '# Custom known issues\n';
    writeFileSync(knownPath, originalContent);
    runScript(dir);
    const content = readFileSync(knownPath, 'utf8');
    assert.equal(content, originalContent);
  });

  it('--force overwrites existing files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    const memDir = join(dir, 'zeus', 'memory');
    mkdirSync(memDir, { recursive: true });
    const snapPath = join(memDir, 'context-snapshot.json');
    writeFileSync(snapPath, '{"stale": true}');
    runScript(dir, ['--force']);
    const content = JSON.parse(readFileSync(snapPath, 'utf8'));
    assert.ok(content.git_hash);
  });
});
