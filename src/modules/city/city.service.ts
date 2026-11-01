import { NotFoundError } from '../../shared/errors.ts';
import type { CityRepository, CityService } from './city.types.ts';

export function createCityService(repository: CityRepository): CityService {
  return {
    list(query) {
      return repository.list(query);
    },

    async getById(id) {
      const city = await repository.findById(id);
      if (!city) throw new NotFoundError('City', id);
      return city;
    },
  };
}
