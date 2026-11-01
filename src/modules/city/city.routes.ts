import type { FastifyInstance } from 'fastify';

import { createInMemoryCityRepository } from './city.repository.ts';
import { CityPageSchema, CityParamsSchema, CitySchema, ListCitiesQuerySchema } from './city.schema.ts';
import { createCityService } from './city.service.ts';
import type { CityParams, ListCitiesQuery } from './city.types.ts';

// Uses the in-memory repository until the MongoDB one exists. Then this picks one based on app.mongo.
export async function cityRoutes(app: FastifyInstance): Promise<void> {
  const service = createCityService(createInMemoryCityRepository());

  app.get<{ Querystring: ListCitiesQuery }>(
    '/cities',
    { schema: { querystring: ListCitiesQuerySchema, response: { 200: CityPageSchema } } },
    (request) => service.list(request.query),
  );

  app.get<{ Params: CityParams }>(
    '/cities/:cityId',
    { schema: { params: CityParamsSchema, response: { 200: CitySchema } } },
    (request) => service.getById(request.params.cityId),
  );
}
