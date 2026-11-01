import { paginate } from '../../utils/pagination.ts';
import { SHOW_SEED } from './show.seed.ts';
import type { Show, ShowRepository } from './show.types.ts';

// In-memory store, loaded from the seed. A MongoDB repository with the same shape replaces it later.
export function createInMemoryShowRepository(shows: readonly Show[] = SHOW_SEED): ShowRepository {
  return {
    async listByCinema(cinemaId, query) {
      const atCinema = shows.filter((show) => show.cinemaId === cinemaId);
      const onDate = query.date ? atCinema.filter((show) => show.startsAt.startsWith(query.date as string)) : atCinema;
      const sorted = [...onDate].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return paginate(sorted, query);
    },

    async findById(id) {
      return shows.find((show) => show.id === id);
    },
  };
}
