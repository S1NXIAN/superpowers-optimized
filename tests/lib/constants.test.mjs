import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SKILLS_PATH, CONFIG_DIR, CONFIG_JSON_PATH,
  BACKUP_PARENT, FILE_COPIES, DIR_COPIES, MANAGED_FILES, MANAGED_DIRS,
} from '../../lib/constants.mjs';

describe('lib/constants', () => {
  it('exports SKILLS_PATH as a non-empty string', () => {
    assert.equal(typeof SKILLS_PATH, 'string');
    assert.ok(SKILLS_PATH.length > 0);
  });

  it('exports CONFIG_DIR as an absolute path containing opencode', () => {
    assert.equal(typeof CONFIG_DIR, 'string');
    assert.ok(CONFIG_DIR.startsWith('/') || CONFIG_DIR.match(/^[A-Z]:\\/));
    assert.ok(CONFIG_DIR.includes('opencode'));
  });

  it('exports CONFIG_JSON_PATH ending in opencode.json under CONFIG_DIR', () => {
    assert.ok(CONFIG_JSON_PATH.endsWith('opencode.json'));
    assert.ok(CONFIG_JSON_PATH.startsWith(CONFIG_DIR));
  });

  it('exports BACKUP_PARENT under CONFIG_DIR with .backups', () => {
    assert.ok(BACKUP_PARENT.startsWith(CONFIG_DIR));
    assert.ok(BACKUP_PARENT.includes('.backups'));
  });

  it('exports FILE_COPIES as array with repoRel, configRel, executable properties', () => {
    assert.ok(Array.isArray(FILE_COPIES));
    assert.ok(FILE_COPIES.length > 0);
    for (const entry of FILE_COPIES) {
      assert.equal(typeof entry.repoRel, 'string');
      assert.equal(typeof entry.configRel, 'string');
      assert.equal(typeof entry.executable, 'boolean');
    }
  });

  it('exports DIR_COPIES as array with repoRel, configRel properties', () => {
    assert.ok(Array.isArray(DIR_COPIES));
    assert.ok(DIR_COPIES.length > 0);
    for (const entry of DIR_COPIES) {
      assert.equal(typeof entry.repoRel, 'string');
      assert.equal(typeof entry.configRel, 'string');
    }
  });

  it('exports MANAGED_FILES as non-empty string array', () => {
    assert.ok(Array.isArray(MANAGED_FILES));
    assert.ok(MANAGED_FILES.length > 0);
    for (const entry of MANAGED_FILES) assert.equal(typeof entry, 'string');
  });

  it('exports MANAGED_DIRS as non-empty string array', () => {
    assert.ok(Array.isArray(MANAGED_DIRS));
    assert.ok(MANAGED_DIRS.length > 0);
    for (const entry of MANAGED_DIRS) assert.equal(typeof entry, 'string');
  });

  it('MANAGED_FILES matches FILE_COPIES configRel values', () => {
    const configRels = FILE_COPIES.map(fc => fc.configRel);
    for (const managed of MANAGED_FILES) {
      assert.ok(configRels.includes(managed), `${managed} not in FILE_COPIES`);
    }
  });

  it('MANAGED_DIRS matches DIR_COPIES configRel values', () => {
    const configRels = DIR_COPIES.map(dc => dc.configRel);
    for (const managed of MANAGED_DIRS) {
      assert.ok(configRels.includes(managed), `${managed} not in DIR_COPIES`);
    }
  });
});
