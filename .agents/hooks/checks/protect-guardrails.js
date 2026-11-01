// Stops agents from editing or disabling the guardrails, hooks, and agent settings.
// The user can lift this check by creating .agents/UNLOCK by hand.
'use strict';

const PROTECTED = [
  'agents.md',
  'claude.md',
  '.agents/rules/guardrails.md',
  '.agents/hooks',
  '.agents/state',
  '.agents/logs',
  '.agents/unlock',
  '.agents/net_unlock',
  '.claude/settings.json',
  '.claude/settings.local.json',
  '.codex',
  '.cursor/hooks.json',
  '.cursor/cli.json',
  '.cursor/rules/shared.mdc',
  '.grok',
];

const READ_COMMANDS =
  /^(cd|pwd|set-location|sl|pushd|popd|cat|type|get-content|gc|head|tail|less|more|ls|dir|get-childitem|gci|wc|grep|rg|findstr|select-string|sls|stat|tree|diff|fc|compare-object|test-path|get-item|gi|resolve-path|echo)(\.exe)?$/i;
const RUN_HOOK_SCRIPT = /^node\s+["']?(\.\/)?\.agents[\\/]hooks[\\/][\w\\/.-]+\.js["']?$/i;

function isProtected(key) {
  return PROTECTED.some((p) => key === p || key.startsWith(p + '/'));
}

function isReadOnlySegment(segment) {
  if (RUN_HOOK_SCRIPT.test(segment)) return true;
  const first = segment.split(/\s+/)[0].replace(/^["']|["']$/g, '');
  return READ_COMMANDS.test(first);
}

module.exports = function protectGuardrailsCheck(ctx) {
  if (ctx.unlocked) return null;

  if (!ctx.isReadOnly) {
    for (const p of ctx.paths) {
      const abs = ctx.resolve(p);
      if (ctx.isInsideRoot(abs) && isProtected(ctx.relKey(abs))) {
        return `Guardrail files are protected: ${p}. Ask the user to create .agents/UNLOCK first.`;
      }
    }
  }

  if (ctx.isShell) {
    if (/UNLOCK/.test(ctx.command)) return 'Agents cannot create or touch the UNLOCK or NET_UNLOCK files.';
    const normalized = ctx.command.replace(/\\/g, '/').toLowerCase();
    const mentions = PROTECTED.some((p) => normalized.includes(p));
    const withoutStderrMerge = ctx.command.replace(/\d?>&\d/g, '');
    const readOnly = !/>/.test(withoutStderrMerge) && ctx.segments.every(isReadOnlySegment);
    if (mentions && !readOnly) {
      return 'Commands that change guardrail files are not allowed. Ask the user to create .agents/UNLOCK first.';
    }
  }

  if (ctx.isMcp && !ctx.isReadOnly) {
    const normalized = ctx.mcpText.replace(/\\\\/g, '/').replace(/\\/g, '/').toLowerCase();
    if (PROTECTED.some((p) => normalized.includes(p))) return 'Tools cannot change guardrail files.';
  }
  return null;
};
