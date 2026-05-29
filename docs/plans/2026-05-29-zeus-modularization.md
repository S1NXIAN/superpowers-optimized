# Zeus Elite Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use opencode-zeus:subagent-driven-development or executing-plans. 

**Goal:** Achieve full project sovereignty by removing Zeus Elite dependencies, deprecating Windows, and prioritizing modern Unix-only tooling (`rg`, `fd`).

**Architecture:** Independent Zeus Router & Workflow Logic. Zero external plugins.

---

### Task 1: Deprecation of Windows Assets

**Files:**
- Delete: `installers/install.ps1`
- Delete: `installers/uninstall.ps1`

- [ ] **Step 1: Delete Windows-specific assets**
```bash
rm installers/install.ps1 installers/uninstall.ps1
```
- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "chore: remove Windows support and .ps1 assets"
```

---

### Task 2: Decoupling from Zeus Elite

**Files:**
- Modify: `lib/constants.mjs`
- Modify: `opencode.json`
- Modify: `templates/opencode-template.json`

- [ ] **Step 1: Remove ZEUS_PLUGIN from constants**
- [ ] **Step 2: Remove zeus plugin from config files**
- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: decouple from Zeus Elite plugin"
```

---

### Task 3: Modern Tooling Integration (rg, fd)

**Files:**
- Modify: `bin/setup.mjs`
- Modify: `installers/install.sh`

- [ ] **Step 1: Add auto-install logic for rg and fd in setup.mjs**
- [ ] **Step 2: Update installers/install.sh to reflect dependencies**
- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: prioritize modern tooling (rg, fd) in installer"
```

---

### Task 4: Universal Instruction Scrub

**Files:**
- Modify: All `*.md` files in `agent/`, `skills/`, and `AGENTS.md`.

- [ ] **Step 1: Replace "Zeus Elite" with "Zeus Elite" or "Elite Standards" across the repo**
- [ ] **Step 2: Commit**
```bash
grep -rl "Zeus Elite" . | xargs sed -i 's/Zeus Elite/Zeus Elite/g'
git add .
git commit -m "docs: scrub Zeus Elite branding and terminology"
```

---

### Task 5: Testing & Integration

- [ ] **Step 1: Update tests to remove Zeus Elite plugin assumptions**
- [ ] **Step 2: Run all tests (npm test)**
- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "test: verify Zeus Elite Zero independent architecture"
```

- [ ] **Step 2: Commit**
```bash
git add skills/
git commit -m "chore: create folder structure for Zeus 2.0"
```

---

### Task 2: Implement Workflow Skills

**Files:**
- Create: `skills/zeus/FAST_PATH/SKILL.md`
- Create: `skills/zeus/FULL_PATH/SKILL.md`

- [ ] **Step 1: Write FAST_PATH logic (TDD focus)**
- [ ] **Step 2: Write FULL_PATH logic (Elite pipeline focus)**
- [ ] **Step 3: Commit**
```bash
git add skills/zeus
git commit -m "feat: implement modular FAST_PATH and FULL_PATH skills"
```

---

### Task 3: Import/Upgrade Elite Skill Pack

**Files:**
- Create: `skills/zeus/PREMISE_CHECK.md`
- Create: `skills/zeus/SELF_CONSISTENCY.md`
- Create: `skills/zeus/ERROR_RECOVERY.md`
- Create: `skills/zeus/SDD.md`
- Create: `skills/zeus/DEPS.md`

- [ ] **Step 1: Import skills from opencode-zeus references**
- [ ] **Step 2: Commit**
```bash
git add skills/zeus
git commit -m "feat: import Elite Skill Pack (Premise, Consistency, SDD, recovery)"
```

---

### Task 4: Transform ZEUS.md into Router

**Files:**
- Modify: `agent/zeus.md` -> `agent/ZEUS.md`

- [ ] **Step 1: Rename zeus.md to ZEUS.md**
- [ ] **Step 2: Strip procedural logic and add classification-based skill loading**
- [ ] **Step 3: Commit**
```bash
git add agent/ZEUS.md
git rm agent/zeus.md
git commit -m "feat: transform ZEUS.md into a Router"
```

---

### Task 6: Specialized Sub-Agent Registry

**Files:**
- Create: `skills/social-accountability/sub-agents/architect-agent.md`
- Create: `skills/social-accountability/sub-agents/hacker-agent.md`
- Create: `skills/social-accountability/sub-agents/qa-pro-agent.md`
- Create: `skills/social-accountability/sub-agents/cleaner-agent.md`

- [ ] **Step 1: Write specialized prompts for each role**
- [ ] **Step 2: Commit**
```bash
git add skills/social-accountability/sub-agents/
git commit -m "feat: implement Specialized Sub-Agent Registry (Architect, Hacker, QA-Pro, Cleaner)"
```

---

### Task 7: Implement SKILLS.sh Utility

**Files:**
- Create: `scripts/SKILLS.sh`

- [ ] **Step 1: Implement bash script with list, bootstrap, and audit commands**
- [ ] **Step 2: Make executable and verify**
- [ ] **Step 3: Commit**
```bash
chmod +x scripts/SKILLS.sh
git add scripts/SKILLS.sh
---

### Task 8: Testing & Integration

- [ ] **Step 1: Update tests to point to ZEUS.md**
- [ ] **Step 2: Update project map**
- [ ] **Step 3: Run full suite (npm test)**
- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "test: verify Zeus 2.0 modular architecture"
```
