// Guardrail rule 3: never touch a database directly.
'use strict';

const DB_CLIENTS =
  /(^|[\s;&|()`'"\\/])(psql|pg_dump|pg_dumpall|pg_restore|dropdb|createdb|mysql|mysqldump|mysqladmin|mariadb|mongo|mongosh|mongodump|mongorestore|mongoimport|mongoexport|sqlite3|redis-cli|sqlcmd|cqlsh|clickhouse-client|influx|cockroach|flyway|liquibase|alembic|knex|sequelize|typeorm|drizzle-kit)(\.exe)?(?=$|[\s;&|()`'"])/i;

const DB_TOOL_COMMANDS = [
  /\bprisma\s+(migrate|db|studio)\b/i,
  /\bsupabase\s+(db|migration)\b/i,
  /\bmanage\.py\s+(flush|migrate|dbshell|sqlflush|loaddata)\b/i,
  /\b(rails|rake)\s+db:/i,
  /\bdotnet\s+ef\s+(database|migrations)\b/i,
  /\bfirebase\s+(firestore|database):/i,
  /\baws\s+(dynamodb|rds|redshift)\b/i,
  /\bgcloud\s+(sql|firestore|spanner|bigtable)\b/i,
  /\baz\s+(sql|cosmosdb|postgres|mysql)\b/i,
];

const DESTRUCTIVE_SQL = [
  /\bdrop\s+(table|database|schema|index|view|collection|user|role)\b/i,
  /\bdelete\s+from\b/i,
  /\btruncate\s+(table\s+)?[\w"`[]/i,
  /\balter\s+table\b[\s\S]*\bdrop\b/i,
  /\.drop(Database|Collection|Table)?\s*\(/,
  /\.(deleteOne|deleteMany|deleteAll|delete_all|deleteById|deleteAllById|deleteInBatch|bulkDelete|findOneAndDelete|findByIdAndDelete|findOneAndRemove|findByIdAndRemove|destroy_all|destroyAll)\s*\(/,
  /\.destroy\s*\(\s*\{/,
  /\.remove\s*\(\s*\{/,
  /\.(delete|del|truncate)\s*\(\s*\)/,
  /\bsession\.delete\s*\(/,
  /\bprisma\.\w+\.delete\s*\(/,
  /\b(flushall|flushdb)\b/i,
];

// Files where destructive database code is blocked when an agent writes it.
const CODE_FILE = /\.(sql|js|jsx|mjs|cjs|ts|tsx|py|rb|go|java|cs|php|sh|bash|ps1|psm1|prisma|kt|rs|swift|scala|pl)$/i;
const WRITE_TOOLS = /^(write|edit|multiedit|notebookedit|create|str_replace_editor|str_replace_based_edit_tool|replace|edit_file|write_file)$/i;

// The guard's own files and its test fixtures contain these patterns on purpose, so they are exempt.
// The folder is already protected by the protect-guardrails check.
function isGuardFile(key) {
  return key.startsWith('.agents/hooks/');
}

// The text an agent is adding to a file.
function addedText(ctx) {
  const ti = ctx.toolInput;
  const parts = [];
  for (const key of ['content', 'new_string', 'new_str', 'new_source', 'file_text', 'insert_text', 'text']) {
    if (typeof ti[key] === 'string') parts.push(ti[key]);
  }
  if (Array.isArray(ti.edits)) {
    for (const edit of ti.edits) if (edit && typeof edit.new_string === 'string') parts.push(edit.new_string);
  }
  if (ctx.isPatch) parts.push(ctx.command.split('\n').filter((line) => line.startsWith('+')).join('\n'));
  return parts.join('\n');
}

const CONNECTION_STRING = /\b(postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|redis|rediss|mssql|sqlserver|cockroachdb|clickhouse):\/\//i;
const DB_FILE = /\.(db|sqlite|sqlite3|db3|mdb|accdb|mdf|ldf)$/i;
const DB_MCP = /postgres|mysql|maria|mongo|sqlite|supabase|redis|database|(^|[_\W])(db|sql)([_\W]|$)|prisma|neon|planetscale|firestore|dynamo|cosmos|bigquery|snowflake/i;

module.exports = function databaseCheck(ctx) {
  if (!ctx.isMcp && (WRITE_TOOLS.test(ctx.toolName) || ctx.isPatch)) {
    const codePaths = ctx.paths.filter((p) => CODE_FILE.test(p.trim()) && !isGuardFile(ctx.relKey(ctx.resolve(p))));
    if (codePaths.length > 0 && DESTRUCTIVE_SQL.some((re) => re.test(addedText(ctx)))) {
      return 'Writing code that deletes or drops database data is not allowed.';
    }
  }

  for (const p of ctx.paths) {
    if (DB_FILE.test(p.trim())) return 'Reading or changing database files directly is not allowed.';
  }

  if (ctx.isShell) {
    const cmd = ctx.command;
    if (DB_CLIENTS.test(cmd) || DB_TOOL_COMMANDS.some((re) => re.test(cmd))) {
      return 'Running database clients or migration tools is not allowed without the user.';
    }
    if (DESTRUCTIVE_SQL.some((re) => re.test(cmd))) return 'Destructive database operations are never allowed.';
    if (CONNECTION_STRING.test(cmd)) return 'Connecting to a database directly is not allowed.';
    if (ctx.tokens.some((t) => DB_FILE.test(t))) return 'Touching database files directly is not allowed.';
  }

  if (ctx.isMcp) {
    if (DB_MCP.test(`${ctx.toolName} ${ctx.server} ${ctx.input.command || ''}`)) {
      return 'Database tools are not allowed without the user.';
    }
    if (DESTRUCTIVE_SQL.some((re) => re.test(ctx.mcpText))) return 'Destructive database operations are never allowed.';
  }
  return null;
};
