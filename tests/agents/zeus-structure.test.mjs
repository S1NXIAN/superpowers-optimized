import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zeusPath = join(__dirname, '../../agents/zeus.md');

const zeusContent = readFileSync(zeusPath, 'utf-8');

describe('Zeus Elite Architecture', () => {
  describe('agents/zeus.md (Orchestrator)', () => {
    describe('Operational Standards', () => {
      it('Has Operational Standards section', () => assert.ok(zeusContent.includes('## Operational Standards')));
      it('Has token-efficiency invocation', () => assert.ok(zeusContent.includes('Invoke `token-efficiency`')));
      it('Has evidence-first rule', () => assert.ok(zeusContent.includes('Evidence-First')));
    });

    describe('Intent Gate', () => {
      it('Has Intent Gate section', () => assert.ok(zeusContent.includes('Intent Gate')));
      it('Handles non-tasks naturally', () => assert.ok(zeusContent.includes('not a task')));
    });

    describe('Skill Selection', () => {
      it('Has Skill Selection section', () => assert.ok(zeusContent.includes('Skill Selection')));
      it('References available_skills', () => assert.ok(zeusContent.includes('available_skills')));
      it('Has @quick hint', () => assert.ok(zeusContent.includes('@quick')));
      it('Has @full hint', () => assert.ok(zeusContent.includes('@full')));
    });

    describe('Security Triage', () => {
      it('Has Security Triage section', () => assert.ok(zeusContent.includes('Security Triage')));
      it('References security-triage skill', () => assert.ok(zeusContent.includes('security-triage')));
    });

    describe('Subagent Dispatch (@mention)', () => {
      it('Has Subagent Dispatch section', () => assert.ok(zeusContent.includes('Subagent Dispatch')));
      it('References subagents by process names', () => {
        assert.ok(zeusContent.includes('@security-audit'));
        assert.ok(zeusContent.includes('@structure-review'));
        assert.ok(zeusContent.includes('@code-exploration'));
        assert.ok(zeusContent.includes('@root-cause-analysis'));
        assert.ok(zeusContent.includes('@verification'));
        assert.ok(zeusContent.includes('@code-cleanup'));
      });
      it('Mentions @mention-only dispatch rule', () => assert.ok(zeusContent.includes('@mention')));
    });

    describe('Model Strategy', () => {
      it('Has Model Strategy section', () => assert.ok(zeusContent.includes('## Model Strategy')));
      it('References small_model', () => assert.ok(zeusContent.includes('small_model')));
      it('Uses full reasoning for planning', () => assert.ok(zeusContent.includes('Full Reasoning')));
    });

    describe('Rationalization Table', () => {
      it('Has Rationalization Table', () => assert.ok(zeusContent.includes('Rationalization Table')));
      it('Has skill rationalization entries', () => assert.ok(zeusContent.includes('"I\'ll skip the skill')));
    });

    describe('Red Flags', () => {
      it('Has Red Flags section', () => assert.ok(zeusContent.includes('Red Flags')));
      it('Flags skipping security-triage', () => assert.ok(zeusContent.includes('security-triage')));
    });
  });
});
