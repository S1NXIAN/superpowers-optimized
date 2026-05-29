#!/usr/bin/env node
/**
 * staleness-check.mjs — one-shot memory freshness check for Session Init
 *
 * Replaces multi-step AI reasoning: checks context-snapshot + project-map
 * freshness in one command. Saves ~800–1200 tokens per session init.
 *
 * Usage:
 *   node bin/staleness-check.mjs [project_root]
 *   node bin/staleness-check.mjs --help
 *
 * Output (one line):
 *   FRESH                  — both files are current
 *   SNAPSHOT_STALE:<hash>  — snapshot hash != HEAD
 *   MAP_STALE:<hash>       — map hash != HEAD
 *   SNAPSHOT_MISSING       — no context-snapshot.json
 *   MAP_MISSING            — no project-map.md
 *   NO_GIT                 — not a git repository
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const HELP = `staleness-check — check memory file freshness

Usage:
  node bin/staleness-check.mjs [project_root]

Output:
  FRESH, SNAPSHOT_STALE:<hash>, MAP_STALE:<hash>,
  SNAPSHOT_MISSING, MAP_MISSING, or NO_GIT
`;

function main() {
  const args = process.argv.slice(2);

  if (args.some(a => a === '--help')) {
    console.log(HELP);
    process.exit(0);
  }

  const projectRoot = args[0] || process.cwd();
  const memDir = join(projectRoot, 'zeus', 'memory');

  // Check git availability
  let headHash;
  try {
    headHash = execSync('git rev-parse HEAD', {
      cwd: projectRoot, stdio: 'pipe',
    }).toString().trim();
  } catch {
    console.log('NO_GIT');
    return;
  }

  // Check context-snapshot.json
  const snapPath = join(memDir, 'context-snapshot.json');
  if (!existsSync(snapPath)) {
    console.log('SNAPSHOT_MISSING');
    return;
  }
  try {
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
    if (snap.git_hash !== headHash) {
      console.log('SNAPSHOT_STALE:' + snap.git_hash);
      return;
    }
  } catch {
    console.log('SNAPSHOT_STALE:invalid');
    return;
  }

  // Check project-map.md
  const mapPath = join(memDir, 'project-map.md');
  if (!existsSync(mapPath)) {
    console.log('MAP_MISSING');
    return;
  }
  const mapContent = readFileSync(mapPath, 'utf8');
  const hashMatch = mapContent.match(/Git:\s*([a-f0-9]+)/);
  if (!hashMatch) {
    console.log('MAP_STALE:unknown');
    return;
  }
  if (hashMatch[1] !== headHash) {
    console.log('MAP_STALE:' + hashMatch[1]);
    return;
  }

  console.log('FRESH');
}

main();
