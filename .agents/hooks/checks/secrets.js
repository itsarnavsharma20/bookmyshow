// Secrets stay private: agents may not read, write, or print secret files and environment values.
'use strict';

const SECRET_DIRS = new Set(['.ssh', '.aws', '.gnupg', '.kube', '.azure']);
const TEMPLATE_SUFFIX = /\.(example|sample|template|dist)$/;
const SECRET_NAMES = [
  /^\.env(\..+)?$/,
  /\.env$/,
  /\.(pem|key|p12|pfx|jks|keystore|ppk|kdbx)$/,
  /^id_(rsa|dsa|ecdsa|ed25519)$/,
  /^(\.npmrc|\.pypirc|\.netrc|\.htpasswd|credentials|credentials\.json|terraform\.tfstate(\.backup)?)$/,
  /^secrets?\.(json|ya?ml|toml)$/,
  /\.tfvars$/,
  /^(service-account|client_secret).*\.json$/,
];

// Commands and code that print environment values, which can hold keys and tokens.
const ENV_DUMP = [
  /(^|[\s;&|()`'"])printenv(\.exe)?(?=$|[\s;&|)])/i,
  /(^|[\s;&|(])(ls|dir|gci|get-childitem|gi|get-item|cat|type|gc|get-content)\s+(-path\s+)?env:/i,
  /\$env:\w*(key|token|secret|pass|pwd|credential)/i,
  /\[Environment\]::GetEnvironmentVariables?\b/i,
];
const ENV_CODE = /\bprocess\.env\b|\bos\.environ\b|\bSystem\.getenv\b|\bENV\[/;

function isSecretPath(p) {
  const parts = String(p)
    .replace(/\\/g, '/')
    .replace(/^["']|["']$/g, '')
    .split('/')
    .filter(Boolean);
  if (parts.some((part) => SECRET_DIRS.has(part.toLowerCase()))) return true;
  const base = (parts[parts.length - 1] || '').toLowerCase();
  if (TEMPLATE_SUFFIX.test(base)) return false;
  return SECRET_NAMES.some((re) => re.test(base));
}

module.exports = function secretsCheck(ctx) {
  for (const p of ctx.paths) {
    if (isSecretPath(p)) return `Secret files are off limits: ${p}`;
  }

  if (ctx.isShell) {
    for (const token of ctx.tokens) {
      if (isSecretPath(token)) return `Secret files are off limits: ${token}`;
    }
    if (ENV_DUMP.some((re) => re.test(ctx.command))) return 'Printing environment values is not allowed. They can hold secrets.';
    if (!ctx.isScript && ENV_CODE.test(ctx.command)) return 'Reading environment values in code is not allowed. They can hold secrets.';
  }

  if (ctx.isMcp) {
    for (const piece of ctx.mcpText.split(/["'\s,{}[\]:]+/)) {
      if (piece && isSecretPath(piece)) return `Secret files are off limits: ${piece}`;
    }
  }
  return null;
};
