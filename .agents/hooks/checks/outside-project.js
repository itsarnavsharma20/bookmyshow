// Guardrail rule 5: stay inside the project folder.
'use strict';

const HOME_VARS =
  /\$HOME\b|\$\{HOME\}|%(USERPROFILE|APPDATA|LOCALAPPDATA|TEMP|TMP|HOMEPATH|HOMEDRIVE|PROGRAMFILES|PROGRAMDATA|WINDIR|SYSTEMROOT)%|\$env:(USERPROFILE|APPDATA|LOCALAPPDATA|TEMP|TMP|HOMEPATH|HOMEDRIVE|ProgramFiles|ProgramData|windir|SystemRoot)\b/i;
const TILDE = /(^|[\s"'=(;&|])~(?=[\\/\s"']|$)/;

// Absolute paths, Git Bash drive paths, common Unix roots, and any ".." step.
const PATH_LIKE =
  /^([a-zA-Z]:[\\/]|\\\\|\/([a-zA-Z]\/|(usr|etc|home|tmp|var|opt|bin|sbin|mnt|root|Users|proc|dev|private|Library|System|Volumes)(\/|$)))|(^|[\\/])\.\.([\\/]|$)/;
const ABS_IN_TEXT = /[a-zA-Z]:[\\/][^"'\s,}\]]*/g;

module.exports = function outsideProjectCheck(ctx) {
  for (const p of ctx.paths) {
    if (!ctx.isAllowedPath(p)) return `Path is outside the project folder: ${p}`;
  }

  if (ctx.isShell) {
    if (TILDE.test(ctx.command) || HOME_VARS.test(ctx.command)) {
      return 'Command points to a home or system folder outside the project.';
    }
    if (/(^|[\s;&|])(cd|pushd|set-location|sl|chdir)\s+(\/d\s+)?[a-zA-Z]:\s*($|[;&|])/i.test(ctx.command)) {
      return 'Changing to another drive is not allowed.';
    }
    for (const tok of ctx.tokens) {
      const eq = tok.indexOf('=');
      const candidates = eq > 0 ? [tok, tok.slice(eq + 1)] : [tok];
      for (const c of candidates) {
        if (PATH_LIKE.test(c) && !ctx.isAllowedPath(c)) return `Command uses a path outside the project folder: ${c}`;
      }
    }
  }

  if (ctx.isMcp) {
    for (const p of ctx.mcpText.match(ABS_IN_TEXT) || []) {
      if (!ctx.isAllowedPath(p)) return `Tool uses a path outside the project folder: ${p}`;
    }
  }
  return null;
};
