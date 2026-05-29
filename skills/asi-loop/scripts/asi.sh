#!/usr/bin/env bash
# ===========================================================================
# asi.sh — Wrapper that delegates to scripts/asi.sh (canonical location)
#
# This file exists at the original path for backward compatibility.
# The canonical script lives at scripts/asi.sh.
# ===========================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CANONICAL="$SCRIPT_DIR/../../../scripts/asi.sh"
if [[ -x "$CANONICAL" ]]; then
  exec "$CANONICAL" "$@"
else
  echo "ERROR: canonical asi.sh not found at $CANONICAL" >&2
  echo "Reinstall with: node bin/setup.mjs" >&2
  exit 1
fi
