import { Type } from '@sinclair/typebox';

import { MAX_LIMIT } from '../../utils/pagination.ts';

export const CinemaSchema = Type.Object({
  id: Type.String(),
  cityId: Type.String(),
  name: Type.String(),
  address: Type.String(),
  screens: Type.Integer(),
});

export const CinemaParamsSchema = Type.Object({
  cinemaId: Type.String({ minLength: 1 }),
});

export const CityCinemasParamsSchema = Type.Object({
  cityId: Type.String({ minLength: 1 }),
});

export const ListCinemasQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_LIMIT })),
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
});

export const CinemaPageSchema = Type.Object({
  items: Type.Array(CinemaSchema),
  page: Type.Integer(),
  limit: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer(),
});
