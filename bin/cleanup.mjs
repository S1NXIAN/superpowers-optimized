#!/usr/bin/env node
/**
 * bin/cleanup.mjs — remove AI-generated temp files after task completion
 *
 * Cleans known artifact paths created by the Zeus pipeline:
 *   - Design docs and plans (docs/superpowers/)
 *   - ASI loop state (.asi-state.json)
 *   - Agent artifacts (.antigravitycli/, .agents/, .gemini/)
 *   - Skill lock file (skills-lock.json)
 *
 * Usage:
 *   node bin/cleanup.mjs          — delete everything found
 *   node bin/cleanup.mjs --dry-run — preview without deleting
 *   node bin/cleanup.mjs --help   — show this
 */

import { existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConsole } from '../lib/console.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR = join(__dirname, '..');
const con = createConsole(process.stdout.isTTY);
const { c, BOLD, DIM, RED } = con;

let dryRunMode = false;

// All artifact paths — now all untracked/ignored, safe to delete without prompting
const ARTIFACTS = [
  { rel: 'docs/superpowers',     type: 'dir',  label: 'design docs and plans' },
  { rel: '.asi-state.json',      type: 'file', label: 'ASI loop state' },
  { rel: '.antigravitycli',      type: 'dir',  label: 'agent artifacts' },
  { rel: '.agents',              type: 'dir',  label: 'agent files' },
  { rel: '.gemini',              type: 'dir',  label: 'Gemini artifacts' },
  { rel: 'skills-lock.json',     type: 'file', label: 'skill lock file' },
];

function exists(rel) {
  const full = join(REPO_DIR, rel);
  try {
    if (ARTIFACTS.find(a => a.rel === rel)?.type === 'dir') {
      return readdirSync(full).length > 0;
    }
    return existsSync(full);
  } catch {
    return false;
  }
}

// ── CLI ───────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`${c(BOLD, 'opencode-zeus \u2014 cleanup')}\n`);
  console.log(`${c(DIM, 'Removes AI-generated temp files after task completion.')}\n`);
  console.log(`${c(BOLD, 'Usage:')}  node bin/cleanup.mjs [OPTIONS]\n`);
  console.log(`${c(BOLD, 'Options:')}`);
  console.log('  --dry-run     Show what would be deleted; don\'t touch anything');
  console.log('  --help        Show this help and exit\n');
  console.log(`${c(BOLD, 'Cleans:')}`);
  for (const a of ARTIFACTS) con.outInfo(`${a.label}  (${a.rel})`);
  process.exit(0);
}

function parseArgs() {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg === '--help') showHelp();
    else if (arg === '--dry-run') dryRunMode = true;
    else {
      con.outError(`${c(RED, 'Unknown option:')} ${arg}`);
      showHelp();
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────

function main() {
  parseArgs();
  console.log('');
  console.log(`  ${c(BOLD, 'opencode-zeus \u2014 cleanup')}`);
  console.log(`  ${c(DIM, `Repo: ${REPO_DIR}`)}\n`);

  const present = ARTIFACTS.filter(a => exists(a.rel));
  if (present.length === 0) {
    con.outInfo('Nothing to clean. All artifact paths already empty or missing.');
    return;
  }

  con.outInfo('Found:');
  for (const a of present) con.outInfo(`${a.label}  (${a.rel})`);
  console.log('');

  if (dryRunMode) {
    con.outOk(`${c(BOLD, 'Dry run complete.')} Nothing was deleted.`);
    return;
  }

  let count = 0;
  for (const a of ARTIFACTS) {
    if (!exists(a.rel)) continue;
    const full = join(REPO_DIR, a.rel);
    if (a.type === 'dir') rmSync(full, { recursive: true, force: true });
    else rmSync(full, { force: true });
    con.outOk(`Removed ${a.label}  (${a.rel})`);
    count++;
  }

  if (count > 0) con.outOk(`${c(BOLD, `Done. Removed ${count} artifact(s).`)}`);
}

try {
  main();
} catch (err) {
  console.error(c(RED, 'Error:'), err.stack || err.message);
  process.exit(1);
}
