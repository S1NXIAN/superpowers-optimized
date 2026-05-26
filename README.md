# Superpowers + OpenCode

**Optimized OpenCode configuration for [Superpowers](https://github.com/obra/superpowers)-driven development.**

Turns OpenCode into a disciplined orchestrator that brainstorms designs, writes plans, dispatches
subagents with TDD, reviews code systematically, and verifies before claiming completion.

## Features

- **Superpowers-optimized default agent** — orchestrator mindset, not implementer
- **AGENTS.md alignment** — user instructions that reinforce skill authority (highest priority)
- **DeepSeek V4 Flash Free** — capable reasoning for architecture/planning/review, fast enough for iteration
- **Self-validating setup** — checks Superpowers is installed before configuring
- **Safe install** — backs up existing files, shows diff, asks before overwriting

## Prerequisites

- [OpenCode](https://opencode.ai) installed and started at least once
- [Superpowers plugin](https://github.com/obra/superpowers) installed in OpenCode:

  ```json
  "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
  ```

- A Zen model subscription or free model access (the default `deepseek-v4-flash-free` is a free Zen model)

## Quick Start

```bash
# Clone
git clone <repo-url> ~/superpowers-opencode

# Install (symlinks repo → ~/.config/opencode/)
cd ~/superpowers-opencode
./setup.sh

# Quit and restart OpenCode
```

The setup script will:
1. Verify OpenCode exists at `~/.config/opencode/`
2. Verify the Superpowers plugin is declared and installed
3. Validate your existing `opencode.json` is valid JSON
4. Show a diff of planned changes
5. Back up existing files before overwriting
6. Symlink repo files → config directory
7. Verify everything is connected correctly

### Non-interactive install

```bash
./setup.sh --force     # skip prompts
./setup.sh --dry-run   # preview only, no changes
```

## What's Installed

| File | Destination | Purpose |
|------|-------------|---------|
| `opencode.json` | `~/.config/opencode/opencode.json` | Model, plugins, default_agent, instructions |
| `AGENTS.md` | `~/.config/opencode/AGENTS.md` | User instructions — highest priority (outranks skills) |
| `agent/superpowers.md` | `~/.config/opencode/agent/superpowers.md` | Custom orchestrator agent, set as default |

### Configuration details

- **`default_agent: "superpowers"`** — every session starts with the orchestrator agent
- **`instructions: ["AGENTS.md"]`** — Superpowers alignment is prepended to every conversation
- **`model: "opencode/deepseek-v4-flash-free"`** — primary reasoning model
- **`small_model: "opencode/deepseek-v4-flash-free"`** — used for subagent dispatch tasks
- **`superpowers` agent** — has full tool access (`edit`, `bash`, `task`, `read`) for orchestrator duties

## How It Works

When OpenCode starts, it:

1. Loads the Superpowers plugin → injects bootstrap → skills auto-trigger
2. Loads `AGENTS.md` → the agent is instructed to trust skills, follow workflow, use TDD
3. Uses the `superpowers` agent → orchestrator mindset by default

The result is an agent that:

- **Brainstorms** before building (captures intent, proposes 2-3 approaches)
- **Writes plans** with bite-sized tasks (2-5 min each, complete code in every step)
- **Dispatches subagents** for implementation (fresh context per task)
- **Reviews** spec compliance then code quality between tasks
- **Verifies** with fresh evidence before claiming completion
- **Debugs** systematically (root cause first, never random fixes)

## Verification

After installation, verify the setup:

```bash
# Check symlinks are correct
ls -la ~/.config/opencode/opencode.json
ls -la ~/.config/opencode/AGENTS.md
ls -la ~/.config/opencode/agent/superpowers.md

# Each should point to the repo:
#   ~/.config/opencode/opencode.json -> ~/superpowers-opencode/opencode.json
#   ...
```

Then restart OpenCode and try:

> "Let's build a todo list"

Superpowers should auto-trigger the `brainstorming` skill before any code is written.

## Customization

### Changing the model

Edit `opencode.json`:

```json
{
  "model": "opencode/gpt-5.5-pro",
  "small_model": "opencode/gpt-5.4-mini"
}
```

### Adding project-specific instructions

Add an `AGENTS.md` or `CLAUDE.md` to your project root. It merges with the global file
(project-level instructions take precedence).

### Modifying agent behavior

Edit `agent/superpowers.md`. The YAML frontmatter controls model, permissions, and visibility.
The body is the system prompt.

## Uninstall

```bash
cd ~/superpowers-opencode
./uninstall.sh
```

This removes the symlinks and restores the most recent backup if one exists.

To fully remove Superpowers from your config, delete the plugin line from `opencode.json`:

```diff
- "superpowers@git+https://github.com/obra/superpowers.git",
```

## Troubleshooting

### "Superpowers is not installed" error

1. Add the plugin to your `~/.config/opencode/opencode.json`:
   ```json
   "plugin": ["superpowers@git+https://github.com/obra/superpowers.git"]
   ```
2. Restart OpenCode so it resolves and installs the plugin.
3. Run `./setup.sh` again.

### Skills not auto-triggering

1. Verify Superpowers is in your plugin list: `grep superpowers ~/.config/opencode/opencode.json`
2. Check the plugin installed: `ls ~/.config/opencode/node_modules/superpowers/`
3. Restart OpenCode — config is loaded once at startup.
4. OpenCode >= 0.11.0 required for `experimental.chat.system.transform` hook support.

### "Command not found" during setup

The setup script uses standard POSIX tools. Install any missing tools:

```bash
# For JSON validation (optional — setup falls back to python3 or node)
sudo pacman -S jq          # Arch
sudo apt install jq        # Debian/Ubuntu
brew install jq            # macOS
```

## Updating

```bash
cd ~/superpowers-opencode
git pull
./setup.sh --force
```

Changes take effect after restarting OpenCode.

## Project Structure

```
superpowers-opencode/
├── AGENTS.md          # User instructions (highest priority)
├── LICENSE            # MIT
├── README.md          # This file
├── opencode.json      # OpenCode configuration
├── agent/
│   └── superpowers.md # Custom orchestrator agent
├── setup.sh           # Install script with validation
└── uninstall.sh       # Clean removal script
```

## License

MIT
