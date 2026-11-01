import { NotFoundError } from '../../shared/errors.ts';
import type { CinemaLookup, ShowRepository, ShowService } from './show.types.ts';

export function createShowService(repository: ShowRepository, cinemas: CinemaLookup): ShowService {
  return {
    async listByCinema(cinemaId, query) {
      await cinemas.getById(cinemaId);
      return repository.listByCinema(cinemaId, query);
    },

    async getById(id) {
      const show = await repository.findById(id);
      if (!show) throw new NotFoundError('Show', id);
      return show;
    },
  };
}
