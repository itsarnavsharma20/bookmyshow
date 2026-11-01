// Extra guardrail: system-level commands that can harm the machine or leak out of the project.
'use strict';

const RULES = [
  [/(^|[\s;&|(])(sudo|runas|doas|su)(\s|$)/i, 'Running as admin or another user is not allowed.'],
  [/-Verb\s+RunAs/i, 'Running as admin is not allowed.'],
  [/\|\s*(sh|bash|zsh|fish|pwsh|powershell|cmd|iex|invoke-expression|python3?|node|perl|ruby)(\.exe)?\b/i, 'Piping output into a shell or interpreter is not allowed.'],
  [/(^|[\s;&|(])(iex|invoke-expression)(\s|$|\()/i, 'Invoke-Expression is not allowed.'],
  [/\s-(e|en|enc|encodedcommand)\s+[A-Za-z0-9+/=]{16,}/i, 'Encoded commands are not allowed.'],
  [/\bchmod\s+(-R\s+)?[0-7]*777\b|\bchown\s+-R\b|\bicacls\b|\btakeown\b/i, 'Changing file permissions or ownership is not allowed.'],
  [/(^|[\s;&|(])(shutdown|reboot|halt|poweroff|restart-computer|stop-computer|logoff)(\s|$)/i, 'Shutdown and restart are not allowed.'],
  [/(^|[\s;&|(])(format(-volume)?\s+[a-zA-Z]:|diskpart|mkfs(\.\w+)?|fdisk|bcdedit|vssadmin|cipher\s+\/w)/i, 'Disk and boot commands are not allowed.'],
  [/(^|[\s;&|(])dd\s+if=/i, 'dd is not allowed.'],
  [/(^|[\s;&|(])reg(\.exe)?\s+(add|delete|import|load|unload|restore|copy)\b/i, 'Changing the Windows registry is not allowed.'],
  [/(set|new|remove|rename)-itemproperty\b.*\b(HKLM|HKCU|HKCR|HKU|HKCC|Registry::)/i, 'Changing the Windows registry is not allowed.'],
  [/(^|[\s;&|(])setx(\s|$)|\[Environment\]::SetEnvironmentVariable/i, 'Changing system environment variables is not allowed.'],
  [/set-executionpolicy|set-mppreference|add-mppreference/i, 'Changing security settings is not allowed.'],
  [/(^|[\s;&|(])(schtasks|crontab|at)(\.exe)?\s|register-scheduledtask|new-service|sc(\.exe)?\s+(create|config|delete)/i, 'Creating scheduled tasks or services is not allowed.'],
  [/(^|[\s;&|(])(netsh|route|new-netfirewallrule|set-netfirewallprofile)(\s|$)/i, 'Changing network or firewall settings is not allowed.'],
  [/(^|[\s;&|(])(kill|pkill|killall|taskkill|stop-process|spps)(\s|$)/i, 'Killing processes is not allowed.'],
  [/\bnpm\s+(publish|unpublish|deprecate|owner|token|login|adduser)\b|\b(yarn|pnpm)\s+publish\b|\btwine\s+upload\b|\bcargo\s+publish\b/i, 'Publishing packages is not allowed.'],
  [/\b(npm|pnpm)\s+(i|install|add|uninstall|remove|rm|un)\s.*(-g|--global)\b|\byarn\s+global\b|\bpip3?\s+install\b.*--user\b/i, 'Global package changes are not allowed.'],
  [/\bdocker\s+(system\s+prune|volume\s+(rm|prune)|image\s+prune|container\s+prune|rm|rmi|kill)\b|\bdocker[\s-]compose\s+down\b.*(-v|--volumes)/i, 'Destructive docker commands are not allowed.'],
  [/\bkubectl\s+(delete|drain|cordon|apply|replace|patch|scale)\b|\bhelm\s+(uninstall|delete|upgrade|install)\b/i, 'Changing a cluster is not allowed.'],
  [/\bterraform\s+(apply|destroy|import|state\s+rm)\b|\bpulumi\s+(up|destroy)\b/i, 'Changing cloud infrastructure is not allowed.'],
  [/\b(aws|gcloud|az)\s+\S+\s+(delete|remove|rm|terminate|destroy)/i, 'Deleting cloud resources is not allowed.'],
  [/(^|[\s;&|(])(ssh|scp|sftp|rsync|ftp|telnet|nc|ncat|netcat)(\.exe)?\s/i, 'Remote connections and file transfers are not allowed.'],
  [/(^|[\s;&|(])(nohup|setsid|disown|screen|tmux|start-process|start-job|start-threadjob|saps|invoke-command|pm2|forever)(\.exe)?(\s|$)/i, 'Starting background processes is not allowed.'],
  [/(^|[\s;&|(])start\s+(\/b|\/min|"")/i, 'Starting background processes is not allowed.'],
  [/wmic\s+process\s+call\s+create/i, 'Starting background processes is not allowed.'],
];

// A single "&" outside quotes runs a command in the background. "&&", "2>&1", and "&>" are fine.
function hasBackgroundAmpersand(command) {
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const c = command[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '&' && command[i - 1] !== '&' && command[i + 1] !== '&' && command[i - 1] !== '>' && command[i + 1] !== '>') {
      return true;
    }
  }
  return false;
}

module.exports = function dangerousCheck(ctx) {
  if (!ctx.isShell) return null;
  if (ctx.toolInput.run_in_background === true) return 'Running commands in the background is not allowed.';
  if (hasBackgroundAmpersand(ctx.command)) return 'Starting background processes is not allowed. "&" and the "&" call operator are blocked.';
  for (const [re, reason] of RULES) {
    if (re.test(ctx.command)) return reason;
  }
  return null;
};
