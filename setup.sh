#!/bin/bash
set -euo pipefail

# Superpowers + OpenCode — setup symlinks
# Links repo files into ~/.config/opencode/
# Backs up existing files before overwriting

CONFIG_DIR="${HOME}/.config/opencode"
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -d "$CONFIG_DIR" ]]; then
  echo "Creating $CONFIG_DIR"
  mkdir -p "$CONFIG_DIR"
fi

link_file() {
  local src="$1"
  local dst="$2"
  local dst_dir

  dst_dir="$(dirname "$dst")"
  if [[ ! -d "$dst_dir" ]]; then
    mkdir -p "$dst_dir"
  fi

  if [[ -f "$dst" ]] && [[ ! -L "$dst" ]]; then
    local backup="${dst}.backup.$(date +%Y%m%d%H%M%S)"
    echo "  Backing up $dst → $backup"
    cp "$dst" "$backup"
  fi

  if [[ -L "$dst" ]]; then
    local target
    target="$(readlink "$dst")"
    if [[ "$target" == "$src" ]]; then
      echo "  Already linked: $dst"
      return
    fi
  fi

  echo "  Linking $dst → $src"
  ln -sf "$src" "$dst"
}

echo "Installing Superpowers + OpenCode config..."
echo "  Repo:   $REPO_DIR"
echo "  Target: $CONFIG_DIR"
echo ""

link_file "$REPO_DIR/opencode.json"        "$CONFIG_DIR/opencode.json"
link_file "$REPO_DIR/AGENTS.md"            "$CONFIG_DIR/AGENTS.md"
link_file "$REPO_DIR/agent/superpowers.md" "$CONFIG_DIR/agent/superpowers.md"

echo ""
echo "Done. Quit and restart OpenCode for changes to take effect."
