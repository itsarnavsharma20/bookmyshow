import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';

// With no CORS_ORIGINS set, any origin is allowed in development and none in production.
export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: env.corsOrigins.length > 0 ? env.corsOrigins : env.nodeEnv !== 'production',
    credentials: true,
  });
}
