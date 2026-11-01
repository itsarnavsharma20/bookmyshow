// Stops data loss that is not a delete: overwriting, moving, renaming, and editing files in place.
// To change an existing file, an agent must use the Edit tool, which shows exactly what changes.
'use strict';

const fs = require('fs');
const path = require('path');
const { shellTokens } = require('../lib/context');

const WRITE_NEW_ONLY_TOOLS = /^(write|create|write_file|create_file)$/i;
const MOVE_COMMANDS = new Set(['mv', 'move', 'move-item', 'mi', 'ren', 'rename', 'rename-item', 'rni']);
const COPY_COMMANDS = new Set(['cp', 'copy', 'copy-item', 'cpi']);
const BULK_COPY_COMMANDS = new Set(['xcopy', 'robocopy', 'rsync']);
const EXTRACT_COMMANDS = new Set(['unzip', 'expand-archive', '7z', '7za', '7zr']);
const WRITE_FILE_COMMANDS = new Set(['set-content', 'sc', 'out-file', 'tee', 'tee-object']);
const NULL_DEVICES = /^(\/dev\/null|nul|\$null)$/i;
const REDIRECT = /(^|[^>&\d])\d?>(?![>&])\s*("[^"]+"|'[^']+'|[^\s;&|>()]+)/g;
const MCP_MOVE = /move|rename|overwrite/i;

function baseName(word) {
  return path.basename(String(word)).toLowerCase().replace(/\.(exe|cmd|ps1)$/, '');
}

const isFile = (abs) => {
  try {
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
};
const isDir = (abs) => {
  try {
    return fs.statSync(abs).isDirectory();
  } catch {
    return false;
  }
};

const flagValue = (tokens, names) => {
  const i = tokens.findIndex((t) => names.includes(t.toLowerCase()));
  return i >= 0 ? tokens[i + 1] : undefined;
};

// The files and folders named in a command, without its flags.
const positional = (tokens) => tokens.slice(1).filter((t) => !t.startsWith('-') && !/^\/[a-z]$/i.test(t));

function copyOverwrites(ctx, tokens) {
  const named = flagValue(tokens, ['-destination', '-dest']);
  const args = positional(tokens);
  const dest = named || args[args.length - 1];
  const sources = named ? args.filter((a) => a !== named) : args.slice(0, -1);
  if (!dest) return null;
  const destAbs = ctx.resolve(dest);

  if (isFile(destAbs)) return `Copying onto the existing file ${dest} would overwrite it.`;
  if (isDir(destAbs)) {
    for (const source of sources) {
      if (/[*?]/.test(source)) return 'Copying with wildcards into an existing folder cannot be checked for overwrites.';
      if (fs.existsSync(path.join(destAbs, path.basename(source)))) {
        return `Copying would overwrite ${path.join(dest, path.basename(source))}.`;
      }
    }
  }
  return null;
}

// Does a command write the first file it names and replace what is there?
function replacesExistingFile(ctx, command, tokens) {
  if (tokens.some((t) => /^-(append|a)$/i.test(t))) return null;
  const target = flagValue(tokens, ['-path', '-literalpath', '-filepath']) || positional(tokens)[0];
  if (target && isFile(ctx.resolve(target))) return `${command} would replace the existing file ${target}.`;
  return null;
}

function checkSegment(ctx, segment) {
  const tokens = shellTokens(segment);
  if (tokens.length === 0) return null;
  const command = baseName(tokens[0]);

  if (MOVE_COMMANDS.has(command)) return 'Moving and renaming files is not allowed. Ask the user to do it.';
  if (BULK_COPY_COMMANDS.has(command)) return `${command} can overwrite many files and is not allowed.`;
  if (EXTRACT_COMMANDS.has(command)) return 'Extracting archives can overwrite files and is not allowed.';
  if (command === 'tar' && tokens.slice(1, 3).some((t) => /^-?[a-zA-Z]*x/.test(t) || t === '--extract')) {
    return 'Extracting archives can overwrite files and is not allowed.';
  }
  if (command === 'sed' && tokens.some((t) => /^-[a-zA-Z]*i/.test(t) || t.startsWith('--in-place'))) {
    return 'In-place edits with sed are not allowed. Use the Edit tool.';
  }
  if (command === 'perl' && tokens.some((t) => /^-[a-zA-Z]*i/.test(t))) return 'In-place edits with perl are not allowed. Use the Edit tool.';
  if (command === 'sponge') return 'sponge replaces files and is not allowed.';
  if (COPY_COMMANDS.has(command)) return copyOverwrites(ctx, tokens);
  if (WRITE_FILE_COMMANDS.has(command)) return replacesExistingFile(ctx, command, tokens);
  if (command === 'new-item' && tokens.some((t) => t.toLowerCase() === '-force')) {
    return replacesExistingFile(ctx, 'New-Item -Force', tokens);
  }
  return null;
}

module.exports = function overwriteCheck(ctx) {
  // Maintenance mode: while the user has unlocked the guardrails, whole files under .agents/ may be rewritten.
  const maintenance = ctx.unlocked;

  if (WRITE_NEW_ONLY_TOOLS.test(ctx.toolName) && !ctx.isMcp) {
    for (const p of ctx.paths) {
      const abs = ctx.resolve(p);
      if (isFile(abs) && !(maintenance && ctx.relKey(abs).startsWith('.agents/'))) {
        return `${p} already exists. Write would replace all of it. Use the Edit tool to change part of it.`;
      }
    }
  }

  if (ctx.isPatch) {
    for (const line of ctx.command.split('\n')) {
      const add = /^\*\*\* Add File: (.+)$/.exec(line);
      if (add && isFile(ctx.resolve(add[1].trim()))) return `${add[1].trim()} already exists. Adding it would replace all of it.`;
      if (/^\*\*\* Move to: /.test(line)) return 'Moving and renaming files is not allowed. Ask the user to do it.';
    }
  }

  if (ctx.isMcp && MCP_MOVE.test(ctx.toolName)) return 'Move, rename, and overwrite tools are not allowed.';

  if (ctx.isShell) {
    for (const segment of ctx.segments) {
      const reason = checkSegment(ctx, segment);
      if (reason) return reason;
    }
    REDIRECT.lastIndex = 0;
    let match;
    while ((match = REDIRECT.exec(ctx.command))) {
      const target = match[2].replace(/^["']|["']$/g, '');
      if (!NULL_DEVICES.test(target) && isFile(ctx.resolve(target))) {
        return `Redirecting output with ">" would replace the existing file ${target}. Use ">>" to add to it, or the Edit tool.`;
      }
    }
  }
  return null;
};
