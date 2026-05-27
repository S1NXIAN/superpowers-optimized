import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..', '..');

describe('CLI Integration', () => {
  it('setup.mjs --help executes without error', () => {
    const out = execSync('node setup.mjs --help', { cwd: REPO_DIR, encoding: 'utf8' });
    assert.ok(out.includes('Superpowers Enhanced'));
    assert.ok(out.includes('Usage:'));
  });

  it('setup.mjs --dry-run executes without error', () => {
    const out = execSync('node setup.mjs --dry-run', { cwd: REPO_DIR, encoding: 'utf8' });
    assert.ok(out.includes('Dry run complete.'));
  });

  it('uninstall.mjs --help executes without error', () => {
    const out = execSync('node uninstall.mjs --help', { cwd: REPO_DIR, encoding: 'utf8' });
    assert.ok(out.includes('Superpowers Enhanced'));
    assert.ok(out.includes('Usage:'));
  });

  it('uninstall.mjs --dry-run executes without error', () => {
    const out = execSync('node uninstall.mjs --dry-run', { cwd: REPO_DIR, encoding: 'utf8' });
    assert.ok(out.includes('Dry run complete.'));
  });
});
