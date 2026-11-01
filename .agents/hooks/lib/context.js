// Normalizes hook input from Claude Code, Codex, Cursor, and Grok into one shape.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG_FILE = path.join(ROOT, '.agents', 'hooks', 'config.json');

const READ_ONLY_TOOLS = /^(read|glob|grep|ls|list|notebookread|read_file|list_dir|file_search|codebase_search|search)$/i;
const NULL_DEVICES = /^(\/dev\/null|nul|\$null)$/i;

const APPROVAL_FILE = path.join(ROOT, '.agents', 'state', 'approval.json');
const UNLOCK_FILE = path.join(ROOT, '.agents', 'UNLOCK');

// Tests set GUARD_TEST=1 and control approval and unlock with GUARD_APPROVAL and GUARD_UNLOCK.
const TEST_MODE = process.env.GUARD_TEST === '1';

function readApproved() {
  if (TEST_MODE) return process.env.GUARD_APPROVAL === 'yes';
  try {
    return JSON.parse(fs.readFileSync(APPROVAL_FILE, 'utf8')).approved === true;
  } catch {
    return false;
  }
}

function readUnlocked() {
  if (TEST_MODE) return process.env.GUARD_UNLOCK === 'yes';
  return fs.existsSync(UNLOCK_FILE);
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Git Bash style "/c/Users" becomes "c:/Users" on Windows.
function toFsPath(p) {
  let out = String(p).trim();
  if (out === '~' || out.startsWith('~/') || out.startsWith('~\\')) out = os.homedir() + out.slice(1);
  const m = /^\/([a-zA-Z])(\/.*)?$/.exec(out);
  if (m && process.platform === 'win32') out = `${m[1]}:${m[2] || '/'}`;
  return out;
}

function resolvePath(p, base) {
  return path.resolve(base || ROOT, toFsPath(p));
}

function isInside(abs, dir) {
  const rel = path.relative(dir, abs);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// Path relative to the project root, lowercase, forward slashes.
function relKey(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/').toLowerCase();
}

// Splits a shell command into words, keeping quoted strings whole.
function shellTokens(cmd) {
  const out = [];
  const re = /"([^"]*)"|'([^']*)'|([^\s"'|;&<>()`]+)/g;
  let m;
  while ((m = re.exec(cmd))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

// Splits a shell command into simple commands on ; & && || | and newlines.
// Separators inside quotes do not split. "2>&1" and "&>" do not split either.
// If a quote is left open, the quotes cannot be trusted, so it splits everywhere (the safe side).
function shellSegments(cmd) {
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    const redirect = c === '&' && (cmd[i - 1] === '>' || cmd[i + 1] === '>');
    if (!redirect && (c === ';' || c === '|' || c === '&' || c === '\n')) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  if (quote) return cmd.split(/\|\||&&|[;|&\n]/).map((s) => s.trim()).filter(Boolean);
  return out;
}

function patchPaths(text) {
  const out = [];
  const re = /^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm;
  let m;
  while ((m = re.exec(text))) out.push((m[1] || m[2]).trim());
  return out;
}

function buildContext(input) {
  let ti = input.tool_input;
  if (typeof ti === 'string') {
    try {
      ti = JSON.parse(ti);
    } catch {
      ti = { raw: ti };
    }
  }
  if (!ti || typeof ti !== 'object') ti = {};

  const event = String(input.hook_event_name || '');
  const toolName = String(input.tool_name || '');
  const server = String(input.mcp_server_name || '');

  let command = input.command ?? ti.command ?? ti.cmd ?? '';
  if (Array.isArray(command)) command = command.join(' ');
  command = String(command);

  const isMcp = /^mcp/i.test(toolName) || /mcp/i.test(event) || server !== '';
  const isPatch = /apply_patch/i.test(toolName) || /^\*\*\* Begin Patch/m.test(command);
  const isShell = !isMcp && !isPatch && command.trim() !== '';
  const isReadOnly = READ_ONLY_TOOLS.test(toolName) || /beforeReadFile/i.test(event);

  const cwd = resolvePath(ti.working_directory || ti.cwd || input.cwd || ROOT, ROOT);

  const paths = [
    input.file_path,
    ti.file_path,
    ti.path,
    ti.notebook_path,
    ti.target_file,
    ti.filePath,
    ti.directory,
    ti.target_directory,
    ti.working_directory,
    ...(Array.isArray(input.attachments) ? input.attachments.map((a) => a && a.file_path) : []),
    ...(isPatch ? patchPaths(command) : []),
  ].filter((p) => typeof p === 'string' && p.trim() !== '');

  if (/^glob$/i.test(toolName) && typeof ti.pattern === 'string' && /^([a-zA-Z]:[\\/]|[\\/]|~)/.test(ti.pattern)) {
    paths.push(ti.pattern);
  }

  const config = loadConfig();
  const allowedOutside = (config.allowedOutsidePaths || []).map((p) => resolvePath(p, ROOT));

  const ctx = {
    root: ROOT,
    config,
    input,
    event,
    toolName,
    server,
    toolInput: ti,
    command,
    isMcp,
    isPatch,
    isShell,
    isReadOnly,
    cwd,
    paths,
    tokens: isShell ? shellTokens(command) : [],
    segments: isShell ? shellSegments(command) : [],
    mcpText: isMcp ? [toolName, server, input.command || '', JSON.stringify(ti)].join(' ') : '',
    resolve: (p) => resolvePath(p, cwd),
    relKey,
    isInsideRoot: (abs) => isInside(abs, ROOT),
    isAllowedPath(p) {
      if (NULL_DEVICES.test(String(p).trim())) return true;
      const abs = resolvePath(p, cwd);
      return isInside(abs, ROOT) || allowedOutside.some((dir) => isInside(abs, dir));
    },
    unlocked: readUnlocked(),
    approved: readApproved(),
  };
  return ctx;
}

module.exports = { buildContext, ROOT, shellTokens };
