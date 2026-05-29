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

  it('generates project-map.md in zeus/memory/', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    runScript(dir);
    const mapPath = join(dir, 'zeus', 'memory', 'project-map.md');
    assert.ok(existsSync(mapPath));
    const content = readFileSync(mapPath, 'utf8');
    assert.ok(content.includes('# Project Map'));
    assert.ok(content.includes('## Directory Structure'));
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
    const mapPath = join(memDir, 'project-map.md');
    const originalContent = '# Custom map\n';
    writeFileSync(mapPath, originalContent);
    runScript(dir);
    const content = readFileSync(mapPath, 'utf8');
    assert.equal(content, originalContent);
  });

  it('--force overwrites existing files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'init-test-'));
    createGitRepo(dir);
    const memDir = join(dir, 'zeus', 'memory');
    mkdirSync(memDir, { recursive: true });
    const mapPath = join(memDir, 'project-map.md');
    writeFileSync(mapPath, '# Stale map\n');
    runScript(dir, ['--force']);
    const content = readFileSync(mapPath, 'utf8');
    assert.ok(content.includes('# Project Map'));
  });
});
