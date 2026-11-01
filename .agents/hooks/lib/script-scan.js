// Finds script files that a shell command is about to run, and reads them,
// so guard.js can check what is inside before the script runs.
'use strict';

const fs = require('fs');
const path = require('path');
const { shellTokens } = require('./context');

const INTERPRETERS = new Set([
  'node', 'nodejs', 'deno', 'bun', 'tsx', 'ts-node', 'python', 'python3', 'py',
  'bash', 'sh', 'zsh', 'pwsh', 'powershell', 'ruby', 'perl', 'php', 'cmd',
]);
const SCRIPT_EXT = /\.(js|mjs|cjs|ts|mts|cts|py|sh|bash|zsh|ps1|rb|pl|php|bat|cmd)$/i;
const MAX_BYTES = 1000000;

// A script that starts other programs can hide any command from the text checks.
const DYNAMIC_EXEC =
  /\bchild_process\b|\bsubprocess\b|\bos\.(system|popen|exec\w*|spawn\w*)\b|\bRuntime\.getRuntime\b|\bProcess\.Start\b|\bInvoke-Expression\b|\bStart-Process\b/i;

// Scripts of the guard itself are trusted. Their test fixtures are not.
function isTrusted(key) {
  return key.startsWith('.agents/hooks/') && !key.startsWith('.agents/hooks/test/fixtures/');
}

function baseName(word) {
  return path.basename(String(word)).toLowerCase().replace(/\.(exe|cmd)$/, '');
}

const CD_COMMANDS = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);

// Returns [{ file, text }] for each script the command runs.
// A script that cannot be read comes back with a `problem` text instead, and guard.js blocks it:
// a script that is missing, too large, or written in the same command cannot be checked.
function scriptFiles(ctx) {
  const found = new Map();
  let dir = ctx.cwd;
  for (const segment of ctx.segments) {
    const tokens = shellTokens(segment);
    if (tokens.length === 0) continue;

    // Follow "cd" so that relative script paths resolve the way the shell will resolve them.
    if (CD_COMMANDS.has(baseName(tokens[0]))) {
      const target = tokens.slice(1).find((t) => !/^\/d$/i.test(t) && !t.startsWith('-'));
      if (target) dir = path.resolve(dir, target);
      continue;
    }

    const candidates = INTERPRETERS.has(baseName(tokens[0]))
      ? tokens.slice(1).filter((t) => !t.startsWith('-') && SCRIPT_EXT.test(t))
      : SCRIPT_EXT.test(tokens[0]) ? [tokens[0]] : [];
    for (const candidate of candidates) {
      const abs = path.resolve(dir, candidate);
      if (found.has(abs) || isTrusted(ctx.relKey(abs))) continue;
      try {
        const stat = fs.statSync(abs);
        if (!stat.isFile()) throw new Error('not a file');
        if (stat.size > MAX_BYTES) {
          found.set(abs, { file: abs, problem: 'is too large to check' });
        } else {
          found.set(abs, { file: abs, text: fs.readFileSync(abs, 'utf8') });
        }
      } catch {
        found.set(abs, { file: abs, problem: 'was not found, so it cannot be checked (a script must exist before it runs)' });
      }
    }
  }
  return [...found.values()];
}

module.exports = { scriptFiles, DYNAMIC_EXEC };
