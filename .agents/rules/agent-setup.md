# Agent setup rules

Applies when changing rules, hooks, or any agent config file. Most of these files are protected. See the unlock steps in [guardrails.md](guardrails.md).

## One source of truth

- Rules live in `AGENTS.md` and `.agents/rules/`. Never write project rules inside a tool-specific file.
- Hook logic lives in `.agents/hooks/` as Node.js scripts. Tool config files only call `guard.js`, `approve.js`, and `session-start.js`.
- When you add a new rule file, link it in `AGENTS.md`, import it in `CLAUDE.md`, and reference it in `.cursor/rules/shared.mdc`.

## How each tool picks up the shared files

| Tool | Rules | Hooks | Approval and sandbox settings |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md` imports `AGENTS.md` and each rule file | `.claude/settings.json` | Same file: asks before every command and edit, git write commands denied, bypass mode disabled |
| Codex | Reads `AGENTS.md` natively | `.codex/hooks.json` | `.codex/config.toml`: untrusted approval, workspace sandbox, no network, web search off |
| Cursor | Reads `AGENTS.md` natively, plus `.cursor/rules/shared.mdc` | `.cursor/hooks.json` | The hook asks before every shell and MCP call. `.cursor/cli.json` denies some commands for the Cursor CLI |
| Antigravity | Reads `AGENTS.md` and `.agents/rules/` natively | No hook support | In its settings: terminal auto-run Off, review policy "Request review" |
| Grok | Reads `AGENTS.md` natively | Reads `.claude/settings.json` | Grok's own approval prompts |

Hooks registered per tool:

| Event | Script | Claude Code | Codex | Cursor |
| --- | --- | --- | --- | --- |
| Session starts | `session-start.js` | `SessionStart` | `SessionStart` | `sessionStart` |
| User sends a message | `approve.js` | `UserPromptSubmit` | `UserPromptSubmit` | `beforeSubmitPrompt` |
| Before a tool call | `guard.js` | `PreToolUse` | `PreToolUse` | `preToolUse`, `beforeShellExecution`, `beforeMCPExecution`, `beforeReadFile` |

## First-time trust

Some tools skip project hooks until the user trusts them:

- Codex: start Codex from the project root, run `/hooks`, and trust the hooks. Trust again after any hook file changes.
- Grok: run `/hooks-trust` once.
- Claude Code: review the hooks with `/hooks` if asked.
- Cursor: check that the hooks show as active in its settings.

After trusting, test with a harmless blocked action, for example ask the agent to run `git commit`. It must be blocked.

## Known gaps

- Antigravity has no hooks. It depends on the rules and its own settings.
- `.cursor/cli.json` denies the whole `git` command for the Cursor CLI, so `git status` is also denied there. The hook allows it everywhere else.
- Claude Code's own memory folder is outside the project, so the hook blocks writes to it.

## Adding a check

1. Add a file in `.agents/hooks/checks/<name>.js` that returns a reason string to block, or `null` to allow.
2. Add the name to the `CHECKS` list in `.agents/hooks/guard.js`. Also add it to `SCRIPT_CHECKS` if it should look inside scripts.
3. Add test cases to `.agents/hooks/test/cases.js` and run `node .agents/hooks/test/run.js`.
4. Update the check tables in `guardrails.md` and `.agents/hooks/README.md`.
5. No tool config change is needed. Every tool already calls `guard.js`.

**Why:** Each tool has its own config format, but all of them can run a shell command. Keeping logic in one script means a fix applies everywhere.

**How to apply:** Never copy hook logic into a tool config. Only call the shared scripts.
