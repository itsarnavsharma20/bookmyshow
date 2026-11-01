import { Type } from '@sinclair/typebox';

import { MAX_LIMIT } from '../../utils/pagination.ts';

export const CitySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  state: Type.String(),
  country: Type.String(),
});

export const CityParamsSchema = Type.Object({
  cityId: Type.String({ minLength: 1 }),
});

export const ListCitiesQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_LIMIT })),
  q: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
});

export const CityPageSchema = Type.Object({
  items: Type.Array(CitySchema),
  page: Type.Integer(),
  limit: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer(),
});
