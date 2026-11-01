// Guardrail rule 4: never delete any file or folder.
'use strict';

const SHELL_DELETE = [
  /(^|[\s;&|()`'"\\/])(rm|rmdir|rd|del|erase|unlink|shred|rimraf|trash|trash-put|ri|remove-item|clear-content|clear-recyclebin)(\.exe|\.cmd)?(?=$|[\s;&|()`'"])/i,
  /\s-delete(\s|$)/,
  /-exec(dir)?\s+rm\b/i,
  /\b(fs|fsp|promises)\.(rm|rmdir|unlink|rmSync|rmdirSync|unlinkSync)\b/,
  /\b(rmSync|rmdirSync|unlinkSync)\s*\(/,
  /\bos\.(remove|unlink|rmdir|removedirs)\s*\(/,
  /\bshutil\.rmtree\b/,
  /\.unlink\s*\(/,
  /\[(System\.)?IO\.(File|Directory|FileInfo|DirectoryInfo)\]::Delete/i,
  /\brobocopy\b.*\/(mir|purge)\b/i,
  /(^|[\s;&|])(mv|move|move-item|mi)\s.*\s(\/dev\/null|nul|\$null)\s*$/im,
  /(^|[\s;&|])truncate\s+-s/i,
];

const DELETE_TOOL = /^(delete|delete_file|deletefile|remove_file|rm)$/i;
const DELETE_MCP = /delete|remove|unlink|rmdir|trash|purge|erase/i;

module.exports = function deleteCheck(ctx) {
  if (DELETE_TOOL.test(ctx.toolName)) return 'Deleting files is not allowed.';

  if (ctx.isPatch && /^\*\*\* Delete File:/m.test(ctx.command)) return 'Deleting files is not allowed.';

  if (ctx.isShell && SHELL_DELETE.some((re) => re.test(ctx.command))) {
    return 'Deleting or emptying files and folders is not allowed. Ask the user to do it.';
  }

  if (ctx.isMcp && DELETE_MCP.test(ctx.toolName)) return 'Delete and remove tools are not allowed.';
  return null;
};
