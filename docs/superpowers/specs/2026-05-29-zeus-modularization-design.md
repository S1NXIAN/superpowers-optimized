# Design Doc: Zeus 2.0 (Elite Modular Architecture)

**Date:** 2026-05-29  
**Status:** Approved  
**Topic:** Modularizing Zeus into a Router-Workflow pattern and importing the "Elite" skill set for enhanced discipline.

## 1. Problem Statement
The current Zeus is a monolithic orchestrator that loads all rules at once, causing token waste and high hallucination risk. It also lacks advanced "Quality Gates" for premise checking and self-consistency.

## 2. Proposed Architecture: Router-Workflow (Elite)
Transition Zeus to a "Router" core that dynamically loads specialized workflow skills.

### 2.1 Component Map
- **`agent/zeus.md` (The Router)**:
  - **Identity:** Global orchestrator.
  - **Logic:** Session Init, Security Scan, Classification (Fast, Full, Maintenance).
  - **Purpose:** Load the correct workflow skill.
- **`skills/zeus/fast-path/SKILL.md`**:
  - **Workflow:** Optimized TDD sprint.
- **`skills/zeus/full-path/SKILL.md`**:
  - **Workflow:** The 8-stage Elite engineering pipeline.

### 2.2 The "Elite" Skill Pack (Canonical Import)
We are importing skills using the canonical Superpowers structure (`skills/<name>/SKILL.md`):
1.  **`premise-check`**: Runs before brainstorming. Validates YAGNI.
2.  **`self-consistency-reasoner`**: Multi-path hypothesis testing.
3.  **`error-recovery`**: Formalized `known-issues.md` management.
4.  **`subagent-driven-development`**: Parallel wave execution engine.
5.  **`dependency-management`**: Safe, incremental update protocol.

### 2.3 The "Full Firepower" Sub-Agent Registry
Specialized sub-agents using canonical kebab-case naming in `skills/social-accountability/sub-agents/`:

1.  **`implementer`**: Standard execution engine.
2.  **`architect`**: Multi-component design and SOLID enforcement.
3.  **`hacker`**: Security penetration and "breaking" the proposed fix.
4.  **`qa-pro`**: Exhaustive edge-case testing and coverage analysis.
5.  **`cleaner`**: Refactoring and code-smell elimination.

### 2.4 `scripts/skills.sh` (System Utility)
Canonical bash-based power utility to manage the modular ecosystem:
- **`skills.sh list`**: Discovers all active skills.
- **`skills.sh bootstrap`**: Sets up the `zeus/memory` directory.
- **`skills.sh audit`**: Dispatches sub-agents for file reviews.

## 3. Updated Workflow: Full Path 2.0
1.  **Phase 0: Router Classification** (`zeus.md`)
2.  **Phase 1: Premise Check** (`premise-check`)
3.  **Phase 2: Specialized Audit** (architect/hacker review)
4.  **Phase 3: Brainstorming**
5.  **Phase 4: Writing Plans** (qa-pro review)
6.  **Phase 5: SDD** (`subagent-driven-development`)
7.  **Phase 6: Verification & Self-Consistency**
8.  **Phase 7: Cleanup**

## 4. File Structure (Canonical)
```
├── agent/
│   └── zeus.md                   # Primary Router
├── skills/
│   ├── zeus/
│   │   ├── fast-path/SKILL.md    
│   │   └── full-path/SKILL.md    
│   ├── premise-check/SKILL.md
│   ├── self-consistency-reasoner/SKILL.md
│   ├── error-recovery/SKILL.md
│   ├── subagent-driven-development/SKILL.md
│   └── dependency-management/SKILL.md
├── scripts/
│   └── skills.sh
```

## 5. Success Criteria
- Base token cost reduced by >50%.
- "One-shot" success rate increased via Self-Consistency.
- Reduced feature creep via Premise Check.
