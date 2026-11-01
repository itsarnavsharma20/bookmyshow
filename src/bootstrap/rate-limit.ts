import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';

// Counts requests in memory. Once Redis is connected, pass it as the `redis` option so limits are shared across instances.
export async function registerRateLimit(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
  });
}
