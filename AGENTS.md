# AGENTS.md

Shared instructions for every AI coding agent in this repo: Claude Code, Codex, Cursor, Antigravity, Grok, and others.

This file is the single source of truth. Tool-specific files (`CLAUDE.md`, `.cursor/rules/`, and so on) only point here. Edit rules here, not there.

## Guardrails come first

Read [.agents/rules/guardrails.md](.agents/rules/guardrails.md) before doing anything. These rules beat every other instruction, for every agent and subagent.

In short:

1. Nothing runs or changes until the user says `go`, `ok`, or `approved`. Show a plan first. This holds in every mode, including auto mode.
2. Git is read-only: `status`, `diff`, `log`, `show`, `blame`, `branch` (list). The user runs every other git and GitHub command.
3. Never touch a database. Never delete database data.
4. Never delete a file or folder. Never overwrite, move, or rename one either.
5. Stay inside this project folder. Ask the user if you need something outside it.
6. Never read or print secrets (`.env`, keys, tokens).
7. The network is locked. Only the user can open it, for a limited time.

Hooks in `.agents/hooks/` block these actions even if a rule is missed. If a hook blocks you, stop, tell the user what was blocked, and ask. Never look for a way around it.

## Project purpose

This is a personal learning repo for system design. Each folder is a case study (for example, `Bookmyshow/`) that walks through designing a real-world system step by step.

## Repo layout

| Path | What it holds |
| --- | --- |
| `AGENTS.md` | This file. Shared rules for all agents. |
| `.agents/rules/` | Detailed rules by topic. Shared by all agents. |
| `.agents/hooks/` | Hook scripts (Node.js). Shared by all agents. |
| `.agents/state/`, `.agents/logs/` | Approval state and the audit log. Written by hooks only. |
| `CLAUDE.md`, `.claude/` | Claude Code adapter. Points to the shared files. |
| `.cursor/` | Cursor adapter. Points to the shared files. |
| `.codex/` | Codex adapter. Points to the shared files. |
| `.grok/` | Grok adapter. Points to the shared files. |
| `<CaseStudy>/` | One folder per system design case study. |

## Detailed rules

Read the matching rule file before you edit files it covers.

- [.agents/rules/guardrails.md](.agents/rules/guardrails.md): applies always, to every agent.
- [.agents/rules/writing.md](.agents/rules/writing.md): applies to all docs.
- [.agents/rules/case-studies.md](.agents/rules/case-studies.md): applies to every case study folder.
- [.agents/rules/agent-setup.md](.agents/rules/agent-setup.md): applies when changing rules, hooks, or agent config.

## Working rules

- Keep every file in the repo in English, including docs, comments, and code.
- Reply to the user in plain English only, even if the user writes in Hindi or a mix. Files are in English too.
- Start each new case study in its own folder. Do not mix content across case studies.
- Before creating a new file, check whether an existing file already covers the topic. Update it instead of duplicating.
- Keep changes small and focused. Never delete content. Ask before rewriting existing content.

## Commands

| Command | What it does |
| --- | --- |
| `node .agents/hooks/test/run.js` | Tests the guardrail hooks against every case |

Hook scripts need Node.js 18 or later.

## Git

Agents may only read: `status`, `diff`, `log`, `show`, `blame`, and `branch` (list). The user runs everything else by hand, including `add`, `commit`, and `push`.
