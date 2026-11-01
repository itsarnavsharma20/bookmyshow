// Guardrail rules 1 and 6: nothing runs or changes without the user's approval.
// Works in every mode, including auto and bypass modes, because hooks run regardless.
// Reads the state that .agents/hooks/approve.js writes after each user message.
'use strict';

const REASON =
  'No approval for this turn. Show the user a plan and wait for go, ok, or approved. Only read-only work is allowed until then.';

// Tools that cannot change anything, plus planning and question tools.
const SAFE_TOOLS =
  /^(toolsearch|askuserquestion|todowrite|taskcreate|taskupdate|taskget|tasklist|enterplanmode|exitplanmode|skill|agent|task|listagents|sendmessage|mcp__claude-vscode__getdiagnostics)$/i;

const READ_COMMANDS = new Set([
  'ls', 'dir', 'cat', 'type', 'head', 'tail', 'wc', 'grep', 'rg', 'findstr', 'select-string', 'sls',
  'get-content', 'gc', 'get-childitem', 'gci', 'get-item', 'gi', 'test-path', 'resolve-path',
  'get-location', 'pwd', 'cd', 'set-location', 'sl', 'pushd', 'popd', 'echo', 'write-output',
  'tree', 'stat', 'diff', 'fc', 'which', 'where', 'get-command', 'measure-object', 'select-object',
]);

const VERSION_CHECK = /^(node|npm|python3?|pwsh|powershell)(\.exe)?\s+(--version|-v)$/i;
const HOOK_TESTS = /^node\s+["']?(\.[\\/])?\.agents[\\/]hooks[\\/]test[\\/]run\.js["']?$/i;
const GIT_READ = /^git(\.exe)?\s+(status|diff|log|show|blame|branch)(\s|$)/i;
const FIND_MUTATES = /\s-(exec|execdir|ok|okdir|delete|fprint|fprintf|fls)\b/i;
const RG_RUNS_COMMANDS = /\s--pre(=|\s)/i;

function firstWord(segment) {
  return segment
    .trim()
    .split(/\s+/)[0]
    .replace(/^["']|["']$/g, '')
    .toLowerCase()
    .replace(/\.(exe|cmd)$/, '');
}

function isReadOnlySegment(segment) {
  const word = firstWord(segment);
  if (word === 'find') return !FIND_MUTATES.test(segment);
  if (word === 'rg') return !RG_RUNS_COMMANDS.test(segment);
  if (READ_COMMANDS.has(word)) return true;
  const trimmed = segment.trim();
  return VERSION_CHECK.test(trimmed) || HOOK_TESTS.test(trimmed) || GIT_READ.test(trimmed);
}

function isReadOnlyShell(ctx) {
  // Allow the harmless forms: 2>&1 and sending output to the null device.
  const cmd = ctx.command
    .replace(/\d?>&\d/g, '')
    .replace(/\d?>\s*(\/dev\/null|nul|\$null)(?![\w])/gi, '')
    .replace(/&&/g, '');
  if (/[>`&]|\$\(|\$\{/.test(cmd)) return false;
  return ctx.segments.length > 0 && ctx.segments.every(isReadOnlySegment);
}

module.exports = function approvalCheck(ctx) {
  if (ctx.approved) return null;
  if (ctx.isReadOnly || SAFE_TOOLS.test(ctx.toolName)) return null;
  if (ctx.isShell && isReadOnlyShell(ctx)) return null;
  return REASON;
};
