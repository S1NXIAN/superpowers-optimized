import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { findMatchingEntry } from '../../lib/known-issues.mjs';

function makeFixture(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'known-issues-test-'));
  const path = join(dir, 'known-issues.md');
  writeFileSync(path, contents);
  return path;
}

const FIXTURE = `## Cannot read properties of undefined (reading 'name')

**Error:** \`TypeError: Cannot read properties of undefined (reading 'name')\` at src/routes/users.js:42
**Root cause:** User object destructured before optional chaining
**Fix:** Add optional chaining: \`user?.name ?? 'Guest'\`
**First seen:** 2026-05-22

## Database timeout

**Error:** \`SequelizeConnectionError: connect ETIMEDOUT\`
**Root cause:** PostgreSQL pool max_connections too low
**Fix:** Increase pool max to 20
**First seen:** 2026-05-20
`;

describe('lib/known-issues', () => {
  it('finds matching entry by title keyword overlap', () => {
    const path = makeFixture(FIXTURE);
    const result = findMatchingEntry(path, 'Cannot read properties of undefined');
    assert.ok(result);
    assert.equal(result.title, 'Cannot read properties of undefined (reading \'name\')');
    assert.ok(result.fix.includes('optional chaining'));
  });

  it('returns null for non-matching error', () => {
    const path = makeFixture(FIXTURE);
    const result = findMatchingEntry(path, 'Disk quota exceeded');
    assert.equal(result, null);
  });

  it('handles empty file gracefully', () => {
    const path = makeFixture('');
    const result = findMatchingEntry(path, 'some error');
    assert.equal(result, null);
  });

  it('handles missing file gracefully', () => {
    const result = findMatchingEntry('/nonexistent/path.md', 'error');
    assert.equal(result, null);
  });

  it('finds match by error message substring match when title match fails', () => {
    const path = makeFixture(FIXTURE);
    const result = findMatchingEntry(path, 'connect ETIMEDOUT');
    assert.ok(result);
    assert.equal(result.title, 'Database timeout');
  });

  it('parses all expected fields from entry', () => {
    const path = makeFixture(FIXTURE);
    const result = findMatchingEntry(path, 'Cannot read properties');
    assert.ok(result);
    assert.ok(result.rootCause);
    assert.ok(result.fix);
    assert.ok(result.firstSeen);
  });

  it('extracts context field when present', () => {
    const path = makeFixture(FIXTURE + '\n## Extra issue\n\n**Error:** test\n**Root cause:** test\n**Fix:** test\n**Context:** only in prod\n**First seen:** today\n');
    const result = findMatchingEntry(path, 'Extra issue');
    assert.equal(result.context, 'only in prod');
  });
});
