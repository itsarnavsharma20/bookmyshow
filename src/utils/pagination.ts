import type { Page, PageQuery } from '../shared/types.ts';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function normalizePage(query: PageQuery = {}): { page: number; limit: number } {
  const page = Math.max(DEFAULT_PAGE, Math.trunc(query.page ?? DEFAULT_PAGE));
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.trunc(query.limit ?? DEFAULT_LIMIT)));
  return { page, limit };
}

// Slices an in-memory list. A database repository would use skip and limit instead.
export function paginate<T>(items: readonly T[], query: PageQuery = {}): Page<T> {
  const { page, limit } = normalizePage(query);
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  };
}
