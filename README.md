# Superpowers + OpenCode

Optimized OpenCode configuration for [Superpowers](https://github.com/obra/superpowers)-driven development.

## What's Inside

| File | Purpose |
|------|---------|
| `opencode.json` | Global OpenCode config: DeepSeek V4 Flash Free, superpowers agent as default, Google provider |
| `AGENTS.md` | User instructions aligning the agent with Superpowers (highest priority in instruction hierarchy) |
| `agent/superpowers.md` | Custom orchestrator agent: handles planning, review, subagent dispatch — not implementation |
| `setup.sh` | Installs symlinks to `~/.config/opencode/` |

## How It Works

The `superpowers` agent is set as `default_agent`. Every session starts with:
- **Superpowers skills auto-triggering** via the plugin bootstrap
- **AGENTS.md** reinforcing skill authority (can't be overridden since user instructions are highest priority)
- **DeepSeek V4 Flash Free** model with max thinking for architecture/planning/review
- **Orchestrator mindset**: you brainstorm → plan → dispatch subagents — you don't implement

## Installation

```bash
# Clone or copy to target machine
git clone <this-repo-url> ~/superpowers-opencode

# Install symlinks
cd ~/superpowers-opencode
./setup.sh

# Quit and restart OpenCode
```

## Prerequisites

- OpenCode installed
- [Superpowers plugin](https://github.com/obra/superpowers) available (Zen models for free access)

## Customization

Edit `opencode.json` to change:
- `provider` section for your API keys/whitelists
- `plugin` array for your plugin setup
- `model` / `small_model` for different model preferences
