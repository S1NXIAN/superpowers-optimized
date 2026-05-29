import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zeusPath = join(__dirname, '../../agents/zeus.md');
const fastPathPath = join(__dirname, '../../skills/zeus/fast-path/SKILL.md');
const fullPathPath = join(__dirname, '../../skills/zeus/full-path/SKILL.md');

const zeusContent = readFileSync(zeusPath, 'utf-8');
const fastPathContent = readFileSync(fastPathPath, 'utf-8');
const fullPathContent = readFileSync(fullPathPath, 'utf-8');

describe('Zeus 2.0 Elite Modular Architecture', () => {
  describe('agents/zeus.md (Router)', () => {
    describe('Complexity Classification', () => {
      it('Has Complexity Classification heading', () => assert.ok(zeusContent.includes('## Complexity Classification')));
      it('Has classification output format', () => assert.ok(zeusContent.includes('Classification: [Path] [Reasoning]')));
      it('Has file count heuristic (≤ 2 files)', () => assert.ok(zeusContent.includes('&le; 2')));
      it('Has security-scan.mjs reference', () => assert.ok(zeusContent.includes('security-scan.mjs')));
      it('Has @quick override', () => assert.ok(zeusContent.includes('@quick')));
      it('Has @full override', () => assert.ok(zeusContent.includes('@full')));
    });

    describe('Workflow Handoff', () => {
      it('Has Workflow Handoff heading', () => assert.ok(zeusContent.includes('## Workflow Handoff')));
      it('Handoffs to fast-path skill', () => assert.ok(zeusContent.includes('skill("zeus/fast-path")')));
      it('Handoffs to full-path skill', () => assert.ok(zeusContent.includes('skill("zeus/full-path")')));
    });

    describe('Strike Team Dispatch', () => {
      it('Has Strike Team section', () => assert.ok(zeusContent.includes('Strike Team Dispatch')));
      it('References subagents by process names', () => {
        assert.ok(zeusContent.includes('@security-audit'));
        assert.ok(zeusContent.includes('@structure-review'));
        assert.ok(zeusContent.includes('@verification'));
        assert.ok(zeusContent.includes('@code-cleanup'));
      });
      it('Uses token-efficiency at session start', () => assert.ok(zeusContent.includes('Invoke `token-efficiency` at session start')));
    });

    describe('Model Strategy', () => {
      it('Has model strategy section', () => assert.ok(zeusContent.includes('## Model Strategy')));
      it('References small_model', () => assert.ok(zeusContent.includes('small_model')));
      it('Uses full reasoning for planning', () => assert.ok(zeusContent.includes('Full Reasoning')));
    });

    describe('Operational Standards', () => {
      it('Has Operational Standards section', () => assert.ok(zeusContent.includes('## Operational Standards')));
      it('Extreme SNR', () => assert.ok(zeusContent.includes('Extreme SNR')));
      it('Evidence-First', () => assert.ok(zeusContent.includes('Evidence-First')));
    });
  });

  describe('skills/zeus/fast-path/SKILL.md', () => {
    it('Has Fast Path Workflow heading', () => assert.ok(fastPathContent.includes('# Fast Path Workflow')));
    it('Requires TDD skill', () => assert.ok(fastPathContent.includes('test-driven-development')));
    it('Fast Path runs self-consistency verification', () => assert.ok(fastPathContent.includes('Self-Consistency Verification')));
    it('Fast Path runs cleanup', () => assert.ok(fastPathContent.includes('cleanup.mjs')));
  });

  describe('skills/zeus/full-path/SKILL.md', () => {
    it('Has Full Path Workflow heading', () => assert.ok(fullPathContent.includes('# Full Path Workflow')));
    it('Phase 1: Premise Check', () => assert.ok(fullPathContent.includes('Phase 1: Premise Check')));
    it('Phase 2: Specialized Team Audit', () => assert.ok(fullPathContent.includes('Phase 2: Specialized Team Audit')));
    it('Phase 3: Brainstorming', () => assert.ok(fullPathContent.includes('Phase 3: Brainstorming')));
    it('Phase 4: Implementation Planning', () => assert.ok(fullPathContent.includes('Phase 4: Implementation Planning')));
    it('Phase 5: Parallel SDD Execution', () => assert.ok(fullPathContent.includes('Phase 5: Parallel SDD Execution')));
    it('Phase 6: Verification & Self-Consistency', () => assert.ok(fullPathContent.includes('Phase 6: Verification & Self-Consistency')));
    it('Phase 7: Review, Merge & Branch Finalization', () => assert.ok(fullPathContent.includes('Phase 7: Review, Merge & Branch Finalization')));
    it('Phase 8: Automated Cleanup', () => assert.ok(fullPathContent.includes('Phase 8: Automated Cleanup')));
  });
});
