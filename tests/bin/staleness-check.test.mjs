import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createGitRepo, ensureMemDir } from '../helpers.mjs';

const BIN = new URL('../../bin/staleness-check.mjs', import.meta.url).pathname;

function run(dir, args = []) {
  return execSync(`node ${BIN} ${args.join(' ')}`, {
    cwd: dir,
    encoding: 'utf8',
  }).trim();
}

describe('bin/staleness-check', () => {
  it('returns FRESH when both snapshot and map are current', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    createGitRepo(dir, true);
    const mem = ensureMemDir(dir);
    // Write fresh snapshot and map
    const hash = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    writeFileSync(join(mem, 'context-snapshot.json'), JSON.stringify({
      git_hash: hash, changed_files: [], blast_radius: {}, generated: new Date().toISOString(),
    }));
    writeFileSync(join(mem, 'project-map.md'), `# Project Map\nGenerated: today | Git: ${hash}`);
    assert.equal(run(dir), 'FRESH');
  });

  it('returns SNAPSHOT_STALE when snapshot hash mismatches HEAD', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    createGitRepo(dir, true);
    const mem = ensureMemDir(dir);
    writeFileSync(join(mem, 'context-snapshot.json'), JSON.stringify({
      git_hash: 'deadbeef', changed_files: [], blast_radius: {}, generated: '',
    }));
    writeFileSync(join(mem, 'project-map.md'), `# Project Map\nGenerated: today | Git: ` +
      execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim());
    const out = run(dir);
    assert.ok(out.startsWith('SNAPSHOT_STALE'));
  });

  it('returns MAP_STALE when map hash mismatches HEAD', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    createGitRepo(dir, true);
    const mem = ensureMemDir(dir);
    const hash = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    writeFileSync(join(mem, 'context-snapshot.json'), JSON.stringify({
      git_hash: hash, changed_files: [], blast_radius: {}, generated: '',
    }));
    writeFileSync(join(mem, 'project-map.md'), `# Project Map\nGenerated: today | Git: deadbeef`);
    const out = run(dir);
    assert.ok(out.startsWith('MAP_STALE'));
  });

  it('returns SNAPSHOT_MISSING when no snapshot file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    createGitRepo(dir, true);
    const mem = ensureMemDir(dir);
    writeFileSync(join(mem, 'project-map.md'), `# Project Map\nGenerated: today | Git: ` +
      execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim());
    assert.equal(run(dir), 'SNAPSHOT_MISSING');
  });

  it('returns MAP_MISSING when no map file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    createGitRepo(dir, true);
    const mem = ensureMemDir(dir);
    const hash = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
    writeFileSync(join(mem, 'context-snapshot.json'), JSON.stringify({
      git_hash: hash, changed_files: [], blast_radius: {}, generated: '',
    }));
    assert.equal(run(dir), 'MAP_MISSING');
  });

  it('returns NO_GIT when not a git repo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    const mem = ensureMemDir(dir);
    writeFileSync(join(mem, 'context-snapshot.json'), JSON.stringify({
      git_hash: 'no-git', changed_files: [], blast_radius: {}, generated: '',
    }));
    writeFileSync(join(mem, 'project-map.md'), '# Project Map\nGenerated: today | Git: no-git');
    assert.equal(run(dir), 'NO_GIT');
  });

  it('--help prints usage', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-test-'));
    const out = execSync(`node ${BIN} --help`, { cwd: dir, encoding: 'utf8' });
    assert.ok(out.includes('staleness'));
  });
});
