#!/usr/bin/env node
/**
 * init-memory.mjs — bootstrap zeus/memory/ for a project
 *
 * Usage:
 *   node bin/init-memory.mjs
 *   node bin/init-memory.mjs --dry-run
 *   node bin/init-memory.mjs --force
 *   node bin/init-memory.mjs --help
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMap } from '../lib/project-map.mjs';
import { buildSnapshot } from '../lib/context-snapshot.mjs';

const PROJECT_ROOT = process.cwd();
const MEMORY_DIR = join(PROJECT_ROOT, 'zeus', 'memory');

const HELP_TEXT = `init-memory — bootstrap AI memory directory for this project

Creates zeus/memory/ with project-map.md, known-issues.md,
and context-snapshot.json for cross-session AI context.

Usage:
  node bin/init-memory.mjs               create memory files
  node bin/init-memory.mjs --dry-run     show what would be created
  node bin/init-memory.mjs --force       overwrite existing files
  node bin/init-memory.mjs --help        show this message
`;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { help: false, dryRun: false, force: false };
  for (const arg of args) {
    if (arg === '--help') opts.help = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
  }
  return opts;
}

function wrote(label) {
  console.log(`  ${'created'} ${label}`);
}

function skipped(label) {
  console.log(`  ${'skipped'} ${label} (exists, use --force to overwrite)`);
}

function createMemoryDir(dryRun) {
  if (dryRun) return;
  mkdirSync(MEMORY_DIR, { recursive: true });
}

function writeProjectMap(dryRun, force) {
  const path = join(MEMORY_DIR, 'project-map.md');
  if (existsSync(path) && !force) {
    skipped('project-map.md');
    return;
  }
  if (dryRun) return;
  const content = generateMap(PROJECT_ROOT);
  writeFileSync(path, content, 'utf8');
  wrote('project-map.md');
}

function writeKnownIssues(dryRun, force) {
  const path = join(MEMORY_DIR, 'known-issues.md');
  if (existsSync(path) && !force) {
    skipped('known-issues.md');
    return;
  }
  if (dryRun) return;
  const template = `# Known Issues

<!--
Record recurring errors here so AI remembers them across sessions.

Format:
## Error title

**Error:** exact error message
**Root cause:** why it happens
**Fix:** what fixed it
**Context:** when does this trigger
**First seen:** YYYY-MM-DD
-->

`;
  writeFileSync(path, template, 'utf8');
  wrote('known-issues.md');
}

function writeContextSnapshot(dryRun, force) {
  const path = join(MEMORY_DIR, 'context-snapshot.json');
  if (existsSync(path) && !force) {
    skipped('context-snapshot.json');
    return;
  }
  if (dryRun) return;
  const snapshot = buildSnapshot(PROJECT_ROOT);
  if (snapshot) {
    writeFileSync(path, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    wrote('context-snapshot.json');
  } else {
    // Non-git project — write minimal stub
    const stub = {
      git_hash: 'no-git',
      changed_files: [],
      change_stat: '',
      recent_commits: [],
      blast_radius: {},
      generated: new Date().toISOString(),
    };
    writeFileSync(path, JSON.stringify(stub, null, 2) + '\n', 'utf8');
    console.log('  warning  context-snapshot.json (no git repo — minimal stub)');
  }
}

function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  console.log(`\n  Initializing zeus/memory/ for ${PROJECT_ROOT}\n`);

  createMemoryDir(opts.dryRun);
  writeProjectMap(opts.dryRun, opts.force);
  writeKnownIssues(opts.dryRun, opts.force);
  writeContextSnapshot(opts.dryRun, opts.force);

  if (opts.dryRun) {
    console.log('\n  (dry run — no files written)');
  }

  console.log('');
}

export { main, parseArgs, MEMORY_DIR, PROJECT_ROOT, writeProjectMap, writeKnownIssues, writeContextSnapshot };

// Allow direct execution
const THIS_FILE = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === THIS_FILE || basename(process.argv[1]) === 'init-memory.mjs')) {
  main();
}
