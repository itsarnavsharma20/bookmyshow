// Audit log: one JSON line per guard decision, in .agents/logs/audit.log.
// The log is for the user to read. Agents can read it but cannot change it (protect-guardrails).
// Writing is best effort: a logging problem never blocks or allows anything.
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.resolve(__dirname, '..', '..', 'logs', 'audit.log');
const MAX_BYTES = 1000000;
const MAX_DETAIL = 200;

// Hides values that look like secrets before they reach the log.
const SECRET_VALUE = /(\b(?:api[_-]?key|token|secret|password|passwd|pwd)\s*[=:]\s*)\S+/gi;

// A short description of what the tool call was about: the command, or the file paths. Never file contents.
function summarize(input) {
  if (!input || typeof input !== 'object') return { tool: 'unknown', detail: '' };
  let ti = input.tool_input;
  if (typeof ti === 'string') {
    try {
      ti = JSON.parse(ti);
    } catch {
      ti = {};
    }
  }
  ti = ti && typeof ti === 'object' ? ti : {};
  const tool = String(input.tool_name || input.hook_event_name || 'unknown');
  const raw = input.command ?? ti.command ?? ti.file_path ?? ti.path ?? ti.notebook_path ?? ti.url ?? ti.query ?? input.file_path ?? '';
  const detail = String(Array.isArray(raw) ? raw.join(' ') : raw)
    .replace(/\s+/g, ' ')
    .replace(SECRET_VALUE, '$1***')
    .slice(0, MAX_DETAIL);
  return { tool, detail };
}

// `file` and `maxBytes` can be passed in for unit tests.
function write(entry, file = LOG_FILE, maxBytes = MAX_BYTES) {
  if (process.env.GUARD_TEST === '1' && file === LOG_FILE) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file) && fs.statSync(file).size > maxBytes) fs.renameSync(file, `${file}.old`);
    fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  } catch {
    // Best effort.
  }
}

module.exports = { write, summarize, LOG_FILE };
