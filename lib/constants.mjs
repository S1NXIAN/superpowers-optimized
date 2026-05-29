import { join } from 'node:path';
import { homedir } from 'node:os';

export const SUPERPOWERS_PLUGIN = 'superpowers@git+https://github.com/obra/superpowers.git';
export const SKILLS_PATH = 'skills/opencode-zeus';

export const CONFIG_DIR = join(homedir(), '.config', 'opencode');
export const CONFIG_JSON_PATH = join(CONFIG_DIR, 'opencode.json');
export const BACKUP_PARENT = join(CONFIG_DIR, '.backups');

export const FILE_COPIES = [
  { repoRel: 'AGENTS.md', configRel: 'AGENTS.md', executable: false },
  { repoRel: 'agent/zeus.md', configRel: 'agent/zeus.md', executable: false },
  { repoRel: 'LITE.md', configRel: 'LITE.md', executable: false },
  { repoRel: 'scripts/verify-hash.sh', configRel: 'scripts/verify-hash.sh', executable: true },
  { repoRel: 'scripts/post-checkout-hook.sh', configRel: 'scripts/post-checkout-hook.sh', executable: true },
  { repoRel: 'scripts/asi.sh', configRel: 'scripts/asi.sh', executable: true },
  { repoRel: 'bin/staleness-check.mjs', configRel: 'bin/staleness-check.mjs', executable: true },
  { repoRel: 'bin/security-scan.mjs', configRel: 'bin/security-scan.mjs', executable: true },
  { repoRel: 'bin/init-memory.mjs', configRel: 'bin/init-memory.mjs', executable: true },
  { repoRel: 'lib/context-snapshot.mjs', configRel: 'lib/context-snapshot.mjs', executable: true },
  { repoRel: 'lib/project-map.mjs', configRel: 'lib/project-map.mjs', executable: true },
  { repoRel: 'lib/command-guard.mjs', configRel: 'lib/command-guard.mjs', executable: false },
  { repoRel: 'lib/known-issues.mjs', configRel: 'lib/known-issues.mjs', executable: false },
  { repoRel: 'lib/constants.mjs', configRel: 'lib/constants.mjs', executable: false },
  { repoRel: 'bin/cleanup.mjs', configRel: 'bin/cleanup.mjs', executable: true },
];

export const DIR_COPIES = [
  { repoRel: 'skills', configRel: SKILLS_PATH },
];

export const MANAGED_FILES = FILE_COPIES.map(fc => fc.configRel);
export const MANAGED_DIRS = DIR_COPIES.map(dc => dc.configRel);
