#!/usr/bin/env node
// Approval gate, step 1: runs when the user sends a message (UserPromptSubmit / beforeSubmitPrompt).
//
// Writes .agents/state/approval.json with approved=true only if the message contains
// a clear approval word. Every new message resets the approval first. Agents cannot
// write the state file: the protect-guardrails check blocks it.
// The check that reads the state is .agents/hooks/checks/approval.js.
'use strict';

const fs = require('fs');
const path = require('path');
const audit = require('./lib/audit');

const STATE_DIR = path.resolve(__dirname, '..', 'state');
const STATE_FILE = path.join(STATE_DIR, 'approval.json');

const APPROVAL_WORDS = new Set(['go', 'ok', 'approved']);
const NEGATIONS = new Set(['not', 'no', 'dont', 'don', 'nahi', 'nahin', 'mat', 'stop', 'wait', 'ruko']);
const SHORT_MESSAGE_WORDS = 6;

// Approved when the message starts or ends with an approval word, or is a short
// message that contains one. A negation word cancels the approval.
function isApproval(prompt) {
  const words = String(prompt || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (words.length === 0 || words.some((w) => NEGATIONS.has(w))) return false;
  if (APPROVAL_WORDS.has(words[0]) || APPROVAL_WORDS.has(words[words.length - 1])) return true;
  return words.length <= SHORT_MESSAGE_WORDS && words.some((w) => APPROVAL_WORDS.has(w));
}

function main() {
  let input = {};
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    // No readable input: stay unapproved.
  }

  // Reset first. If anything below fails, the state stays missing, which means "not approved".
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {
    // Already missing.
  }

  const approved = isApproval(input.prompt);
  // The message itself is not logged, only the decision.
  audit.write({ decision: approved ? 'approved' : 'not-approved', tool: 'user-message', detail: '' });
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ approved, at: new Date().toISOString() }) + '\n');
  } catch {
    process.stderr.write('Approval gate could not write its state. Staying unapproved.\n');
  }

  const status = approved
    ? '[approval gate] The user approved this turn. Do only what the approved plan covers.'
    : '[approval gate] No approval in this message. Read-only work and planning only. Show a plan and wait for go, ok, or approved.';

  if (Array.isArray(input.workspace_roots) || 'cursor_version' in input) {
    process.stdout.write(JSON.stringify({ continue: true }));
  } else {
    process.stdout.write(status + '\n');
  }
  process.exit(0);
}

if (require.main === module) main();

module.exports = { isApproval };
