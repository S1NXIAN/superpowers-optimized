---
name: token-efficiency
description: Always-on operational standard for every response. Controls verbosity, parallelizes tool calls, and minimizes context waste in every turn regardless of other active skills.
---

# Token Efficiency

## Overview

Every token is budget. Maximize signal per token in every response.

**Core principle:** Lead with the answer. No preambles, no narration, no redundant context.

## The Rules

### Response Rules

1. **Lead with the Answer** — Put the conclusion first, then evidence. Never: "Let me analyze this..." Just analyze.
2. **No Preambles** — No "Certainly!", "Great question!", "Let me help you with that." Nothing before the answer.
3. **No Narration** — Never explain what you ARE about to do. Just execute. "Let me check the file" → just read the file.
4. **Structured Output** — Prefer bullet points, tables, and code blocks over prose paragraphs.
5. **Batch Clarifications** — If you have multiple questions, ask ALL of them in one turn. Not one at a time.

### Tool Execution Rules

1. **Parallelism** — Batch ALL independent tool calls in a single response turn. Never serialize independent reads.
2. **No Redundant Reads** — Never re-read a file unless it was modified since the last read. Use search tools to find content instead of reading directories.
3. **Search over Read** — Use `grep` and `glob` to find content before reading entire files. A targeted search is cheaper than a full read.

### Agent & History Rules

1. **Direct Conclusions** — Sub-agents must return compressed summaries, not raw file contents. Never use a sub-agent as a data relay.
2. **Clean Handoffs** — When switching phases (Research → Planning → Implementation), clear context of the previous phase. Don't carry forward irrelevant history.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Preambles before answers | Lead with the result. Add context after. |
| Serial tool calls | Batch all independent calls in one response. |
| Re-reading unchanged files | Cache file state. Read once. |
| Restating the user's request | The user knows what they asked. Answer it. |
| Explaining what you're about to do | Just do it. Narration is noise. |
| Forwarding full history to subagents | Construct fresh prompts. Only include what they need. |
| Raw file content in agent summaries | Compress. Synthesize. Don't relay. |

## Rationalization Table

| Temptation | Danger |
|------------|--------|
| "I'll explain my reasoning first" | Dilutes the signal of the answer. Show reasoning after the answer. |
| "I'll read these 5 files one by one" | More turns = more overhead. Batch them. |
| "I'll restate the user's request" | Wastes context window for zero gain. |
| "I'll be thorough and narrate my process" | Process narration is noise. Results are signal. |
| "Let me forward the full file to the subagent" | The subagent doesn't need 200 lines of irrelevant file. Provide the 5 lines they need. |

## Red Flags

- Starting a response with anything other than the direct answer
- Serializing tool calls that could be parallel
- Re-reading a file you just read
- Forwarding full session history to a subagent
- Saying "Let me" before doing something (just do it)

## Integration

**Active for:** every response turn, regardless of other skills. This is the always-on baseline protocol.
