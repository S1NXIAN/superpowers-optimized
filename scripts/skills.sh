#!/usr/bin/env bash
# ===========================================================================
# Zeus Elite — System Utility (skills.sh)
# Optimized for absolute speed and deterministic multi-tag routing.
# ===========================================================================

set -euo pipefail

readonly SKILLS_DIR="${HOME}/.config/opencode/skills/opencode-zeus"
readonly BIN_DIR="${HOME}/.config/opencode/bin"

# ---------------------------------------------------------------------------
# Skill Discovery (prefer fd, fallback to ls)
# ---------------------------------------------------------------------------
list_skills() {
    if command -v fd >/dev/null 2>&1; then
        fd . "$SKILLS_DIR" --max-depth 1 --type d --exec basename {}
    elif command -v fdfind >/dev/null 2>&1; then
        fdfind . "$SKILLS_DIR" --max-depth 1 --type d --exec basename {}
    else
        ls -F "$SKILLS_DIR" | grep '/' | sed 's/\///'
    fi
}

# ---------------------------------------------------------------------------
# Semantic Strike Team Router
# ---------------------------------------------------------------------------
get_audit_tags() {
    local -r file="$1"
    local tags=()
    
    [[ ! -f "$file" ]] && echo "architect" && return

    # Gate 0: Manual Overrides
    if grep -qi "@zeus: strike-team" "$file"; then
        echo "hacker architect qa-pro cleaner"
        return
    fi

    # Specific tag overrides
    for tag in "architect" "cleaner" "hacker" "qa-pro"; do
        if grep -qi "@zeus: $tag" "$file"; then
            tags+=("$tag")
        fi
    done

    # Gate 1: Security Siege (HACKER)
    if [[ "$file" =~ (auth|security|crypto|login|token|secret|key|acl|permissions|policy) ]] || \
       grep -qiE "(password|secret|jwt|verify|apiKey|credential|OAuth|Bearer|encrypt|decrypt)" "$file"; then
        tags+=("hacker")
    fi

    # Gate 2: Structural Integrity (ARCHITECT)
    if [[ "$file" =~ (arch|schema|model|core|interface|api|controller|service|repository) ]] || \
       grep -qiE "(interface|abstract class|implements|extends|Singleton|Factory)" "$file"; then
        tags+=("architect")
    fi

    # Gate 2.5: User Experience (DESIGNER)
    if [[ "$file" =~ (ui|ux|view|component|css|style|page|html|layout|asset|font) ]] || \
       grep -qiE "(className|styled|Component|JSX|HTML|Flex|Grid|color|font)" "$file"; then
        tags+=("designer")
    fi

    # Gate 3: Verification Depth (QA_PRO)
    if [[ "$file" =~ (\.test\.|\.spec\.|tests/|coverage/|mock|fixture) ]] || \
       grep -qiE "(describe\(|it\(|test\(|expect\(|assert|suite)" "$file"; then
        tags+=("qa-pro")
    fi

    # Gate 4: Somatic Cleanup (CLEANER)
    if [[ "$file" =~ \.(js|ts|py|go|rs|rb|php|java|c|cpp|cs|swift|kt)$ ]] || \
       grep -qiE "(TODO|FIXME|HACK|deprecated)" "$file"; then
        tags+=("cleaner")
    fi

    # Fallback to generalist
    [[ ${#tags[@]} -eq 0 ]] && tags+=("architect")

    echo "${tags[@]}" | tr ' ' '\n' | sort -u | xargs
}

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
case "${1:-}" in
    list)
        list_skills
        ;;
    bootstrap)
        node "$BIN_DIR/init-memory.mjs" --force
        ;;
    audit)
        [[ -z "${2:-}" ]] && { echo "Usage: $0 audit <file>" >&2; exit 1; }
        get_audit_tags "$2"
        ;;
    *)
        echo "Usage: $0 {list|bootstrap|audit <file>}" >&2
        exit 1
        ;;
esac
