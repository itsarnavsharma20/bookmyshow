import { paginate } from '../../utils/pagination.ts';
import { CINEMA_SEED } from './cinema.seed.ts';
import type { Cinema, CinemaRepository } from './cinema.types.ts';

// In-memory store, loaded from the seed. A MongoDB repository with the same shape replaces it later.
export function createInMemoryCinemaRepository(cinemas: readonly Cinema[] = CINEMA_SEED): CinemaRepository {
  return {
    async listByCity(cityId, query) {
      const term = query.q?.trim().toLowerCase();
      const inCity = cinemas.filter((cinema) => cinema.cityId === cityId);
      const matches = term ? inCity.filter((cinema) => cinema.name.toLowerCase().includes(term)) : inCity;
      return paginate(matches, query);
    },

    async findById(id) {
      return cinemas.find((cinema) => cinema.id === id);
    },
  };
}
