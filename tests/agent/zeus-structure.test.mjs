import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zeusPath = join(__dirname, '../../agent/zeus.md');
const fastPathSkillPath = join(__dirname, '../../skills/zeus/fast-path/SKILL.md');
const fullPathSkillPath = join(__dirname, '../../skills/zeus/full-path/SKILL.md');

const zeusContent = readFileSync(zeusPath, 'utf-8');
const fastPathContent = readFileSync(fastPathSkillPath, 'utf-8');
const fullPathContent = readFileSync(fullPathSkillPath, 'utf-8');

describe('Zeus 2.0 Modular Architecture', () => {
  describe('agent/zeus.md (Router)', () => {
    describe('Complexity Classification', () => {
      it('Has Complexity Classification heading', () => assert.ok(zeusContent.includes('## Complexity Classification')));
      it('Has Fast Path / Full Path output format', () => assert.ok(zeusContent.includes('Classification: Fast Path')));
      it('Has file count heuristic (≤ 2 files)', () => assert.ok(zeusContent.includes('≤ 2')));
      it('Has security-scan.mjs reference', () => assert.ok(zeusContent.includes('security-scan.mjs')));
      it('Has @quick override', () => assert.ok(zeusContent.includes('@quick')));
      it('Has @full override', () => assert.ok(zeusContent.includes('@full')));
      it('Invokes security-triage skill on match', () => assert.ok(zeusContent.includes('invoke `security-triage` skill')));
    });

    describe('Workflow Handoff', () => {
      it('Has Workflow Handoff heading', () => assert.ok(zeusContent.includes('## Workflow Handoff')));
      it('Handoffs to fast-path skill', () => assert.ok(zeusContent.includes('skill("zeus/fast-path")')));
      it('Handoffs to full-path skill', () => assert.ok(zeusContent.includes('skill("zeus/full-path")')));
    });

    describe('Model Strategy', () => {
      it('Has model strategy section', () => assert.ok(zeusContent.includes('## Model Strategy')));
      it('References small_model', () => assert.ok(zeusContent.includes('small_model')));
      it('Uses full reasoning for full path planning', () => assert.ok(zeusContent.includes('full reasoning')));
    });

    describe('Core Constraints', () => {
      it('Has Core Constraints section', () => assert.ok(zeusContent.includes('## Core Constraints')));
      it('Evidence over claims', () => assert.ok(zeusContent.includes('Evidence over claims')));
      it('Security triage is hard-coded', () => assert.ok(zeusContent.includes('hard-coded')));
      it('Command guard reference', () => assert.ok(zeusContent.includes('command-guard.mjs')));
    });
  });

  describe('skills/zeus/fast-path/SKILL.md', () => {
    it('Has Fast Path Workflow heading', () => assert.ok(fastPathContent.includes('# Fast Path Workflow')));
    it('Fast Path skips brainstorming', () => assert.ok(fastPathContent.includes('No brainstorming')));
    it('Fast Path runs TDD', () => assert.ok(fastPathContent.includes('TDD')));
    it('Fast Path runs self-consistency verification', () => assert.ok(fastPathContent.includes('Self-consistency')));
    it('Fast Path runs cleanup', () => assert.ok(fastPathContent.includes('cleanup.mjs')));
  });

  describe('skills/zeus/full-path/SKILL.md', () => {
    it('Has Full Path Workflow heading', () => assert.ok(fullPathContent.includes('# Full Path Workflow')));
    it('Phase 1: Premise Check', () => assert.ok(fullPathContent.includes('Phase 1: Premise Check')));
    it('Phase 2: Specialized Audit (architect/hacker)', () => assert.ok(fullPathContent.includes('architect') && fullPathContent.includes('hacker')));
    it('Phase 3: Brainstorming', () => assert.ok(fullPathContent.includes('Phase 3: Brainstorming')));
    it('Phase 4: Writing Plans (qa-pro)', () => assert.ok(fullPathContent.includes('Phase 4: Writing Plans') && fullPathContent.includes('qa-pro')));
    it('Phase 5: SDD (Parallel Waves)', () => assert.ok(fullPathContent.includes('Phase 5: SDD')));
    it('Phase 6: Verification & Self-Consistency', () => assert.ok(fullPathContent.includes('Phase 6: Verification & Self-Consistency')));
    it('Phase 7: Review & Merge', () => assert.ok(fullPathContent.includes('Phase 7: Review & Merge')));
    it('Phase 8: Cleanup', () => assert.ok(fullPathContent.includes('Phase 8: Cleanup')));
  });
});
