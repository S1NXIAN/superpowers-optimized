import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const BIN = new URL('../../bin/security-scan.mjs', import.meta.url).pathname;
const PATTERNS_DIR = new URL('../../skills/security-triage/patterns', import.meta.url).pathname;

function runScan(files, args = []) {
  return execSync(
    `node ${BIN} ${files.join(' ')} ${args.join(' ')}`,
    { encoding: 'utf8', stdio: 'pipe' }
  );
}

function makeTempFile(dir, name, content) {
  const p = join(dir, name);
  mkdirSync(join(dir, ...name.split('/').slice(0, -1)), { recursive: true });
  writeFileSync(p, content);
  return p;
}

describe('bin/security-scan', () => {
  describe('T1 — path pattern matching', () => {
    it('detects auth* pattern in file path', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'src/auth/login.js', 'module.exports = {};');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T1' && m.pattern === 'auth*'));
    });

    it('detects *.pem pattern by extension', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'cert.pem', '---BEGIN CERT---');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T1' && m.pattern === '*.pem'));
    });

    it('does not flag docs/ as T1 (explicit non-match)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'docs/auth.md', '# auth docs');
      const out = JSON.parse(runScan([f]));
      assert.equal(out.some(m => m.tier === 'T1'), false);
    });

    it('does not flag tests/ as T1 (explicit non-match)', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'tests/auth.test.js', '// test');
      const out = JSON.parse(runScan([f]));
      assert.equal(out.some(m => m.tier === 'T1'), false);
    });

    it('flags multiple files with different T1 patterns', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f1 = makeTempFile(dir, 'crypto/rsa.js', '');
      const f2 = makeTempFile(dir, 'nginx.conf', '');
      const f3 = makeTempFile(dir, 'deploy/prod.sh', '');
      const out = JSON.parse(runScan([f1, f2, f3]));
      const t1 = out.filter(m => m.tier === 'T1');
      assert.ok(t1.length >= 2);
    });
  });

  describe('T2 — content pattern matching', () => {
    it('detects SECRET_KEY in file content', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, '.env', 'SECRET_KEY=abc123');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T2' && m.pattern === 'SECRET_KEY'));
    });

    it('detects eval( in JS file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'src/danger.js', 'const x = eval(code);');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T2' && m.pattern === 'eval('));
    });

    it('detects JS-specific pattern in .js file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'src/route.js', "import jwt from 'jsonwebtoken';");
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T2' && m.pattern.includes('jsonwebtoken')));
    });

    it('returns empty for clean file', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'src/hello.js', 'const x = 42;\nmodule.exports = x;\n');
      const out = JSON.parse(runScan([f]));
      const t2 = out.filter(m => m.tier === 'T2');
      assert.equal(t2.length, 0);
    });
  });

  describe('T3 — directory matching', () => {
    it('detects auth/ directory pattern', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'auth/middleware.js', 'module.exports = {};');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T3' && m.pattern === 'auth/'));
    });

    it('detects security/ directory pattern', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'security/firewall.js', '');
      const out = JSON.parse(runScan([f]));
      assert.ok(out.some(m => m.tier === 'T3'));
    });
  });

  describe('CLI behavior', () => {
    it('outputs valid JSON array', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const f = makeTempFile(dir, 'safe.js', 'const x = 1;');
      const out = runScan([f]);
      const parsed = JSON.parse(out);
      assert.ok(Array.isArray(parsed));
    });

    it('--help prints usage', () => {
      const dir = mkdtempSync(join(tmpdir(), 'scan-test-'));
      const out = execSync(`node ${BIN} --help`, { cwd: dir, encoding: 'utf8' });
      assert.ok(out.includes('security-scan'));
    });
  });
});
