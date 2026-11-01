import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { buildLoggerOptions } from './bootstrap/logger.ts';

// Only creates the Fastify instance. Everything that plugs into it is wired in bootstrap/.
export function buildApp(): FastifyInstance {
  return Fastify({ logger: buildLoggerOptions() });
}
