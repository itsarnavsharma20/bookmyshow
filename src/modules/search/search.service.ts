import type { SearchRepository, SearchService } from './search.types.ts';

const DEFAULT_LIMIT = 10;

export function createSearchService(repository: SearchRepository): SearchService {
  return {
    async search(query) {
      const hits = await repository.search(query);
      return { items: hits.slice(0, query.limit ?? DEFAULT_LIMIT), total: hits.length };
    },
  };
}
