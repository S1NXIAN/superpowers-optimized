import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { isMapStale, generateMap, truncateMap, parseMapHash } from '../../lib/project-map.mjs';

function createGitRepo(dir) {
  execSync('git init', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email test@test.com', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name Test', { cwd: dir, stdio: 'pipe' });
  writeFileSync(join(dir, 'README.md'), '# test');
  execSync('git add . && git commit -m "init"', { cwd: dir, stdio: 'pipe' });
}

describe('lib/project-map', () => {
  describe('parseMapHash()', () => {
    it('extracts git hash from map header', () => {
      const result = parseMapHash('# Project Map\nGenerated: today | Git: a4b9c2d\n');
      assert.equal(result, 'a4b9c2d');
    });

    it('returns null if no hash present', () => {
      const result = parseMapHash('# Project Map\nNo hash here\n');
      assert.equal(result, null);
    });

    it('returns null for empty content', () => {
      assert.equal(parseMapHash(''), null);
    });

    it('extracts hash from full format', () => {
      const result = parseMapHash('Generated: 2026-05-28 | Git: abc1234def\n');
      assert.equal(result, 'abc1234def');
    });
  });

  describe('isMapStale()', () => {
    it('returns false when git hashes match', () => {
      const dir = mkdtempSync(join(tmpdir(), 'map-test-'));
      createGitRepo(dir);
      const hash = execSync('git rev-parse HEAD', { cwd: dir }).toString().trim();
      assert.equal(isMapStale(dir, hash), false);
    });

    it('returns true when git hashes differ', () => {
      const dir = mkdtempSync(join(tmpdir(), 'map-test-'));
      createGitRepo(dir);
      assert.equal(isMapStale(dir, 'deadbeef'), true);
    });

    it('returns true in non-git directory', () => {
      const dir = mkdtempSync(join(tmpdir(), 'map-test-'));
      assert.equal(isMapStale(dir, 'abc123'), true);
    });
  });

  describe('truncateMap()', () => {
    it('returns full content when under limit', () => {
      const result = truncateMap('short content', 100);
      assert.equal(result, 'short content');
    });

    it('truncates to Hot Files + Critical Constraints when over limit', () => {
      const lines = [];
      lines.push('# Project Map');
      lines.push('## Directory Structure');
      for (let i = 0; i < 30; i++) lines.push(`dir${i}/`);
      lines.push('## Hot Files');
      lines.push('src/main.js — main entry');
      lines.push('src/lib.js — library');
      lines.push('## Critical Constraints');
      lines.push('Rule 1: no direct SQL');
      lines.push('Rule 2: use env vars');
      const content = lines.join('\n');
      const result = truncateMap(content, 10);
      assert.ok(result.includes('Hot Files'));
      assert.ok(result.includes('Critical Constraints'));
      assert.ok(result.includes('(Full map'));
      assert.ok(result.length < content.length);
    });
  });

  describe('generateMap()', () => {
    it('returns markdown with expected sections', () => {
      const dir = mkdtempSync(join(tmpdir(), 'map-test-'));
      createGitRepo(dir);
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test' }));
      mkdirSync(join(dir, 'src', 'lib'), { recursive: true });
      writeFileSync(join(dir, 'src', 'index.js'), '// entry point');
      writeFileSync(join(dir, 'src', 'lib', 'helper.js'), '// helper');
      mkdirSync(join(dir, 'tests'), { recursive: true });
      writeFileSync(join(dir, 'tests', 'test.js'), '// test');
      const result = generateMap(dir);
      assert.ok(result.includes('Project Map'));
      assert.ok(result.includes('Directory Structure'));
      assert.ok(result.includes('Key Files'));
      assert.ok(result.includes('Critical Constraints'));
      assert.ok(result.match(/Git: [a-f0-9]+/));
    });
  });
});
