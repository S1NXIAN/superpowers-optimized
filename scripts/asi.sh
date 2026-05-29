#!/usr/bin/env bash
# ===========================================================================
# asi.sh — ASI Loop State Machine Driver
#
# Manages .asi-state.json lifecycle. All JSON manipulation via node (always
# available in this project). Structured output for agent consumption.
#
# Usage:
#   asi.sh init <json>              — Init state from JSON string or stdin
#   asi.sh select                   — Run priority waterfall, print selected ID
#   asi.sh status                   — Print cycle count + open/fixed/blocked
#   asi.sh list-open               — Print IDs of all open issues (one per line)
#   asi.sh get <id>                — Print formatted details of one issue
#   asi.sh mark-fixed <id>         — Set issue status → "fixed"
#   asi.sh mark-blocked <id> <reason> — Set issue status → "blocked"
#   asi.sh add-issue <json>        — Append a new issue from JSON or stdin
#   asi.sh complete-cycle          — Increment cycle, update lastUpdated, write
#   asi.sh check-corrupt           — Validate state; exit 0=valid, 1=corrupt
#   asi.sh help                    — Show this help
#
# State file path: .asi-state.json in CWD
# ===========================================================================

set -euo pipefail

STATE_FILE="${ASI_STATE_FILE:-.asi-state.json}"

# ---------------------------------------------------------------------------
# Node.js JSON helpers — runs inline, no temp files
# ---------------------------------------------------------------------------
node_json() {
  node -e "$1" -- "${@:2}"
}

# ---------------------------------------------------------------------------
# Read state (fast fail if corrupt)
# ---------------------------------------------------------------------------
read_state() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"cycle":0,"maxCycles":4,"lastUpdated":"","issues":[]}'
    return
  fi
  node -e "
    const f = require('fs').readFileSync('$STATE_FILE','utf8');
    let s; try { s = JSON.parse(f); } catch(e) { process.exit(2); }
    const required = ['cycle','maxCycles','lastUpdated','issues'];
    for (const k of required) { if (!(k in s)) process.exit(2); }
    if (typeof s.cycle !== 'number' || !Number.isInteger(s.cycle)) process.exit(2);
    for (const iss of s.issues) {
      const r = ['id','source','files','severity','description','dependencies','status','conflictRisk'];
      for (const k of r) { if (!(k in iss)) process.exit(2); }
    }
    console.log(JSON.stringify(s));
  " 2>/dev/null || echo '{"cycle":0,"maxCycles":4,"lastUpdated":"","issues":[]}'
}

# ---------------------------------------------------------------------------
# Write state
# ---------------------------------------------------------------------------
write_state() {
  local json="$1"
  echo "$json" > "$STATE_FILE"
}

# ---------------------------------------------------------------------------
# Subcommands
# ---------------------------------------------------------------------------

cmd_init() {
  local input
  if [[ -n "${1:-}" ]]; then
    input="$1"
  else
    input="$(cat)"
  fi
  local valid
  valid=$(node -e "
    let s; try { s = JSON.parse(process.argv[1]); } catch(e) { console.log('INVALID_JSON'); process.exit(0); }
    if (!s.issues || !Array.isArray(s.issues)) { console.log('MISSING_ISSUES'); process.exit(0); }
    s.cycle = s.cycle || 0;
    s.maxCycles = s.maxCycles || 4;
    s.lastUpdated = new Date().toISOString();
    for (const iss of s.issues) {
      iss.source = iss.source || 'manual';
      iss.status = iss.status || 'open';
      iss.conflictRisk = iss.conflictRisk || false;
      iss.dependencies = iss.dependencies || [];
    }
    console.log(JSON.stringify(s));
  " "$input")
  if [[ "$valid" == INVALID_JSON || "$valid" == MISSING_ISSUES ]]; then
    echo "ERROR: $valid" >&2
    exit 1
  fi
  write_state "$valid"
  echo "INITIALIZED"
}

cmd_select() {
  local state
  state="$(read_state)"
  node -e "
    const s = JSON.parse(process.argv[1]);
    const open = s.issues.filter(i => i.status === 'open');
    if (open.length === 0) { console.log('NONE'); process.exit(0); }

    // Build dependency map
    const openIds = new Set(open.map(i => i.id));
    const openMap = {};
    for (const i of open) openMap[i.id] = i;

    // Level 1: critical with zero unresolved dependencies
    let candidates = open.filter(i =>
      i.severity === 'critical' &&
      !i.dependencies.some(d => openIds.has(d))
    );

    // Level 2: unblocks most other issues
    if (candidates.length === 0) {
      const unblockCounts = {};
      for (const i of open) {
        for (const d of i.dependencies) {
          if (openIds.has(d)) unblockCounts[d] = (unblockCounts[d] || 0) + 1;
        }
      }
      const maxUnblock = Math.max(...Object.values(unblockCounts), 0);
      candidates = maxUnblock > 0 ? open.filter(i => (unblockCounts[i.id] || 0) === maxUnblock) : [];
    }

    // Level 3: highest severity with fewest file overlaps
    if (candidates.length === 0) {
      const sevOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      const maxSev = Math.max(...open.map(i => sevOrder[i.severity] || 0));
      const sevFiltered = open.filter(i => (sevOrder[i.severity] || 0) === maxSev);
      // Among same severity, pick one with fewest file overlaps with other open issues
      let minOverlap = Infinity;
      for (const i of sevFiltered) {
        let overlap = 0;
        for (const j of open) {
          if (i.id === j.id) continue;
          if (j.files.some(f => i.files.includes(f))) overlap++;
        }
        if (overlap < minOverlap) minOverlap = overlap;
      }
      candidates = sevFiltered.filter(i => {
        let overlap = 0;
        for (const j of open) {
          if (i.id === j.id) continue;
          if (j.files.some(f => i.files.includes(f))) overlap++;
        }
        return overlap === minOverlap;
      });
    }

    // Level 4: smallest change surface (fallback — alphabetical tiebreak)
    if (candidates.length === 0) candidates = open;
    candidates.sort((a, b) => a.id.localeCompare(b.id));
    console.log(candidates[0].id);
  " "$state"
}

cmd_get() {
  local id="${1:-}"
  [[ -n "$id" ]] || { echo "ERROR: usage: asi.sh get <id>" >&2; exit 1; }
  local state
  state="$(read_state)"
  node -e "
    const s = JSON.parse(process.argv[1]);
    const iss = s.issues.find(i => i.id === process.argv[2]);
    if (!iss) { console.log('NOT_FOUND'); process.exit(0); }
    console.log('id:           ' + iss.id);
    console.log('source:       ' + (iss.source || '-'));
    console.log('files:        ' + iss.files.join(', '));
    console.log('severity:     ' + iss.severity);
    console.log('description:  ' + iss.description);
    console.log('dependencies: ' + (iss.dependencies.length ? iss.dependencies.join(', ') : 'none'));
    console.log('status:       ' + iss.status);
    console.log('conflictRisk: ' + (iss.conflictRisk ? 'true' : 'false'));
    if (iss.blockedReason) console.log('blockedReason: ' + iss.blockedReason);
  " "$state" "$id"
}

cmd_list_open() {
  local state
  state="$(read_state)"
  node -e "
    const s = JSON.parse(process.argv[1]);
    const open = s.issues.filter(i => i.status === 'open');
    for (const i of open) console.log(i.id);
  " "$state"
}

cmd_mark_fixed() {
  local id="${1:-}"
  [[ -n "$id" ]] || { echo "ERROR: usage: asi.sh mark-fixed <id>" >&2; exit 1; }
  local state
  state="$(read_state)"
  local updated
  updated="$(node -e "
    const s = JSON.parse(process.argv[1]);
    const iss = s.issues.find(i => i.id === process.argv[2]);
    if (!iss) { console.log('NOT_FOUND'); process.exit(0); }
    iss.status = 'fixed';
    console.log(JSON.stringify(s));
  " "$state" "$id")"
  if [[ "$updated" == NOT_FOUND ]]; then echo "ERROR: issue $id not found" >&2; exit 1; fi
  write_state "$updated"
  echo "FIXED:$id"
}

cmd_mark_blocked() {
  local id="${1:-}"
  local reason="${2:-}"
  [[ -n "$id" ]] || { echo "ERROR: usage: asi.sh mark-blocked <id> <reason>" >&2; exit 1; }
  local state
  state="$(read_state)"
  local updated
  updated="$(node -e "
    const s = JSON.parse(process.argv[1]);
    const iss = s.issues.find(i => i.id === process.argv[2]);
    if (!iss) { console.log('NOT_FOUND'); process.exit(0); }
    iss.status = 'blocked';
    iss.blockedReason = process.argv[3];
    console.log(JSON.stringify(s));
  " "$state" "$id" "$reason")"
  if [[ "$updated" == NOT_FOUND ]]; then echo "ERROR: issue $id not found" >&2; exit 1; fi
  write_state "$updated"
  echo "BLOCKED:$id"
}

cmd_complete_cycle() {
  local state
  state="$(read_state)"
  local updated
  updated="$(node -e "
    const s = JSON.parse(process.argv[1]);
    s.cycle = (s.cycle || 0) + 1;
    s.lastUpdated = new Date().toISOString();
    console.log(JSON.stringify(s));
  " "$state")"
  write_state "$updated"
  echo "CYCLE:$(node -e "console.log(JSON.parse(process.argv[1]).cycle)" "$updated")"
}

cmd_status() {
  local state
  state="$(read_state)"
  node -e "
    const s = JSON.parse(process.argv[1]);
    const open = s.issues.filter(i => i.status === 'open').length;
    const fixed = s.issues.filter(i => i.status === 'fixed' || i.status === 'resolved-by-side-effect').length;
    const blocked = s.issues.filter(i => i.status === 'blocked').length;
    const total = s.issues.length;
    console.log('cycle:      ' + s.cycle + '/' + s.maxCycles);
    console.log('updated:    ' + (s.lastUpdated || '-'));
    console.log('total:      ' + total);
    console.log('open:       ' + open);
    console.log('fixed:      ' + fixed);
    console.log('blocked:    ' + blocked);
  " "$state"
}

cmd_check_corrupt() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "CLEAN:no-state-file"
    exit 0
  fi
  local result
  result="$(node -e "
    const f = require('fs').readFileSync('$STATE_FILE','utf8');
    let s;
    try { s = JSON.parse(f); } catch(e) { console.log('CORRUPT:invalid-json'); process.exit(0); }
    const required = ['cycle','maxCycles','lastUpdated','issues'];
    for (const k of required) { if (!(k in s)) { console.log('CORRUPT:missing-root-key-' + k); process.exit(0); } }
    if (typeof s.cycle !== 'number' || !Number.isInteger(s.cycle)) { console.log('CORRUPT:cycle-not-integer'); process.exit(0); }
    for (let i = 0; i < s.issues.length; i++) {
      const iss = s.issues[i];
      const r = ['id','source','files','severity','description','dependencies','status','conflictRisk'];
      for (const k of r) { if (!(k in iss)) { console.log('CORRUPT:issue-' + i + '-missing-' + k); process.exit(0); } }
    }
    console.log('CLEAN');
  " 2>/dev/null || echo "CORRUPT:read-error")"
  echo "$result"
  if [[ "$result" == CLEAN* ]]; then exit 0; else exit 1; fi
}

cmd_add_issue() {
  local input
  if [[ -n "${1:-}" ]]; then
    input="$1"
  else
    input="$(cat)"
  fi
  local state
  state="$(read_state)"
  local updated
  updated="$(node -e "
    const s = JSON.parse(process.argv[1]);
    let iss;
    try { iss = JSON.parse(process.argv[2]); } catch(e) { console.log('INVALID_ISSUE_JSON'); process.exit(0); }
    if (!iss.id || !iss.files || !iss.severity) { console.log('MISSING_REQUIRED_FIELDS'); process.exit(0); }
    iss.source = iss.source || 'manual';
    iss.status = iss.status || 'open';
    iss.conflictRisk = iss.conflictRisk || false;
    iss.dependencies = iss.dependencies || [];
    iss.description = iss.description || '';
    s.issues.push(iss);
    console.log(JSON.stringify(s));
  " "$state" "$input")"
  if [[ "$updated" == INVALID_ISSUE_JSON || "$updated" == MISSING_REQUIRED_FIELDS ]]; then
    echo "ERROR: $updated" >&2
    exit 1
  fi
  write_state "$updated"
  echo "ADDED"
}

cmd_mark_resolved_side_effect() {
  local id="${1:-}"
  [[ -n "$id" ]] || { echo "ERROR: usage: asi.sh mark-resolved-side-effect <id>" >&2; exit 1; }
  local state
  state="$(read_state)"
  local updated
  updated="$(node -e "
    const s = JSON.parse(process.argv[1]);
    const iss = s.issues.find(i => i.id === process.argv[2]);
    if (!iss) { console.log('NOT_FOUND'); process.exit(0); }
    iss.status = 'resolved-by-side-effect';
    console.log(JSON.stringify(s));
  " "$state" "$id")"
  if [[ "$updated" == NOT_FOUND ]]; then
    echo "ERROR: issue $id not found" >&2
    exit 1
  fi
  write_state "$updated"
  echo "RESOLVED_SIDE_EFFECT:$id"
}

cmd_help() {
  cat <<'EOF'
asi.sh — ASI Loop State Machine Driver

Usage:
  asi.sh init <json>                          Init state from JSON string or stdin
  asi.sh select                               Run priority waterfall, print selected ID
  asi.sh status                               Print cycle count + open/fixed/blocked
  asi.sh list-open                            Print IDs of all open issues (one per line)
  asi.sh get <id>                             Print formatted details of one issue
  asi.sh mark-fixed <id>                      Set issue status to "fixed"
  asi.sh mark-blocked <id> <reason>           Set issue status to "blocked"
  asi.sh mark-resolved-side-effect <id>       Set issue status to "resolved-by-side-effect"
  asi.sh add-issue <json>                     Append a new issue from JSON or stdin
  asi.sh complete-cycle                       Increment cycle, update lastUpdated, write
  asi.sh check-corrupt                        Validate state; exit 0=valid, 1=corrupt
  asi.sh help                                 Show this help

State file: $STATE_FILE (or set ASI_STATE_FILE env var)
EOF
}

# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------
COMMAND="${1:-help}"

case "$COMMAND" in
  init)            shift; cmd_init "$@" ;;
  select)          cmd_select ;;
  status)          cmd_status ;;
  list-open)       cmd_list_open ;;
  get)             shift; cmd_get "$@" ;;
  mark-fixed)      shift; cmd_mark_fixed "$@" ;;
  mark-blocked)    shift; cmd_mark_blocked "$@" ;;
  mark-resolved-side-effect)  shift; cmd_mark_resolved_side_effect "$@" ;;
  complete-cycle)  cmd_complete_cycle ;;
  check-corrupt)   cmd_check_corrupt ;;
  add-issue)       shift; cmd_add_issue "$@" ;;
  help|--help|-h)  cmd_help ;;
  *)
    echo "ERROR: unknown command: $COMMAND" >&2
    cmd_help
    exit 1
    ;;
esac
