import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zeusPath = join(__dirname, '../../agent/zeus.md');
const content = readFileSync(zeusPath, 'utf-8');

describe('agent/zeus.md Structure', () => {
  describe('Complexity Classification Section', () => {
    it('Has Complexity Classification heading', () => assert.ok(content.includes('### Complexity Classification')));
    it('Has Simple (fast path) signal table', () => assert.ok(content.includes('Simple (fast path)')));
    it('Has Complex (full path) signal table', () => assert.ok(content.includes('Complex (full path)')));
    it('Has file count heuristic (≤ 2 files)', () => assert.ok(content.includes('≤ 2')));
    it('Has T1-T3 mentioned (classification or triage)', () => assert.ok(content.includes('T1-T3')));
  });

  describe('Fast Path Section', () => {
    it('Has Fast Path workflow heading', () => assert.ok(content.includes('### Fast Path')));
    it('Fast Path skips brainstorming', () => assert.ok(content.includes('No brainstorming')));
    it('Fast Path still runs security triage', () => assert.ok(content.includes('security triage')));
    it('Fast Path still runs TDD', () => assert.ok(content.includes('RED → GREEN → REFACTOR') || content.includes('RED -> GREEN -> REFACTOR')));
    it('Fast Path still runs verification', () => assert.ok(content.includes('Verification')));
  });

  describe('Full Path Preservation', () => {
    it('Full path still has Brainstorming step', () => assert.ok(content.includes('Brainstorming')));
    it('Full path still has Mandatory Security Triage', () => assert.ok(content.includes('Mandatory Security Triage')));
    it('Full path still has Writing Plans', () => assert.ok(content.includes('Writing Plans')));
    it('Full path still has Subagent-Driven Development', () => assert.ok(content.includes('Subagent-Driven')));
    it('Full path still has ASI Loop', () => assert.ok(content.includes('ASI Loop')));
    it('Full path still has TDD Always', () => assert.ok(content.includes('TDD')));
    it('Full path still has Code Review', () => assert.ok(content.includes('Code Review')));
    it('Full path still has Verification', () => assert.ok(content.includes('Verification')));
    it('Full path still has Self-Consistency Reasoning', () => assert.ok(content.includes('Self-Consistency')));
  });

  describe('User Overrides', () => {
    it('Has @quick override', () => assert.ok(content.includes('@quick')));
    it('Has @full override', () => assert.ok(content.includes('@full')));
    it('Has No annotation default behavior', () => assert.ok(content.includes('Zeus decides')));
  });

  describe('Full Path Not Degraded', () => {
    it('Still references subagent dispatch', () => assert.ok(content.includes('subagent')));
    it('Still has deliberation gate trigger', () => assert.ok(content.includes('deliberation-gate')));
    it('Still references social-accountability', () => assert.ok(content.includes('social-accountability')));
  });
});
