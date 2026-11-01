import type { FastifyInstance } from 'fastify';

import { createInMemorySearchRepository } from './search.repository.ts';
import { SearchQuerySchema, SearchResultSchema } from './search.schema.ts';
import { createSearchService } from './search.service.ts';
import type { SearchQuery } from './search.types.ts';

// Uses the in-memory repository until the Elasticsearch client exists. Then this picks one based on app.elasticsearch.
export async function searchRoutes(app: FastifyInstance): Promise<void> {
  const service = createSearchService(createInMemorySearchRepository());

  app.get<{ Querystring: SearchQuery }>(
    '/search',
    { schema: { querystring: SearchQuerySchema, response: { 200: SearchResultSchema } } },
    (request) => service.search(request.query),
  );
}
