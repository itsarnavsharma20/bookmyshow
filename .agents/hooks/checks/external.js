// Tools that publish, notify, schedule, or start work outside this session.
// These stay blocked even when the network is unlocked. Only the user does these.
'use strict';

const BLOCKED_TOOLS =
  /^(artifact|artifactdata|artifactcomments|pushnotification|remotetrigger|croncreate|crondelete|schedulewakeup|monitor|designsync|enterworktree|exitworktree)$/i;
const SUBAGENT_TOOLS = /^(agent|task)$/i;
const BLOCKED_ISOLATION = new Set(['remote', 'worktree']);

module.exports = function externalCheck(ctx) {
  if (!ctx.isMcp && BLOCKED_TOOLS.test(ctx.toolName)) {
    return `${ctx.toolName} publishes, schedules, or runs work outside this session. Only the user does this.`;
  }

  const isolation = String(ctx.toolInput.isolation || '').toLowerCase();
  if (SUBAGENT_TOOLS.test(ctx.toolName) && BLOCKED_ISOLATION.has(isolation)) {
    return `Subagents with "${isolation}" isolation run in the cloud or use git worktrees. They are not allowed.`;
  }
  return null;
};
