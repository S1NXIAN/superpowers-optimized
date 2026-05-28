import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zeusPath = join(__dirname, '../../agent/zeus.md');
const content = readFileSync(zeusPath, 'utf-8');

describe('agent/zeus.md Structure', () => {
  describe('Complexity Classification', () => {
    it('Has Complexity Classification heading', () => assert.ok(content.includes('## Complexity Classification')));
    it('Has Fast Path / Full Path output format', () => assert.ok(content.includes('Classification: Fast Path')));
    it('Has file count heuristic (≤ 2 files)', () => assert.ok(content.includes('≤ 2')));
    it('Has T1/T2/T3 security trigger reference', () => assert.ok(content.includes('T1/T2/T3')));
    it('Has @quick override', () => assert.ok(content.includes('@quick')));
    it('Has @full override', () => assert.ok(content.includes('@full')));
  });

  describe('Fast Path Workflow', () => {
    it('Has Fast Path Workflow heading', () => assert.ok(content.includes('## Fast Path Workflow')));
    it('Fast Path skips brainstorming', () => assert.ok(content.includes('No brainstorming')));
    it('Fast Path runs TDD', () => assert.ok(content.includes('TDD')));
    it('Fast Path runs self-consistency verification', () => assert.ok(content.includes('Self-consistency')));
    it('Fast Path runs cleanup', () => assert.ok(content.includes('cleanup.mjs')));
  });

  describe('Full Path Workflow', () => {
    it('Full path has Brainstorming & Deliberation', () => assert.ok(content.includes('Brainstorming & Deliberation')));
    it('Full path has Security Triage (re-confirm)', () => assert.ok(content.includes('Security Triage (re-confirm)')));
    it('Full path has Writing Plans', () => assert.ok(content.includes('Writing Plans')));
    it('Full path has Sub-Agent Dispatch Contract', () => assert.ok(content.includes('Sub-Agent Dispatch Contract')));
    it('Full path has ASI Loop', () => assert.ok(content.includes('ASI Loop')));
    it('Full path has Verification & Self-Consistency', () => assert.ok(content.includes('Verification & Self-Consistency')));
    it('Full path has Review & Merge', () => assert.ok(content.includes('Review & Merge')));
    it('Full path has Cleanup stage', () => assert.ok(content.includes('Cleanup')));
  });

  describe('Skill References', () => {
    it('References deliberation-gate', () => assert.ok(content.includes('deliberation-gate')));
    it('References social-accountability', () => assert.ok(content.includes('social-accountability')));
    it('References asi-loop', () => assert.ok(content.includes('asi-loop')));
    it('References security-triage in dispatch' , () => assert.ok(content.includes('security-triage')));
    it('References sub-agent dispatch', () => assert.ok(content.includes('sub-agent') || content.includes('subagent')));
    it('References asi.sh for ASI Loop', () => assert.ok(content.includes('asi.sh')));
    it('References verify-hash.sh for security work', () => assert.ok(content.includes('verify-hash.sh')));
  });

  describe('Model Strategy', () => {
    it('Has model strategy section', () => assert.ok(content.includes('## Model Strategy')));
    it('References small_model', () => assert.ok(content.includes('small_model')));
  });

  describe('Core Constraints', () => {
    it('Has Core Constraints section', () => assert.ok(content.includes('## Core Constraints')));
    it('Evidence over claims', () => assert.ok(content.includes('Evidence over claims')));
    it('Security triage is hard-coded', () => assert.ok(content.includes('hard-coded')));
    it('Adapt process to complexity', () => assert.ok(content.includes('no unnecessary ceremony')));
  });
});
