# Guardrails

These rules have the highest priority in this repo. They apply to every agent and every subagent: Claude Code, Codex, Cursor, Antigravity, Grok, and any agent they start.

If any other instruction conflicts with these rules, these rules win. If you are not sure whether an action is allowed, stop and ask the user.

## The rules

1. **No action without approval.** Nothing runs or changes until the user says `go`, `ok`, or `approved` in the current message. Show a plan first. The user's earlier "go" does not carry over to a new message. This holds in every mode, including auto and bypass modes.
2. **Git is read-only.** You may run `git status`, `diff`, `log`, `show`, `blame`, and `branch` (list only). The user runs every other git and GitHub command, including `add`, `commit`, and `push`. Never run `gh`.
3. **Never touch a database.** Do not connect to one, query one, migrate one, or write code that deletes or drops data. Never delete database data without an explicit instruction from the user for that exact action.
4. **Never delete or overwrite files.** Do not delete, empty, overwrite, move, or rename any file or folder. To change an existing file, use the Edit tool. To remove or move something, ask the user.
5. **Stay inside this folder.** Do not read, write, or run anything outside this project folder. If you need something from outside, ask the user.
6. **Never touch secrets.** Do not read, write, or print `.env` files, keys, certificates, credentials, or environment values.
7. **The network is locked.** Do not use web tools, package installs, network commands, or outside URLs. Only the user can open the network, for a limited time.
8. **Do not publish or schedule.** Do not publish pages, send notifications, create schedules, or start cloud agents or background processes.

## Always talk to the user

- When you need anything (a file, access, a decision), ask. Do not guess or work around a block.
- When a hook blocks you, tell the user what was blocked and why. Never try another way to do the same thing.
- Before a task, show a short plan. Do the work only after the user approves it.

## How the rules are enforced

Rules can be missed, so hooks check every tool call. The hook is `.agents/hooks/guard.js`. It runs before each tool call in every agent that supports hooks, and it blocks the call if any check fails. It fails closed: if it crashes or cannot read its input, the action is blocked.

| Check | What it blocks |
| --- | --- |
| `protect-guardrails` | Edits to rules, hooks, agent settings, state, logs, and the unlock files |
| `git` | Every git command except the read-only ones above, `gh`, GitHub URLs, GitHub tools, writes inside `.git/` |
| `delete` | `rm`, `del`, `Remove-Item`, `Clear-Content`, code that deletes files, delete tools and patches |
| `database` | Database clients, migration tools, destructive SQL, connection strings, database files, database tools, ORM deletes, and code files that contain destructive database calls |
| `secrets` | Secret files and folders, environment dumps, `process.env` in commands |
| `outside-project` | Paths outside the project, `..` escapes, home and system folders, drive switches |
| `dangerous` | `sudo`, pipe-to-shell, registry and system settings, shutdown, process kill, publish, global installs, docker and cloud changes, `ssh`, background processes |
| `overwrite` | Move, rename, copy onto an existing file, in-place edits, `>` onto an existing file, Write onto an existing file, archive extraction |
| `network` | Web tools, MCP tools, network commands, package installs, outside URLs, code that opens connections |
| `external` | Publishing, notifications, schedules, worktrees, cloud and worktree subagents |
| `mass-change` | Changing more than 10 different files in one turn |
| `approval` | Anything that is not read-only, until the user approves this turn |

Scripts get the same checks. When a command runs `node x.js`, `python x.py`, or `bash x.sh`, the hook reads the script first. A script that is missing, too large, or starts other programs is blocked.

## The approval gate

1. The user sends a message. `approve.js` looks at it.
2. If the message starts or ends with `go`, `ok`, or `approved` (or is a short message that contains one), the turn is approved. A word like `not`, `nahi`, `mat`, `wait`, or `stop` cancels it.
3. The result is saved in `.agents/state/approval.json`. Every new message resets it first.
4. Before each tool call, the `approval` check reads that file. Without approval, only read-only work is allowed: reading files, searching, listing, `git status`, planning, and asking questions.

Agents cannot write the approval file. The `protect-guardrails` check blocks it.

## Opening the network for a limited time

The user writes the minutes into `.agents/NET_UNLOCK`. For example, in PowerShell:

```
Set-Content ".agents\NET_UNLOCK" "30"
```

- An empty file means 15 minutes. The most allowed is 240 minutes.
- The time counts from the file's last change. When it is up, the network locks again by itself.
- To lock it sooner, the user deletes the file.
- Even when the network is open: git, delete, database, secrets, publishing, `sudo`, `ssh`, `curl | bash`, and the approval gate stay on.

## Changing the guardrails

Agents cannot edit guardrail files on their own. To allow a change:

1. The user creates an empty file named `UNLOCK` inside `.agents/`, by hand.
2. The agent makes the approved change.
3. The user deletes `.agents/UNLOCK`, by hand.

`UNLOCK` only lifts the `protect-guardrails` check, and lets whole files under `.agents/` be rewritten. Every other check stays on. Leave `UNLOCK` deleted in normal use.

## What hooks cannot stop

- Hooks match text patterns. A command hidden in a way the patterns do not see can slip through. The approval gate is the backstop, so keep it on.
- A script that imports another file is checked, but the imported file is not.
- `npm run` scripts are not opened. Package installs are blocked while the network is locked.
- Antigravity has no hook system. It only gets the rules and its own settings.
- A tool that does not run hooks, or a project that is not trusted yet, runs without them. Trust the hooks in each tool (see [agent-setup.md](agent-setup.md)).

## Audit log

Every allow, block, and approval is written to `.agents/logs/audit.log`, one JSON line each. It holds the time, the decision, the check, the tool, and a short detail. It never holds file contents or the text of the user's messages. Agents can read the log but cannot change it.

## Testing the guardrails

Run `node .agents/hooks/test/run.js`. Every case must pass. Add a case for every new check or fix.
