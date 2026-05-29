#!/usr/bin/env bash

set -euo pipefail

# Zeus 2.0 Skills Utility

readonly COMMAND="${1:-}"

# Function to determine audit tags based on filename and content signatures
get_audit_tags() {
    local -r file="$1"
    local tags=()
    
    # 0. Check for Manual Overrides (@zeus: [tag] or @zeus: strike-team)
    if [[ -f "$file" ]]; then
        if grep -qi "@zeus: strike-team" "$file"; then
            echo "architect cleaner hacker qa-pro"
            return
        fi
        
        # Specific tag overrides
        for tag in "architect" "cleaner" "hacker" "qa-pro"; do
            if grep -qi "@zeus: $tag" "$file"; then
                tags+=("$tag")
            fi
        done
    fi

    # 1. Filename Heuristics (Quick Pass)
    if [[ "$file" =~ \.(js|ts|py|go|rs|rb|php|java|c|cpp|cs|swift|kt)$ ]]; then
        tags+=("cleaner")
    fi
    if [[ "$file" =~ (\.test\.|\.spec\.|tests/|coverage/|mock|fixture|stub) ]]; then
        tags+=("qa-pro")
    fi
    if [[ "$file" =~ (auth|security|crypto|login|token|permissions|acl|encrypt|decrypt|hash|cors|policy|secret) ]]; then
        tags+=("hacker")
    fi
    if [[ "$file" =~ (arch|schema|model|core|main|index|interface|api|route|controller|service|repository|provider|middleware|hook|context|adapter|factory) ]]; then
        tags+=("architect")
    fi

    # 2. Content Signatures (Semantic Deep Pass)
    if [[ -f "$file" ]]; then
        # Hacker Signatures (Security/Auth)
        if grep -qiE "(password|secret|jwt|verify|apiKey|credential|OAuth|Bearer|private_key|encrypt|decrypt)" "$file"; then
            tags+=("hacker")
        fi

        # QA_PRO Signatures (Testing/Assertion)
        if grep -qiE "(describe\(|it\(|test\(|expect\(|assert|suite|fixture|spyOn|mock)" "$file"; then
            tags+=("qa-pro")
        fi

        # Architect Signatures (Structure/Patterns)
        if grep -qiE "(interface|abstract class|implements|extends|Singleton|Factory|Provider|Controller|Service|Repository)" "$file"; then
            tags+=("architect")
        fi

        # Cleaner Signatures (Maintenance/Tech Debt)
        if grep -qiE "(TODO|FIXME|HACK|deprecated|unused|@deprecated)" "$file"; then
            tags+=("cleaner")
        fi
    fi

    # 3. Fallback: Ensure at least architect if no tags found
    if [[ ${#tags[@]} -eq 0 ]]; then
        tags+=("architect")
    fi

    # Output unique space-separated tags
    echo "${tags[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs
}

case "$COMMAND" in
    list)
        if [[ -d "skills" ]]; then
            if command -v fd >/dev/null 2>&1; then
                fd . "skills/" --max-depth 1 --type d --exec basename {}
            elif command -v fdfind >/dev/null 2>&1; then
                fdfind . "skills/" --max-depth 1 --type d --exec basename {}
            else
                ls -F "skills/"
            fi
        else
            echo "Error: skills/ directory not found." >&2
            exit 1
        fi
        ;;
    bootstrap)
        if [[ -f "$HOME/.config/opencode/bin/init-memory.mjs" ]]; then
            node "$HOME/.config/opencode/bin/init-memory.mjs"
        else
            echo "Error: $HOME/.config/opencode/bin/init-memory.mjs not found." >&2
            exit 1
        fi
        ;;
    audit)
        FILE="${2:-}"
        if [[ -z "$FILE" ]]; then
            echo "Usage: $0 audit <file>" >&2
            exit 1
        fi
        get_audit_tags "$FILE"
        ;;
    *)
        echo "Usage: $0 {list|bootstrap|audit <file>}" >&2
        exit 1
        ;;
esac
