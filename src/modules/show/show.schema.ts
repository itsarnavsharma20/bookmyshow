import { Type } from '@sinclair/typebox';

import { MAX_LIMIT } from '../../utils/pagination.ts';

export const ShowSchema = Type.Object({
  id: Type.String(),
  cinemaId: Type.String(),
  screen: Type.Integer(),
  movieTitle: Type.String(),
  language: Type.String(),
  startsAt: Type.String(),
  durationMinutes: Type.Integer(),
  priceInr: Type.Integer(),
});

export const ShowParamsSchema = Type.Object({
  showId: Type.String({ minLength: 1 }),
});

export const CinemaShowsParamsSchema = Type.Object({
  cinemaId: Type.String({ minLength: 1 }),
});

export const ListShowsQuerySchema = Type.Object({
  date: Type.Optional(Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' })),
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_LIMIT })),
});

export const ShowPageSchema = Type.Object({
  items: Type.Array(ShowSchema),
  page: Type.Integer(),
  limit: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer(),
});
