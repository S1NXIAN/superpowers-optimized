#!/usr/bin/env node
/**
 * staleness-check.mjs — context-snapshot freshness check
 *
 * Usage:
 *   node bin/staleness-check.mjs [project_root]
 *   node bin/staleness-check.mjs --help
 *
 * Output (one line):
 *   FRESH | SNAPSHOT_STALE:<h> | SNAPSHOT_MISSING | NO_GIT
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const HELP = `staleness-check — check context-snapshot freshness

Usage:
  node bin/staleness-check.mjs [project_root]

Output:
  FRESH, SNAPSHOT_STALE:<hash>, SNAPSHOT_MISSING, or NO_GIT
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

  console.log('FRESH');
}

main();
