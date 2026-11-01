import { NotFoundError } from '../../shared/errors.ts';
import type { CinemaRepository, CinemaService, CityLookup } from './cinema.types.ts';

export function createCinemaService(repository: CinemaRepository, cities: CityLookup): CinemaService {
  return {
    async listByCity(cityId, query) {
      await cities.getById(cityId);
      return repository.listByCity(cityId, query);
    },

    async getById(id) {
      const cinema = await repository.findById(id);
      if (!cinema) throw new NotFoundError('Cinema', id);
      return cinema;
    },
  };
}
