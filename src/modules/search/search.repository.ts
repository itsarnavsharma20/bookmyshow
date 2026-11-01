import { CINEMA_SEED } from '../cinema/cinema.seed.ts';
import { SHOW_SEED } from '../show/show.seed.ts';
import type { Cinema } from '../cinema/cinema.types.ts';
import type { Show } from '../show/show.types.ts';
import type { SearchHit, SearchRepository } from './search.types.ts';

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Substring search over the seed data. It stands in for Elasticsearch until the real client exists.
// Then an Elasticsearch repository with the same shape is used whenever app.elasticsearch is set.
export function createInMemorySearchRepository(
  cinemas: readonly Cinema[] = CINEMA_SEED,
  shows: readonly Show[] = SHOW_SEED,
): SearchRepository {
  const cityOfCinema = new Map(cinemas.map((cinema) => [cinema.id, cinema.cityId]));

  return {
    async search(query) {
      const term = query.q.trim().toLowerCase();
      const hits: SearchHit[] = [];

      if (!query.type || query.type === 'cinema') {
        for (const cinema of cinemas) {
          if (query.cityId && cinema.cityId !== query.cityId) continue;
          if (!cinema.name.toLowerCase().includes(term)) continue;
          hits.push({ type: 'cinema', id: cinema.id, title: cinema.name, subtitle: cinema.address, cityId: cinema.cityId });
        }
      }

      if (!query.type || query.type === 'movie') {
        const showCounts = new Map<string, number>();
        for (const show of shows) {
          if (query.cityId && cityOfCinema.get(show.cinemaId) !== query.cityId) continue;
          if (!show.movieTitle.toLowerCase().includes(term)) continue;
          showCounts.set(show.movieTitle, (showCounts.get(show.movieTitle) ?? 0) + 1);
        }
        for (const [title, count] of showCounts) {
          hits.push({ type: 'movie', id: `movie-${slug(title)}`, title, subtitle: `${count} shows` });
        }
      }

      return hits;
    },
  };
}
