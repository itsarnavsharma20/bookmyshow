#!/usr/bin/env node
// Shared guardrail hook for every agent. Rules: .agents/rules/guardrails.md
//
// Reads the hook event JSON on stdin and runs every check in ./checks.
// Allow: exit 0. Block: reason on stderr, exit 2.
// Fails closed: bad input or a crash also blocks.
'use strict';

const fs = require('fs');
const path = require('path');
const { buildContext } = require('./lib/context');
const { scriptFiles, DYNAMIC_EXEC } = require('./lib/script-scan');
const audit = require('./lib/audit');

const load = (name) => ({ name, run: require(`./checks/${name}`) });

// Hard blocks first, so the user sees the most specific reason.
const CHECKS = [
  'protect-guardrails',
  'git',
  'delete',
  'database',
  'secrets',
  'outside-project',
  'dangerous',
  'overwrite',
  'network',
  'external',
  'mass-change',
].map(load);

// Checks that also run on the text of any script file the command is about to run.
const SCRIPT_CHECKS = ['git', 'delete', 'database', 'secrets', 'network'].map(load);

// Counts the files changed this turn. Called once an action is allowed.
const MASS_CHANGE = CHECKS.find((check) => check.name === 'mass-change').run;

// Last, so a hard block is reported before "no approval".
const APPROVAL = load('approval');

// Cursor sends workspace_roots and expects a JSON permission reply on stdout.
function isCursor(input) {
  return input && (Array.isArray(input.workspace_roots) || 'cursor_version' in input);
}

function allow(input) {
  if (isCursor(input)) {
    // Shell and MCP calls always go to the user for approval (guardrail rule 1).
    const askEvents = /^(beforeShellExecution|beforeMCPExecution)$/;
    const permission = askEvents.test(input.hook_event_name || '') ? 'ask' : 'allow';
    process.stdout.write(JSON.stringify({ permission }));
  }
  audit.write({ decision: 'allow', ...audit.summarize(input) });
  process.exit(0);
}

function block(input, check, reason) {
  const message = `GUARDRAIL BLOCKED [${check}]: ${reason} See .agents/rules/guardrails.md. Do not retry another way. Tell the user what was blocked and ask what to do.`;
  if (isCursor(input)) {
    process.stdout.write(JSON.stringify({ permission: 'deny', user_message: message, agent_message: message }));
  }
  process.stderr.write(message + '\n');
  audit.write({ decision: 'block', check, reason: reason.slice(0, 200), ...audit.summarize(input) });
  process.exit(2);
}

// Looks inside script files that the command runs, with the same checks as for a command.
function scanScripts(ctx, input) {
  for (const script of scriptFiles(ctx)) {
    const name = path.relative(ctx.root, script.file);
    if (script.problem) block(input, 'script-scan', `Script ${name} ${script.problem}.`);
    if (DYNAMIC_EXEC.test(script.text)) {
      block(input, 'script-scan', `Script ${name} starts other programs, which cannot be checked.`);
    }
    const inner = buildContext({
      hook_event_name: input.hook_event_name,
      tool_name: 'Bash',
      tool_input: { command: script.text },
      cwd: ctx.cwd,
    });
    inner.isScript = true;
    for (const check of SCRIPT_CHECKS) {
      const reason = check.run(inner);
      if (reason) block(input, 'script-scan', `Script ${name} contains a blocked action. ${reason}`);
    }
  }
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    block(null, 'guard', 'Hook input could not be read.');
  }

  try {
    const ctx = buildContext(input);
    for (const check of CHECKS) {
      const reason = check.run(ctx);
      if (reason) block(input, check.name, reason);
    }
    if (ctx.isShell) scanScripts(ctx, input);
    const reason = APPROVAL.run(ctx);
    if (reason) block(input, APPROVAL.name, reason);
    MASS_CHANGE.record(ctx);
  } catch (err) {
    block(input, 'guard', `Hook error: ${err && err.message}`);
  }
  allow(input);
}

main();
