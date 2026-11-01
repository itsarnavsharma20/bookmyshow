// Limits how many different files an agent may change in one turn (one user message).
// The count resets when the user sends a new message. The limit is maxFilesPerTurn in config.json.
// Only file tools are counted (Write, Edit, NotebookEdit, apply_patch). Shell commands are not.
'use strict';

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.resolve(__dirname, '..', '..', 'state');
const CHANGES_FILE = path.join(STATE_DIR, 'changes.json');
const APPROVAL_FILE = path.join(STATE_DIR, 'approval.json');
const DEFAULT_LIMIT = 10;

const FILE_TOOLS =
  /^(write|edit|multiedit|notebookedit|create|str_replace_editor|str_replace_based_edit_tool|replace|edit_file|write_file|create_file)$/i;

const testMode = () => process.env.GUARD_TEST === '1';

function changedPaths(ctx) {
  if (ctx.isMcp || !(FILE_TOOLS.test(ctx.toolName) || ctx.isPatch)) return [];
  return [...new Set(ctx.paths.map((p) => ctx.resolve(p)))];
}

// The approval time works as an id for the current turn, because every user message rewrites it.
function currentTurn() {
  try {
    return JSON.parse(fs.readFileSync(APPROVAL_FILE, 'utf8')).at || '';
  } catch {
    return '';
  }
}

function filesChangedSoFar() {
  if (testMode()) {
    return new Set(Array.from({ length: Number(process.env.GUARD_CHANGED_COUNT || 0) }, (_, i) => `earlier-${i}`));
  }
  try {
    const state = JSON.parse(fs.readFileSync(CHANGES_FILE, 'utf8'));
    if (state.turn === currentTurn()) return new Set(state.files);
  } catch {
    // No record yet for this turn.
  }
  return new Set();
}

function limitFor(ctx) {
  const limit = Number(ctx.config && ctx.config.maxFilesPerTurn);
  return limit > 0 ? limit : DEFAULT_LIMIT;
}

function massChangeCheck(ctx) {
  const paths = changedPaths(ctx);
  if (paths.length === 0) return null;
  const total = new Set([...filesChangedSoFar(), ...paths]);
  const limit = limitFor(ctx);
  if (total.size > limit) {
    return `This turn would change ${total.size} different files. The limit is ${limit}. Ask the user to confirm, then continue in a new message.`;
  }
  return null;
}

// Called by guard.js once an action is allowed, so the count only includes real changes.
massChangeCheck.record = function record(ctx) {
  const paths = changedPaths(ctx);
  if (paths.length === 0 || testMode()) return;
  try {
    const files = [...new Set([...filesChangedSoFar(), ...paths])];
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(CHANGES_FILE, JSON.stringify({ turn: currentTurn(), files }) + '\n');
  } catch {
    // Counting is best effort. The other checks do not depend on it.
  }
};

module.exports = massChangeCheck;
