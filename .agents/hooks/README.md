# Shared hooks

One set of hook scripts used by every agent. Each tool config calls these scripts. The rules they enforce are in [guardrails.md](../rules/guardrails.md). Tool setup is in [agent-setup.md](../rules/agent-setup.md).

## Entry points

| Script | Runs when | What it does |
| --- | --- | --- |
| `guard.js` | Before every tool call | Runs all checks. Blocks the call if one fails. |
| `approve.js` | The user sends a message | Saves whether the user approved this turn. |
| `session-start.js` | A session starts | Shows the guardrails and the network state to the agent. |

## Contract for `guard.js`

- Runtime: Node.js 18 or later.
- Input: event JSON on stdin, in Claude Code, Codex, Cursor, or Grok format.
- Allow: exit 0. For Cursor, it also prints `{"permission":"allow"}`, or `"ask"` for shell and MCP calls.
- Block: reason on stderr, exit 2. For Cursor, it also prints `{"permission":"deny"}`.
- Fails closed: bad input or a crash blocks the action.

## Checks

Checks run in this order. A hard block is reported before "no approval".

| Check | Blocks |
| --- | --- |
| `protect-guardrails` | Edits to rules, hooks, agent settings, state, logs, and the unlock files |
| `git` | All git except `status`, `diff`, `log`, `show`, `blame`, `branch` (list). Also `gh`, GitHub, `.git/` |
| `delete` | `rm`, `del`, `Remove-Item`, code that deletes files, delete tools and patches |
| `database` | DB clients, migrations, destructive SQL, connection strings, `.db` files, ORM deletes, destructive DB code in code files |
| `secrets` | `.env`, keys, certificates, credentials, `.ssh/`, `.aws/`, environment dumps |
| `outside-project` | Paths outside the project, `..`, `~`, home and system variables |
| `dangerous` | `sudo`, pipe-to-shell, registry, shutdown, kill, publish, global installs, docker, cloud, `ssh`, `&` and other background starts |
| `overwrite` | Move, rename, copy onto a file, `sed -i`, `>` onto a file, Write onto a file, archive extraction |
| `network` | Web tools, non-allowed MCP tools, network commands, installs, outside URLs, network code. Opened by `NET_UNLOCK` |
| `external` | Artifact publish, notifications, schedules, monitors, worktrees, cloud and worktree subagents |
| `mass-change` | More than `maxFilesPerTurn` different files changed in one turn |
| `approval` | Anything that is not read-only, until the user approves this turn |

Script scan: when a command runs a script file, the `git`, `delete`, `database`, `secrets`, and `network` checks also run on the script text.

## Files

| Path | What it is |
| --- | --- |
| `guard.js` | Entry point for tool calls. |
| `approve.js` | Entry point for user messages. |
| `session-start.js` | Entry point for session start. |
| `lib/context.js` | Turns each tool's input format into one shape. |
| `lib/script-scan.js` | Finds and reads the scripts a command runs. |
| `lib/net-unlock.js` | Reads `.agents/NET_UNLOCK` and its time limit. |
| `lib/audit.js` | Writes the audit log. |
| `checks/` | One file per check. |
| `config.json` | Settings, see below. |
| `test/` | Test cases, unit tests, and script fixtures. |

State and logs live outside this folder:

| Path | What it is |
| --- | --- |
| `.agents/state/approval.json` | Approval for the current turn. Written by `approve.js`. |
| `.agents/state/changes.json` | Files changed in the current turn. Written by `guard.js`. |
| `.agents/logs/audit.log` | The audit log. |
| `.agents/UNLOCK` | Made by the user. Lets guardrail files be edited. |
| `.agents/NET_UNLOCK` | Made by the user. Opens the network for the minutes inside. |

## Settings in `config.json`

| Key | Meaning | Default |
| --- | --- | --- |
| `allowedOutsidePaths` | Folders outside the project that agents may use. | none |
| `allowedMcpServers` | MCP servers that stay allowed while the network is locked. | `claude-vscode` |
| `maxFilesPerTurn` | Most different files an agent may change in one turn. | 10 |

## Testing

Run `node .agents/hooks/test/run.js`. It runs every case in `test/cases.js` and the unit tests in `test/unit.js`. Test mode ignores the real `UNLOCK`, approval, network, and change-count state, so results do not depend on the current session.

Scripts in `test/fixtures/` hold blocked actions on purpose. They are only read by the hook in tests, never run.

## Limits

Hooks match text patterns. They can miss a command hidden in a way the patterns do not see. The approval gate is the backstop. See [guardrails.md](../rules/guardrails.md) for the full list of limits.
