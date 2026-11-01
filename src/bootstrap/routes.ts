import type { FastifyInstance } from 'fastify';

import { authRoutes } from '../modules/auth/auth.routes.ts';
import { cinemaRoutes } from '../modules/cinema/cinema.routes.ts';
import { cityRoutes } from '../modules/city/city.routes.ts';
import { searchRoutes } from '../modules/search/search.routes.ts';
import { showRoutes } from '../modules/show/show.routes.ts';

const API_PREFIX = '/v1';

// Module routes are registered here under the /v1 prefix, one line per module, as each module is built.
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  await app.register(authRoutes, { prefix: API_PREFIX });
  await app.register(cityRoutes, { prefix: API_PREFIX });
  await app.register(cinemaRoutes, { prefix: API_PREFIX });
  await app.register(showRoutes, { prefix: API_PREFIX });
  await app.register(searchRoutes, { prefix: API_PREFIX });
}
