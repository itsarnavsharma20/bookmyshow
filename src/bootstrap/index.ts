import type { FastifyInstance } from 'fastify';

import { registerCors } from './cors.ts';
import { registerDatabase } from './database.ts';
import { registerElasticsearch } from './elasticsearch.ts';
import { registerErrorHandler } from './error-handler.ts';
import { registerHelmet } from './helmet.ts';
import { registerJwt } from './jwt.ts';
import { registerRateLimit } from './rate-limit.ts';
import { registerRedis } from './redis.ts';
import { registerRoutes } from './routes.ts';

// The one place that decides startup order. Each step lives in its own file.
// Shutdown is registered by server.ts, so tests can call bootstrap() without signal handlers.
export async function bootstrap(app: FastifyInstance): Promise<void> {
  await registerHelmet(app);
  await registerCors(app);
  await registerRateLimit(app);
  await registerJwt(app);
  await registerDatabase(app);
  await registerRedis(app);
  await registerElasticsearch(app);
  registerErrorHandler(app);
  await registerRoutes(app);
}
