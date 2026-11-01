// The project must not talk to the outside world.
// Blocks web tools, remote MCP tools, network commands, package installs, URLs, and network code.
// The user can open the network for a limited time. See ../lib/net-unlock.js.
'use strict';

const fs = require('fs');
const path = require('path');
const { status, HOW_TO_UNLOCK } = require('../lib/net-unlock');

const WEB_TOOL = /web|fetch|browser|http|internet/i;

// Commands that always use the network.
const ALWAYS_NETWORK = new RegExp(
  '(^|[\\s;&|()`\'"\\\\/])(' +
    [
      'curl', 'wget', 'iwr', 'irm', 'invoke-webrequest', 'invoke-restmethod', 'start-bitstransfer', 'bitsadmin',
      'nc', 'ncat', 'netcat', 'telnet', 'ftp', 'sftp', 'scp', 'ssh', 'rsync',
      'ping', 'tracert', 'traceroute', 'nslookup', 'dig', 'test-netconnection', 'resolve-dnsname',
      'npx', 'pnpx', 'bunx', 'uvx', 'pipx',
      'az', 'aws', 'gcloud', 'firebase', 'vercel', 'netlify', 'heroku', 'flyctl',
      'winget', 'choco', 'scoop', 'apt', 'apt-get', 'yum', 'dnf', 'brew',
    ].join('|') +
    ')(\\.exe|\\.cmd|\\.ps1)?(?=$|[\\s;&|()`\'"])',
  'i',
);
const DOWNLOADERS = /^(curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod)$/i;

// Commands that use the network only for some subcommands.
const NETWORK_SUBCOMMANDS = [
  /\b(npm|pnpm|yarn|bun)(\.cmd)?\s+(install|i|ci|add|update|up|upgrade|outdated|audit|view|info|search|dedupe|create|dlx|exec|login|publish)\b/i,
  /\b(pip3?|uv|poetry|conda)\s+(install|download|add|update|search|lock|sync)\b/i,
  /\bcargo\s+(install|add|update|fetch|search|publish)\b/i,
  /\bgo\s+(get|install|mod\s+download|mod\s+tidy)\b/i,
  /\b(gem|bundle|composer|nuget)\s+(install|update|add|restore|push)\b/i,
  /\bdotnet\s+(add|restore|tool\s+install|nuget)\b/i,
  /\b(docker|podman)\s+(pull|push|login|search|build|run|compose\s+up)\b/i,
  /\bollama\s+(pull|run|push)\b/i,
];

// Code that opens a network connection.
const NETWORK_CODE =
  /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\bnew\s+(WebSocket|XMLHttpRequest|EventSource)\b|\brequire\s*\(\s*['"](node:)?(https?|net|tls|dgram|http2|dns|ws|axios|node-fetch|got|request|superagent|undici)['"]|\bfrom\s+['"](node:)?(https?|net|tls|dgram|http2|dns|ws|axios|node-fetch|got|undici)['"]|\bimport\s+(requests|urllib\d?|httpx|aiohttp|socket|ftplib|smtplib|telnetlib|paramiko|boto3)\b|\bfrom\s+(urllib|requests|httpx|aiohttp|socket)\b|\burllib\.request\b|\brequests\.(get|post|put|delete|patch|head|request|Session)\b|\baxios\b|System\.Net|WebClient|HttpClient|\bcurl_exec\b|file_get_contents\s*\(\s*['"]https?:/i;

const URL_PATTERN = /\b(https?|ftp|wss?|sftp|ssh):\/\/([^\s'"<>)\]}]+)/gi;

function isLoopback(urlRest) {
  const host = urlRest.replace(/^[^@/]*@/, '').split(/[/?#]/)[0].replace(/:\d+$/, '').toLowerCase();
  return host === 'localhost' || host === '[::1]' || host === '0.0.0.0' || /^127\.\d+\.\d+\.\d+$/.test(host);
}

function allowedMcpServers() {
  try {
    const file = path.resolve(__dirname, '..', 'config.json');
    return JSON.parse(fs.readFileSync(file, 'utf8')).allowedMcpServers || [];
  } catch {
    return [];
  }
}

function mcpServerName(ctx) {
  if (ctx.server) return ctx.server;
  const match = /^mcp__(.+?)__/i.exec(ctx.toolName);
  return match ? match[1] : '';
}

// Returns a reason if the shell text uses the network, or null.
// isScript is true when the text comes from a script file. Plain URLs in a script are ignored.
function findNetworkUse(text, isScript) {
  const urls = [...text.matchAll(URL_PATTERN)];
  const external = urls.filter((u) => !isLoopback(u[2]));
  if (!isScript && external.length > 0) return `The command uses an outside URL: ${external[0][0]}`;

  const always = ALWAYS_NETWORK.exec(text);
  if (always) {
    const localOnly = !isScript && urls.length > 0 && external.length === 0 && DOWNLOADERS.test(always[2]);
    if (!localOnly) return `"${always[2]}" talks to the network.`;
  }
  if (NETWORK_SUBCOMMANDS.some((re) => re.test(text))) return 'Package installs and downloads use the network.';
  if (NETWORK_CODE.test(text)) return 'Code that opens a network connection is not allowed.';
  return null;
}

module.exports = function networkCheck(ctx) {
  if (status().open) return null;

  if (!ctx.isMcp && WEB_TOOL.test(ctx.toolName)) return `${ctx.toolName} uses the network. ${HOW_TO_UNLOCK}`;

  if (ctx.isMcp && !allowedMcpServers().includes(mcpServerName(ctx))) {
    return `MCP tool "${ctx.toolName}" may reach outside services. ${HOW_TO_UNLOCK}`;
  }

  if (ctx.isShell) {
    const reason = findNetworkUse(ctx.command, Boolean(ctx.isScript));
    if (reason) return `${reason} ${HOW_TO_UNLOCK}`;
  }
  return null;
};
