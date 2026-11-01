/* oxlint-disable no-console */
// Checks the environment and prints what is set. Run: node scripts/check-env.ts
// Plain settings print their value. URLs and secrets only print "set" or "not set".

try {
  const { env } = await import('../src/config/env.ts');

  const plain: [string, string | number | boolean][] = [
    ['NODE_ENV', env.nodeEnv],
    ['HOST', env.host],
    ['PORT', env.port],
    ['LOG_LEVEL', env.logLevel],
    ['LOG_TO_FILE', env.logToFile],
    ['LOG_DIR', env.logDir],
    ['CORS_ORIGINS', env.corsOrigins.length > 0 ? env.corsOrigins.join(', ') : '(none)'],
    ['RATE_LIMIT_MAX', env.rateLimitMax],
    ['RATE_LIMIT_WINDOW', env.rateLimitWindow],
    ['JWT_EXPIRES_IN', env.jwtExpiresIn],
  ];
  const hidden: [string, string | undefined][] = [
    ['MONGO_URI', env.mongoUri],
    ['REDIS_URL', env.redisUrl],
    ['ELASTICSEARCH_NODE', env.elasticsearchNode],
    ['JWT_SECRET', env.jwtSecret],
  ];

  for (const [name, value] of plain) console.log(`${name.padEnd(20)} ${value}`);
  for (const [name, value] of hidden) console.log(`${name.padEnd(20)} ${value ? 'set' : 'not set'}`);
  console.log('Environment is valid.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
