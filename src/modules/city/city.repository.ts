import { paginate } from '../../utils/pagination.ts';
import { CITY_SEED } from './city.seed.ts';
import type { City, CityRepository } from './city.types.ts';

// In-memory store, loaded from the seed. A MongoDB repository with the same shape replaces it later.
export function createInMemoryCityRepository(cities: readonly City[] = CITY_SEED): CityRepository {
  return {
    async list(query) {
      const term = query.q?.trim().toLowerCase();
      const matches = term ? cities.filter((city) => city.name.toLowerCase().includes(term)) : cities;
      return paginate(matches, query);
    },

    async findById(id) {
      return cities.find((city) => city.id === id);
    },
  };
}
