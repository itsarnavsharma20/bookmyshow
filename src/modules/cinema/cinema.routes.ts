import type { FastifyInstance } from 'fastify';

import { createInMemoryCityRepository } from '../city/city.repository.ts';
import { createCityService } from '../city/city.service.ts';
import { createInMemoryCinemaRepository } from './cinema.repository.ts';
import {
  CinemaPageSchema,
  CinemaParamsSchema,
  CinemaSchema,
  CityCinemasParamsSchema,
  ListCinemasQuerySchema,
} from './cinema.schema.ts';
import { createCinemaService } from './cinema.service.ts';
import type { CinemaParams, CityCinemasParams, ListCinemasQuery } from './cinema.types.ts';

// Uses in-memory repositories until the MongoDB ones exist. Then this picks one based on app.mongo.
export async function cinemaRoutes(app: FastifyInstance): Promise<void> {
  const service = createCinemaService(
    createInMemoryCinemaRepository(),
    createCityService(createInMemoryCityRepository()),
  );

  app.get<{ Params: CityCinemasParams; Querystring: ListCinemasQuery }>(
    '/cities/:cityId/cinemas',
    {
      schema: {
        params: CityCinemasParamsSchema,
        querystring: ListCinemasQuerySchema,
        response: { 200: CinemaPageSchema },
      },
    },
    (request) => service.listByCity(request.params.cityId, request.query),
  );

  app.get<{ Params: CinemaParams }>(
    '/cinemas/:cinemaId',
    { schema: { params: CinemaParamsSchema, response: { 200: CinemaSchema } } },
    (request) => service.getById(request.params.cinemaId),
  );
}
