import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkCommand, PATTERNS } from '../../lib/command-guard.mjs';

describe('lib/command-guard', () => {
  describe('PATTERNS exports', () => {
    it('exports CRITICAL, DANGEROUS, SUSPICIOUS arrays', () => {
      assert.ok(Array.isArray(PATTERNS.CRITICAL));
      assert.ok(PATTERNS.CRITICAL.length >= 3);
      assert.ok(Array.isArray(PATTERNS.DANGEROUS));
      assert.ok(PATTERNS.DANGEROUS.length >= 2);
      assert.ok(Array.isArray(PATTERNS.SUSPICIOUS));
      assert.ok(PATTERNS.SUSPICIOUS.length >= 2);
    });

    it('all patterns are valid RegExp objects', () => {
      for (const tier of Object.values(PATTERNS)) {
        for (const p of tier) {
          assert.ok(p instanceof RegExp, `Pattern ${p} is not a RegExp`);
        }
      }
    });
  });

  describe('checkCommand()', () => {
    it('returns null for safe commands', () => {
      assert.equal(checkCommand('ls -la'), null);
      assert.equal(checkCommand('npm test'), null);
      assert.equal(checkCommand('git status'), null);
      assert.equal(checkCommand('node server.js'), null);
    });

    it('returns CRITICAL match for rm -rf /', () => {
      const result = checkCommand('rm -rf /');
      assert.equal(result.severity, 'CRITICAL');
      assert.ok(result.message.includes('rm'));
    });

    it('returns CRITICAL match for git push --force', () => {
      const result = checkCommand('git push --force origin main');
      assert.equal(result.severity, 'CRITICAL');
    });

    it('returns CRITICAL match for rm -rf $HOME', () => {
      const result = checkCommand('rm -rf $HOME/something');
      assert.equal(result.severity, 'CRITICAL');
    });

    it('returns DANGEROUS match for drop table', () => {
      const result = checkCommand('drop table users');
      assert.equal(result.severity, 'DANGEROUS');
    });

    it('returns SUSPICIOUS match for sudo on unusual command', () => {
      const result = checkCommand('sudo rm node_modules');
      assert.equal(result.severity, 'SUSPICIOUS');
    });

    it('respects DANGEROUS_CMD_ACCEPTED override for CRITICAL commands', () => {
      const result = checkCommand('DANGEROUS_CMD_ACCEPTED=true rm -rf /tmp');
      assert.equal(result, null);
    });

    it('reports which pattern was matched', () => {
      const result = checkCommand('rm -rf /');
      assert.ok(result.match);
      assert.ok(result.match instanceof RegExp);
    });
  });
});
