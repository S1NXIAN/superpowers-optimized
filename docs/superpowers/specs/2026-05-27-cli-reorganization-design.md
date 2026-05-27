# CLI Reorganization Design

## 1. Goal
Clean up the root directory of the `superpowers-enhanced` project by moving CLI entry points, installer scripts, and templates into appropriately named subdirectories. This will leave the root directory containing only standard repository files (`README.md`, `LICENSE`, `package.json`, `AGENTS.md`, and `skills-lock.json`).

## 2. Directory Structure Changes
The following files will be relocated:
- **`setup.mjs`** → `bin/setup.mjs`
- **`uninstall.mjs`** → `bin/uninstall.mjs`
- **`install.sh`** → `installers/install.sh`
- **`install.ps1`** → `installers/install.ps1`
- **`uninstall.sh`** → `installers/uninstall.sh`
- **`uninstall.ps1`** → `installers/uninstall.ps1`
- **`opencode-template.json`** → `templates/opencode-template.json`

## 3. Necessary Code and Configuration Updates
Relocating these files will break existing internal path references and documentation. The following updates must be made:

### 3.1. `bin/setup.mjs` and `bin/uninstall.mjs`
- Update the `REPO_DIR` definition. Currently, it uses `__dirname` which resolves to the directory containing the script. It must be updated to resolve to the parent directory (the repository root).
  - Change: `const REPO_DIR = join(__dirname, '..');`

### 3.2. `package.json`
- The `setup` and `uninstall` script aliases point to the old locations. They must be updated.
  - `"setup": "node bin/setup.mjs"`
  - `"uninstall": "node bin/uninstall.mjs"`

### 3.3. Installer Scripts (`installers/*`)
- Any shell scripts referencing `setup.mjs` (or `uninstall.mjs`) relative to the project root must be updated to target `bin/setup.mjs`. (e.g., `node setup.mjs` becomes `node bin/setup.mjs`).

### 3.4. `README.md`
- The Quick Start installation curl and `irm` commands fetch scripts from raw GitHub URLs. These must be updated to point to the `installers/` directory.
  - Bash: `https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/installers/install.sh`
  - PowerShell: `https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/installers/install.ps1`
- Manual installation instructions must be updated to say `node bin/setup.mjs`.

## 4. Verification Plan
- Run `npm run test` (including unit, agent, and integration tests) to ensure all tests pass.
- Verify `npm run setup --help` and `npm run uninstall --help` execute correctly.
- Review the modified `README.md` to ensure all paths are correct.
