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
import { buildSnapshot } from '../lib/context-snapshot.mjs';
import { createConsole } from '../lib/console.mjs';

const PROJECT_ROOT = process.cwd();
const MEMORY_DIR = join(PROJECT_ROOT, 'zeus', 'memory');
const con = createConsole();
const { c, BOLD, DIM, RED, GREEN, YELLOW } = con;

const HELP_TEXT = `init-memory — bootstrap AI memory directory for this project

Creates zeus/memory/ with known-issues.md and context-snapshot.json
for cross-session AI context.

Usage:
  node bin/init-memory.mjs               create memory files
  node bin/init-memory.mjs --dry-run     show what would be created
  node bin/init-memory.mjs --force       overwrite existing files
  node bin/init-memory.mjs --help        show this message
`;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    help: args.includes('--help'),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

function createMemoryDir(dryRun) {
  if (dryRun) {
    con.outInfo('Would create zeus/memory/ directory');
    return;
  }
  mkdirSync(MEMORY_DIR, { recursive: true });
  con.outOk('Created zeus/memory/');
}

function writeKnownIssues(dryRun, force) {
  const target = join(MEMORY_DIR, 'known-issues.md');
  if (!dryRun && existsSync(target) && !force) {
    skipped('known-issues.md');
    return;
  }
  if (dryRun) {
    con.outInfo('Would create known-issues.md');
    return;
  }
  const template = `# Known Issues

## Issue Template
| Error / Symptom | Root Cause | Fix / Workaround | Context |
| :--- | :--- | :--- | :--- |
| \`example error\` | Root cause description | Fix description | When/where seen |

## Active
<!-- Add active issues below -->

`;
  writeFileSync(target, template, 'utf8');
  wrote('known-issues.md');
}

function writeContextSnapshot(dryRun, force) {
  const target = join(MEMORY_DIR, 'context-snapshot.json');
  if (!dryRun && existsSync(target) && !force) {
    skipped('context-snapshot.json');
    return;
  }
  if (dryRun) {
    con.outInfo('Would create context-snapshot.json');
    return;
  }
  const snap = buildSnapshot(PROJECT_ROOT);
  if (snap) {
    writeFileSync(target, JSON.stringify(snap, null, 2) + '\n', 'utf8');
  } else {
    const stub = {
      git_hash: 'no-git',
      changed_files: [],
      change_stat: '',
      recent_commits: [],
      blast_radius: {},
      generated: new Date().toISOString(),
    };
    writeFileSync(target, JSON.stringify(stub, null, 2) + '\n', 'utf8');
  }
  wrote('context-snapshot.json');
}

function wrote(label) {
  con.outOk(`created ${label}`);
}

function skipped(label) {
  con.outInfo(`skipped ${label} (exists, use --force to overwrite)`);
}

function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  con.outHeader(`Initializing zeus/memory/ for ${PROJECT_ROOT}`);

  try {
    createMemoryDir(opts.dryRun);
    writeKnownIssues(opts.dryRun, opts.force);
    writeContextSnapshot(opts.dryRun, opts.force);
  } catch (err) {
    con.outError(`Somatic failure during init: ${err.message}`);
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log(`\n  ${c(DIM, '(dry run — no files written)')}`);
  }

  console.log('');
}

export { main, parseArgs, MEMORY_DIR, PROJECT_ROOT, writeKnownIssues, writeContextSnapshot };

// Allow direct execution
const THIS_FILE = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1] === THIS_FILE || basename(process.argv[1]) === 'init-memory.mjs')) {
  main();
}
