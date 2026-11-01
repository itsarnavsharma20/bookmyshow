import type { Static } from '@sinclair/typebox';

import type { Id, Page } from '../../shared/types.ts';
import type { CityParamsSchema, ListCitiesQuerySchema } from './city.schema.ts';

export type City = {
  id: Id;
  name: string;
  state: string;
  country: string;
};

export type ListCitiesQuery = Static<typeof ListCitiesQuerySchema>;
export type CityParams = Static<typeof CityParamsSchema>;

export type CityRepository = {
  list(query: ListCitiesQuery): Promise<Page<City>>;
  findById(id: Id): Promise<City | undefined>;
};

export type CityService = {
  list(query: ListCitiesQuery): Promise<Page<City>>;
  getById(id: Id): Promise<City>;
};
