import type { Static } from '@sinclair/typebox';

import type { SearchHitSchema, SearchQuerySchema } from './search.schema.ts';

export type SearchHit = Static<typeof SearchHitSchema>;
export type SearchQuery = Static<typeof SearchQuerySchema>;

export type SearchResult = {
  items: SearchHit[];
  // Matches before the limit is applied.
  total: number;
};

// Returns every match. The service applies the limit.
export type SearchRepository = {
  search(query: SearchQuery): Promise<SearchHit[]>;
};

export type SearchService = {
  search(query: SearchQuery): Promise<SearchResult>;
};
