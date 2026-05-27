import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../../lib/config-schema.mjs';

describe('lib/config-schema', () => {
  it('passes valid minimal config', () => {
    const res = validateConfig({});
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
    assert.equal(res.warnings.length, 0);
  });

  it('passes valid full config', () => {
    const res = validateConfig({
      '$schema': 'url',
      plugin: ['a', 'b'],
      provider: { type: 'google' },
      autoupdate: true,
      default_agent: 'zeus',
      instructions: ['do', 'this'],
      skills: { paths: ['a/b'] },
      model: 'opus'
    });
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
  });

  it('errors on invalid plugin type', () => {
    const res = validateConfig({ plugin: 'string' });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('plugin')));
  });

  it('errors on invalid default_agent type', () => {
    const res = validateConfig({ default_agent: 123 });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('default_agent')));
  });

  it('errors on invalid instructions type', () => {
    const res = validateConfig({ instructions: 123 });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('instructions')));
  });

  it('passes string instructions', () => {
    const res = validateConfig({ instructions: 'do this' });
    assert.equal(res.valid, true);
  });

  it('errors on invalid skills type', () => {
    const res = validateConfig({ skills: 'string' });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('skills')));
  });

  it('errors on invalid skills.paths type', () => {
    const res = validateConfig({ skills: { paths: 'string' } });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('skills.paths')));
  });

  it('warns on unknown top-level key', () => {
    const res = validateConfig({ unknown_key: true });
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
    assert.equal(res.warnings.length, 1);
    assert.ok(res.warnings[0].includes('unknown_key'));
  });

  it('warns specifically on enable_experimental_skills', () => {
    const res = validateConfig({ enable_experimental_skills: true });
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
    assert.equal(res.warnings.length, 1);
    assert.ok(res.warnings[0].includes('enable_experimental_skills'));
  });

  it('errors on plugin array with non-string entry', () => {
    const res = validateConfig({ plugin: ['a', 123] });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('plugin')));
  });

  it('errors on skills.paths with non-string entry', () => {
    const res = validateConfig({ skills: { paths: [123] } });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('skills.paths')));
  });

  it('errors on instructions array with non-string entry', () => {
    const res = validateConfig({ instructions: ['a', 123] });
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('instructions')));
  });
});
