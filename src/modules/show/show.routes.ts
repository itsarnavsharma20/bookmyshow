import type { FastifyInstance } from 'fastify';

import { createInMemoryCinemaRepository } from '../cinema/cinema.repository.ts';
import { createCinemaService } from '../cinema/cinema.service.ts';
import { createInMemoryCityRepository } from '../city/city.repository.ts';
import { createCityService } from '../city/city.service.ts';
import { createInMemoryShowRepository } from './show.repository.ts';
import {
  CinemaShowsParamsSchema,
  ListShowsQuerySchema,
  ShowPageSchema,
  ShowParamsSchema,
  ShowSchema,
} from './show.schema.ts';
import { createShowService } from './show.service.ts';
import type { CinemaShowsParams, ListShowsQuery, ShowParams } from './show.types.ts';

// Uses in-memory repositories until the MongoDB ones exist. Then this picks one based on app.mongo.
export async function showRoutes(app: FastifyInstance): Promise<void> {
  const cinemas = createCinemaService(
    createInMemoryCinemaRepository(),
    createCityService(createInMemoryCityRepository()),
  );
  const service = createShowService(createInMemoryShowRepository(), cinemas);

  app.get<{ Params: CinemaShowsParams; Querystring: ListShowsQuery }>(
    '/cinemas/:cinemaId/shows',
    {
      schema: {
        params: CinemaShowsParamsSchema,
        querystring: ListShowsQuerySchema,
        response: { 200: ShowPageSchema },
      },
    },
    (request) => service.listByCinema(request.params.cinemaId, request.query),
  );

  app.get<{ Params: ShowParams }>(
    '/shows/:showId',
    { schema: { params: ShowParamsSchema, response: { 200: ShowSchema } } },
    (request) => service.getById(request.params.showId),
  );
}
