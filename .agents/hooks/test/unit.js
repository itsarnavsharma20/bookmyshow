// Unit tests for the time-limited network unlock. Run through run.js.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { status } = require('../lib/net-unlock');
const { isApproval } = require('../approve');
const audit = require('../lib/audit');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'net-unlock-'));
const MINUTE = 60000;

function fileWith(text, ageMinutes) {
  const file = path.join(dir, `f${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(file, text);
  const when = new Date(Date.now() - ageMinutes * MINUTE);
  fs.utimesSync(file, when, when);
  return file;
}

// Each test returns true when it passes.
module.exports = [
  ['net unlock: no file means locked', () => status(path.join(dir, 'missing')).open === false],
  ['net unlock: empty file uses 15 minutes, fresh file is open', () => status(fileWith('', 0)).open === true],
  ['net unlock: empty file is locked after 16 minutes', () => status(fileWith('', 16)).open === false],
  ['net unlock: 30 minutes, 10 minutes old is open', () => status(fileWith('30', 10)).open === true],
  ['net unlock: 30 minutes, 31 minutes old is locked', () => status(fileWith('30', 31)).open === false],
  ['net unlock: reports minutes left', () => status(fileWith('30', 10)).minutesLeft === 20],
  ['net unlock: "45 min" is understood', () => status(fileWith('45 min', 0)).open === true],
  ['net unlock: text that is not a number is locked', () => status(fileWith('forever', 0)).open === false],
  ['net unlock: 0 minutes is locked', () => status(fileWith('0', 0)).open === false],
  ['net unlock: capped at 240 minutes', () => status(fileWith('9999', 241)).open === false],
  ['net unlock: 9999 minutes is open at 239 minutes', () => status(fileWith('9999', 239)).open === true],

  // Approval words.
  ['approval: "go"', () => isApproval('go') === true],
  ['approval: "ok"', () => isApproval('ok') === true],
  ['approval: "approved"', () => isApproval('approved') === true],
  ['approval: "GO!" ignores case and punctuation', () => isApproval('GO!') === true],
  ['approval: starts with go', () => isApproval('go ahead with phase 2 please') === true],
  ['approval: ends with ok', () => isApproval('phase 2 shuru karo, theek hai ok') === true],
  ['approval: short message with ok', () => isApproval('ok theek hai') === true],
  ['approval: "go" in the middle of a long message is not enough', () => isApproval('pehle batao ki go wala step kaise kaam karega aur kya hoga uska result') === false],
  ['approval: "dont go" is not approval', () => isApproval("don't go") === false],
  ['approval: "nahi go" is not approval', () => isApproval('nahi go') === false],
  ['approval: "wait ok" is not approval', () => isApproval('wait ok') === false],
  ['approval: a question is not approval', () => isApproval('done whats next') === false],
  ['approval: empty message', () => isApproval('') === false],
  ['approval: missing message', () => isApproval(undefined) === false],
  ['approval: "okay" is not on the list', () => isApproval('okay') === false],

  // Audit log.
  ['audit: summarize uses the command', () => audit.summarize({ tool_name: 'Bash', tool_input: { command: 'ls -la' } }).detail === 'ls -la'],
  ['audit: summarize uses the file path', () => audit.summarize({ tool_name: 'Read', tool_input: { file_path: 'a.md' } }).detail === 'a.md'],
  ['audit: summarize never includes file content', () => !audit.summarize({ tool_name: 'Write', tool_input: { file_path: 'a.md', content: 'SECRET TEXT' } }).detail.includes('SECRET')],
  ['audit: summarize hides secret values', () => audit.summarize({ tool_name: 'Bash', tool_input: { command: 'run --token=abc123' } }).detail.includes('abc123') === false],
  ['audit: summarize cuts long commands', () => audit.summarize({ tool_name: 'Bash', tool_input: { command: 'x'.repeat(500) } }).detail.length === 200],
  ['audit: summarize handles missing input', () => audit.summarize(null).tool === 'unknown'],
  ['audit: write adds one JSON line', () => {
    const file = path.join(dir, 'audit-a.log');
    audit.write({ decision: 'block', check: 'git' }, file);
    audit.write({ decision: 'allow' }, file);
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    return lines.length === 2 && lines[0].decision === 'block' && typeof lines[0].at === 'string';
  }],
  ['audit: big log is rotated', () => {
    const file = path.join(dir, 'audit-b.log');
    fs.writeFileSync(file, 'x'.repeat(100));
    audit.write({ decision: 'allow' }, file, 50);
    return fs.existsSync(`${file}.old`) && fs.readFileSync(file, 'utf8').trim().split('\n').length === 1;
  }],
];
