import type { Static } from '@sinclair/typebox';

import type { Id, Page } from '../../shared/types.ts';
import type { CityService } from '../city/city.types.ts';
import type { CinemaParamsSchema, CityCinemasParamsSchema, ListCinemasQuerySchema } from './cinema.schema.ts';

export type Cinema = {
  id: Id;
  cityId: Id;
  name: string;
  address: string;
  screens: number;
};

export type ListCinemasQuery = Static<typeof ListCinemasQuerySchema>;
export type CinemaParams = Static<typeof CinemaParamsSchema>;
export type CityCinemasParams = Static<typeof CityCinemasParamsSchema>;

// The only thing cinemas need from the city module: checking that a city exists.
export type CityLookup = Pick<CityService, 'getById'>;

export type CinemaRepository = {
  listByCity(cityId: Id, query: ListCinemasQuery): Promise<Page<Cinema>>;
  findById(id: Id): Promise<Cinema | undefined>;
};

export type CinemaService = {
  listByCity(cityId: Id, query: ListCinemasQuery): Promise<Page<Cinema>>;
  getById(id: Id): Promise<Cinema>;
};
