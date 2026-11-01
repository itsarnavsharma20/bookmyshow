// Index names and mappings for search. Elasticsearch is a read copy. MongoDB stays the source of truth.

export const ES_INDICES = {
  cinemas: 'bms-cinemas',
  shows: 'bms-shows',
} as const;

export type EsIndexName = (typeof ES_INDICES)[keyof typeof ES_INDICES];

type Mapping = { properties: Record<string, Record<string, unknown>> };

const textWithKeyword = { type: 'text', fields: { keyword: { type: 'keyword' } } };

export const ES_MAPPINGS: Record<EsIndexName, Mapping> = {
  [ES_INDICES.cinemas]: {
    properties: {
      id: { type: 'keyword' },
      name: textWithKeyword,
      cityId: { type: 'keyword' },
      address: { type: 'text' },
    },
  },
  [ES_INDICES.shows]: {
    properties: {
      id: { type: 'keyword' },
      cinemaId: { type: 'keyword' },
      cityId: { type: 'keyword' },
      movieTitle: textWithKeyword,
      startsAt: { type: 'date' },
    },
  },
};
