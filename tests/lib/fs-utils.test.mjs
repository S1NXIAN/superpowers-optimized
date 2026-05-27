import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync, lstatSync, symlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  readJson,
  writeJson,
  copyFileChecked,
  copyDirRecursive,
  copyDir,
  backupFile,
  backupDirContent,
  ensureBackupDir,
  removeFile,
  removeDir,
  removeEmptyAncestors,
  gitAvailable,
  getGitDiff
} from '../../lib/fs-utils.mjs';

describe('lib/fs-utils', () => {
  let tempDir;

  beforeEach(async () => {
    const baseDir = await fs.realpath(tmpdir());
    tempDir = await fs.mkdtemp(join(baseDir, 'opencode-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('JSON utilities', () => {
    it('readJson returns parsed JSON for valid file', () => {
      const p = join(tempDir, 'valid.json');
      writeFileSync(p, JSON.stringify({ a: 1 }));
      const res = readJson(p);
      assert.deepEqual(res, { a: 1 });
    });

    it('readJson returns null for missing file', () => {
      const res = readJson(join(tempDir, 'missing.json'));
      assert.equal(res, null);
    });

    it('readJson returns null for invalid JSON', () => {
      const p = join(tempDir, 'invalid.json');
      writeFileSync(p, '{ invalid }');
      const res = readJson(p);
      assert.equal(res, null);
    });

    it('writeJson writes formatted JSON', () => {
      const p = join(tempDir, 'write.json');
      writeJson(p, { b: 2 });
      const raw = readFileSync(p, 'utf8');
      assert.equal(raw, '{\n  "b": 2\n}\n');
    });

    it('readJson / writeJson roundtrip', () => {
      const p = join(tempDir, 'rt.json');
      const data = { c: [1, 2, 3] };
      writeJson(p, data);
      const res = readJson(p);
      assert.deepEqual(res, data);
    });
  });

  describe('File/Dir copying', () => {
    it('copyFileChecked copies file', () => {
      const src = join(tempDir, 'src.txt');
      const dest = join(tempDir, 'dest.txt');
      writeFileSync(src, 'hello');
      const success = copyFileChecked(src, dest, {});
      assert.equal(success, true);
      assert.equal(readFileSync(dest, 'utf8'), 'hello');
    });

    it('copyFileChecked replaces symlinks', () => {
      const src = join(tempDir, 'src.txt');
      const dest = join(tempDir, 'dest.txt');
      writeFileSync(src, 'hello');
      // Create a dummy symlink at dest
      const dummyTarget = join(tempDir, 'dummy.txt');
      writeFileSync(dummyTarget, 'dummy');
      symlinkSync(dummyTarget, dest);

      assert.equal(lstatSync(dest).isSymbolicLink(), true);
      const success = copyFileChecked(src, dest, {});
      assert.equal(success, true);
      assert.equal(lstatSync(dest).isSymbolicLink(), false);
      assert.equal(readFileSync(dest, 'utf8'), 'hello');
    });

    it('copyFileChecked respects dryRun', () => {
      const src = join(tempDir, 'src.txt');
      const dest = join(tempDir, 'dest.txt');
      writeFileSync(src, 'hello');
      const success = copyFileChecked(src, dest, { dryRun: true });
      assert.equal(success, false);
      assert.equal(existsSync(dest), false);
    });

    it('copyDirRecursive copies nested directory', () => {
      const src = join(tempDir, 'src');
      const dest = join(tempDir, 'dest');
      mkdirSync(join(src, 'sub'), { recursive: true });
      writeFileSync(join(src, 'file.txt'), 'f1');
      writeFileSync(join(src, 'sub', 'file2.txt'), 'f2');

      copyDirRecursive(src, dest);

      assert.equal(readFileSync(join(dest, 'file.txt'), 'utf8'), 'f1');
      assert.equal(readFileSync(join(dest, 'sub', 'file2.txt'), 'utf8'), 'f2');
    });

    it('copyDir returns true when dir copied', () => {
      const src = join(tempDir, 'src');
      const dest = join(tempDir, 'dest');
      mkdirSync(src);
      writeFileSync(join(src, 'file.txt'), 'f1');

      const success = copyDir(src, dest, {});
      assert.equal(success, true);
      assert.equal(existsSync(join(dest, 'file.txt')), true);
    });
  });

  describe('Backups', () => {
    it('ensureBackupDir creates and returns timestamped dir', () => {
      const parent = join(tempDir, '.backups');
      const res = ensureBackupDir(parent);
      assert.ok(res.startsWith(parent));
      assert.equal(existsSync(res), true);
      // second call returns same dir
      const res2 = ensureBackupDir(parent);
      assert.equal(res, res2);
    });

    it('backupFile creates backup', () => {
      const configDir = join(tempDir, 'config');
      const backupDir = join(tempDir, 'backup');
      mkdirSync(configDir);
      mkdirSync(backupDir);
      
      const rel = 'test.txt';
      writeFileSync(join(configDir, rel), 'content');
      
      backupFile(rel, configDir, backupDir);
      assert.equal(readFileSync(join(backupDir, rel), 'utf8'), 'content');
    });

    it('backupDirContent backs up directory', () => {
      const configDir = join(tempDir, 'config');
      const backupDir = join(tempDir, 'backup');
      const rel = 'dir';
      const src = join(configDir, rel);
      mkdirSync(join(src, 'sub'), { recursive: true });
      writeFileSync(join(src, 'sub', 'file.txt'), 'content');
      mkdirSync(backupDir);

      backupDirContent(rel, configDir, backupDir);
      assert.equal(readFileSync(join(backupDir, rel, 'sub', 'file.txt'), 'utf8'), 'content');
    });
  });

  describe('Removals', () => {
    it('removeFile removes file and cleans empty ancestors', () => {
      const configDir = join(tempDir, 'config');
      const rel = 'a/b/c.txt';
      const dest = join(configDir, rel);
      mkdirSync(join(configDir, 'a/b'), { recursive: true });
      writeFileSync(dest, 'content');

      removeFile(rel, configDir);
      
      assert.equal(existsSync(dest), false);
      assert.equal(existsSync(join(configDir, 'a/b')), false);
      assert.equal(existsSync(join(configDir, 'a')), false);
      assert.equal(existsSync(configDir), true); // stops at boundary
    });

    it('removeDir removes dir recursively and cleans ancestors', () => {
      const configDir = join(tempDir, 'config');
      const rel = 'a/b';
      const dest = join(configDir, rel);
      mkdirSync(join(dest, 'c'), { recursive: true });
      writeFileSync(join(dest, 'c/test.txt'), 'content');

      removeDir(rel, configDir);

      assert.equal(existsSync(dest), false);
      assert.equal(existsSync(join(configDir, 'a')), false);
    });

    it('removeEmptyAncestors stops at non-empty dir', () => {
      const boundaryDir = join(tempDir, 'boundary');
      const rel = 'a/b/c';
      const target = join(boundaryDir, rel);
      mkdirSync(target, { recursive: true });
      writeFileSync(join(boundaryDir, 'a/keep.txt'), 'keep'); // makes 'a' non-empty

      rmSync(target, { recursive: true, force: true });
      removeEmptyAncestors(target, boundaryDir);
      
      assert.equal(existsSync(join(boundaryDir, 'a/b')), false);
      assert.equal(existsSync(join(boundaryDir, 'a/keep.txt')), true);
    });
  });

  describe('Git utils', () => {
    it('gitAvailable returns boolean', () => {
      assert.equal(typeof gitAvailable(), 'boolean');
    });

    it('getGitDiff handles missing files', () => {
      const diff = getGitDiff(join(tempDir, 'a'), join(tempDir, 'b'));
      assert.equal(diff, null);
    });
  });
});
