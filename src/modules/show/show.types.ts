import type { Static } from '@sinclair/typebox';

import type { CinemaService } from '../cinema/cinema.types.ts';
import type { Id, Page } from '../../shared/types.ts';
import type { CinemaShowsParamsSchema, ListShowsQuerySchema, ShowParamsSchema } from './show.schema.ts';

export type Show = {
  id: Id;
  cinemaId: Id;
  screen: number;
  movieTitle: string;
  language: string;
  // ISO 8601 with an offset, for example 2026-11-01T17:00:00+05:30. The date filter uses the date part as written.
  startsAt: string;
  durationMinutes: number;
  // Whole rupees.
  priceInr: number;
};

export type ListShowsQuery = Static<typeof ListShowsQuerySchema>;
export type ShowParams = Static<typeof ShowParamsSchema>;
export type CinemaShowsParams = Static<typeof CinemaShowsParamsSchema>;

// The only thing shows need from the cinema module: checking that a cinema exists.
export type CinemaLookup = Pick<CinemaService, 'getById'>;

export type ShowRepository = {
  listByCinema(cinemaId: Id, query: ListShowsQuery): Promise<Page<Show>>;
  findById(id: Id): Promise<Show | undefined>;
};

export type ShowService = {
  listByCinema(cinemaId: Id, query: ListShowsQuery): Promise<Page<Show>>;
  getById(id: Id): Promise<Show>;
};
