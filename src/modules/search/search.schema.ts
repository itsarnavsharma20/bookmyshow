import { Type } from '@sinclair/typebox';

export const SearchHitSchema = Type.Object({
  type: Type.Union([Type.Literal('cinema'), Type.Literal('movie')]),
  id: Type.String(),
  title: Type.String(),
  subtitle: Type.String(),
  cityId: Type.Optional(Type.String()),
});

export const SearchQuerySchema = Type.Object({
  q: Type.String({ minLength: 2, maxLength: 100 }),
  type: Type.Optional(Type.Union([Type.Literal('cinema'), Type.Literal('movie')])),
  cityId: Type.Optional(Type.String({ minLength: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
});

export const SearchResultSchema = Type.Object({
  items: Type.Array(SearchHitSchema),
  total: Type.Integer(),
});
