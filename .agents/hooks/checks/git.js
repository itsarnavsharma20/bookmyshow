// Guardrail rule 2: git is read-only for agents. The user runs every other git command.
'use strict';

const READ_ONLY_SUBCOMMANDS = new Set(['status', 'diff', 'log', 'show', 'blame', 'branch']);
const BRANCH_FLAGS = new Set(['-a', '-r', '-v', '-vv', '--all', '--remotes', '--verbose', '--list', '--show-current']);
// Flags that make a read command write a file or run another program.
const UNSAFE_ARGS = /^(--output(=.*)?|--ext-diff|--textconv|--exec(=.*)?|--open-files-in-pager.*|-c)$/i;
const ALLOWED_GLOBAL_FLAGS = new Set(['--no-pager']);

const TOOL_WORD = /(^|[\s;&|()`'"\\/=])(git|gh|hub)(\.exe)?(?=$|[\s;&|()`'"])/gi;
const GITHUB_HOST = /github\.com|githubusercontent\.com/i;
const GIT_MCP = /github|gitlab|bitbucket|(^|[_\W])git([_\W]|$)/i;

const READ_ONLY_HELP = 'Only read-only git is allowed: status, diff, log, show, blame, and branch (list). The user runs all other git commands.';

function cleanToken(token) {
  return token.replace(/^["'`(]+|["'`)]+$/g, '');
}

// Checks the words after one "git". Returns a reason to block, or null.
function checkGitInvocation(afterGit) {
  const words = afterGit.split(/[;&|\n]/)[0].split(/\s+/).map(cleanToken).filter(Boolean);
  let i = 0;
  while (i < words.length && ALLOWED_GLOBAL_FLAGS.has(words[i])) i++;
  const sub = (words[i] || '').toLowerCase();
  if (!sub || sub.startsWith('-')) return `Git options before the command are not allowed. ${READ_ONLY_HELP}`;
  if (!READ_ONLY_SUBCOMMANDS.has(sub)) return `"git ${sub}" is not allowed. ${READ_ONLY_HELP}`;

  const args = words.slice(i + 1);
  if (args.some((a) => UNSAFE_ARGS.test(a))) return 'That git option can write files or run programs, so it is not allowed.';
  if (sub === 'branch' && !args.every((a) => BRANCH_FLAGS.has(a))) {
    return 'Only listing branches is allowed. Creating, renaming, or deleting branches is not.';
  }
  return null;
}

module.exports = function gitCheck(ctx) {
  if (ctx.isShell) {
    const text = ctx.command;
    TOOL_WORD.lastIndex = 0;
    let match;
    while ((match = TOOL_WORD.exec(text))) {
      const tool = match[2].toLowerCase();
      if (tool !== 'git') return 'GitHub commands (gh, hub) are not allowed. The user runs them.';
      const reason = checkGitInvocation(text.slice(match.index + match[0].length));
      if (reason) return reason;
    }
    if (GITHUB_HOST.test(text)) return 'Commands that call GitHub are not allowed.';
  }

  if (ctx.isMcp && GIT_MCP.test(`${ctx.toolName} ${ctx.server}`)) {
    return 'Git and GitHub tools are not allowed.';
  }

  if (!ctx.isReadOnly) {
    for (const p of ctx.paths) {
      const key = ctx.relKey(ctx.resolve(p));
      if (key === '.git' || key.startsWith('.git/')) return 'Changes inside the .git folder are not allowed.';
    }
  }
  return null;
};
