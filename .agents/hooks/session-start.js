#!/usr/bin/env node
// Runs when an agent session starts (SessionStart / sessionStart).
// Puts the guardrails and the current lock state in front of the agent, so it does not forget them.
'use strict';

const fs = require('fs');
const path = require('path');
const net = require('./lib/net-unlock');

const ROOT = path.resolve(__dirname, '..', '..');

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function networkLine() {
  const state = net.status();
  return state.open
    ? `OPEN for about ${state.minutesLeft} more minutes (the user unlocked it).`
    : 'LOCKED. Web tools, package installs, and network commands are blocked. Only the user can unlock it.';
}

function buildMessage() {
  const lines = [
    '[guardrails] Read .agents/rules/guardrails.md. These rules apply to every agent and subagent:',
    '1. Nothing runs or changes without the user saying go, ok, or approved. Show a plan first and wait.',
    '2. Git is read-only: status, diff, log, show, blame, branch (list). The user runs everything else.',
    '3. Never touch a database. Never delete database data.',
    '4. Never delete files or folders. Never overwrite, move, or rename them either.',
    '5. Stay inside this project folder. Ask the user if you need something outside it.',
    '6. Never read or print secrets (.env, keys, tokens).',
    `7. The network is ${networkLine()}`,
    'Hooks enforce these rules in every mode, including auto mode. If a hook blocks you, stop, tell the user what was blocked, and ask. Do not look for another way.',
  ];
  if (fs.existsSync(path.join(ROOT, '.agents', 'UNLOCK'))) {
    lines.push('NOTE: .agents/UNLOCK exists, so guardrail files can be edited. Only edit them if the user asked you to.');
  }
  return lines.join('\n');
}

const input = readInput();
const message = buildMessage();
if (Array.isArray(input.workspace_roots) || 'cursor_version' in input) {
  process.stdout.write(JSON.stringify({ additional_context: message }));
} else {
  process.stdout.write(message + '\n');
}
process.exit(0);
