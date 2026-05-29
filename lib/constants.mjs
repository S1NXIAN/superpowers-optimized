import { join } from 'node:path';
import { homedir } from 'node:os';

export const SKILLS_PATH = 'skills/opencode-zeus';

export const CONFIG_DIR = join(homedir(), '.config', 'opencode');
export const CONFIG_JSON_PATH = join(CONFIG_DIR, 'opencode.json');
export const BACKUP_PARENT = join(CONFIG_DIR, '.backups');

export const FILE_COPIES = [
  { repoRel: 'AGENTS.md', configRel: 'AGENTS.md', executable: false },
  { repoRel: 'agents/zeus.md', configRel: 'agent/zeus.md', executable: false },
  { repoRel: 'scripts/post-checkout-hook.sh', configRel: 'scripts/post-checkout-hook.sh', executable: true },
  { repoRel: 'scripts/asi.sh', configRel: 'scripts/asi.sh', executable: true },
  { repoRel: 'scripts/skills.sh', configRel: 'scripts/skills.sh', executable: true },
  { repoRel: 'bin/staleness-check.mjs', configRel: 'bin/staleness-check.mjs', executable: true },
  { repoRel: 'lib/context-snapshot.mjs', configRel: 'lib/context-snapshot.mjs', executable: true },

  { repoRel: 'lib/console.mjs', configRel: 'lib/console.mjs', executable: false },
  { repoRel: 'lib/config-schema.mjs', configRel: 'lib/config-schema.mjs', executable: false },
  { repoRel: 'lib/fs-utils.mjs', configRel: 'lib/fs-utils.mjs', executable: false },
  { repoRel: 'lib/constants.mjs', configRel: 'lib/constants.mjs', executable: false },
  { repoRel: 'bin/cleanup.mjs', configRel: 'bin/cleanup.mjs', executable: true },

  // Subagents — installed to global ~/.config/opencode/agents/
  { repoRel: 'agents/sub/security-audit.md', configRel: 'agents/security-audit.md', executable: false },
  { repoRel: 'agents/sub/structure-review.md', configRel: 'agents/structure-review.md', executable: false },
  { repoRel: 'agents/sub/design-review.md', configRel: 'agents/design-review.md', executable: false },
  { repoRel: 'agents/sub/verification.md', configRel: 'agents/verification.md', executable: false },
  { repoRel: 'agents/sub/code-cleanup.md', configRel: 'agents/code-cleanup.md', executable: false },
  { repoRel: 'agents/sub/spec-validation.md', configRel: 'agents/spec-validation.md', executable: false },
  { repoRel: 'agents/sub/quality-review.md', configRel: 'agents/quality-review.md', executable: false },
];

export const DIR_COPIES = [
  { repoRel: 'skills', configRel: SKILLS_PATH },
];

export const MANAGED_FILES = FILE_COPIES.map(fc => fc.configRel);
export const MANAGED_DIRS = DIR_COPIES.map(dc => dc.configRel);
