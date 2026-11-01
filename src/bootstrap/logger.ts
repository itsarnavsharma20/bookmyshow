import { join } from 'node:path';

import type { FastifyServerOptions } from 'fastify';

import { env } from '../config/env.ts';

type Target = { target: string; level: string; options: Record<string, unknown> };

// Options for the `logger` field of the Fastify constructor. Logs go to stdout, and to a file when LOG_TO_FILE is on.
export function buildLoggerOptions(): FastifyServerOptions['logger'] {
  if (env.logLevel === 'silent') return false;

  const targets: Target[] = [];

  if (env.nodeEnv === 'development') {
    targets.push({
      target: 'pino-pretty',
      level: env.logLevel,
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
    });
  } else {
    targets.push({ target: 'pino/file', level: env.logLevel, options: { destination: 1 } });
  }

  if (env.logToFile) {
    targets.push({
      target: 'pino/file',
      level: env.logLevel,
      options: { destination: join(env.logDir, 'app.log'), mkdir: true },
    });
  }

  return {
    level: env.logLevel,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    transport: { targets },
  };
}
