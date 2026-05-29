# Zeus 2.0 Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-optimized:subagent-driven-development (recommended) or superpowers-optimized:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize Zeus into a Router-Workflow pattern and import the Elite Skill Pack.

**Architecture:** Router (ZEUS.md) -> Skill Handoff.

**Tech Stack:** Node.js, Markdown.

---

### Task 1: Prep & Folder Structure

**Files:**
- Create: `skills/zeus/fast-path`
- Create: `skills/zeus/full-path`
- Create: `skills/premise-check`
- Create: `skills/self-consistency-reasoner`
- Create: `skills/error-recovery`
- Create: `skills/subagent-driven-development`
- Create: `skills/dependency-management`

- [ ] **Step 1: Create directories**
```bash
mkdir -p skills/zeus/fast-path skills/zeus/full-path \
         skills/premise-check skills/self-consistency-reasoner \
         skills/error-recovery skills/subagent-driven-development \
         skills/dependency-management
```
- [ ] **Step 2: Commit**
```bash
git add skills/
git commit -m "chore: create canonical folder structure for Zeus 2.0"
```

---

### Task 2: Implement Workflow Skills

**Files:**
- Create: `skills/zeus/fast-path/SKILL.md`
- Create: `skills/zeus/full-path/SKILL.md`

- [ ] **Step 1: Write fast-path logic (TDD focus)**
- [ ] **Step 2: Write full-path logic (Elite pipeline focus)**
- [ ] **Step 3: Commit**
```bash
git add skills/zeus
git commit -m "feat: implement modular fast-path and full-path skills"
```

---

### Task 3: Import Elite Skill Pack

**Files:**
- Create: `skills/premise-check/SKILL.md`
- Create: `skills/self-consistency-reasoner/SKILL.md`
- Create: `skills/error-recovery/SKILL.md`
- Create: `skills/subagent-driven-development/SKILL.md`
- Create: `skills/dependency-management/SKILL.md`

- [ ] **Step 1: Import skills from superpowers-optimized references**
- [ ] **Step 2: Commit**
```bash
git add skills/
git commit -m "feat: import Elite Skill Pack (premise-check, consistency, SDD, recovery)"
```

---

### Task 4: Transform zeus.md into Router

**Files:**
- Modify: `agent/zeus.md`

- [ ] **Step 1: Strip procedural logic and add classification-based skill loading**
- [ ] **Step 2: Commit**
```bash
git add agent/zeus.md
git commit -m "feat: transform zeus.md into a Router"
```

---

### Task 5: Specialized Sub-Agent Registry

**Files:**
- Create: `skills/social-accountability/sub-agents/architect-agent.md`
- Create: `skills/social-accountability/sub-agents/hacker-agent.md`
- Create: `skills/social-accountability/sub-agents/qa-pro-agent.md`
- Create: `skills/social-accountability/sub-agents/cleaner-agent.md`

- [ ] **Step 1: Write specialized prompts for each role**
- [ ] **Step 2: Commit**
```bash
git add skills/social-accountability/sub-agents/
git commit -m "feat: implement Specialized Sub-Agent Registry (architect, hacker, qa-pro, cleaner)"
```

---

### Task 6: Implement skills.sh Utility

**Files:**
- Create: `scripts/skills.sh`

- [ ] **Step 1: Implement bash script with list, bootstrap, and audit commands**
- [ ] **Step 2: Make executable and verify**
- [ ] **Step 3: Commit**
```bash
chmod +x scripts/skills.sh
git add scripts/skills.sh
git commit -m "feat: implement skills.sh system utility"
```

---

### Task 7: Testing & Integration

- [ ] **Step 1: Update tests to point to modular structure**
- [ ] **Step 2: Update project map**
- [ ] **Step 3: Run full suite (npm test)**
- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "test: verify Zeus 2.0 modular architecture"
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
- Create: `skills/superpowers/PREMISE_CHECK.md`
- Create: `skills/superpowers/SELF_CONSISTENCY.md`
- Create: `skills/superpowers/ERROR_RECOVERY.md`
- Create: `skills/superpowers/SDD.md`
- Create: `skills/superpowers/DEPS.md`

- [ ] **Step 1: Import skills from superpowers-optimized references**
- [ ] **Step 2: Commit**
```bash
git add skills/superpowers
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
