import { CINEMA_SEED } from '../cinema/cinema.seed.ts';
import type { Show } from './show.types.ts';

const DAYS = 3;
const SLOTS = ['10:00', '13:30', '17:00', '20:30'] as const;
const LANGUAGES = ['Hindi', 'English', 'Hindi', 'English'] as const;
const MOVIES = [
  { title: 'The Last Monsoon', durationMinutes: 142 },
  { title: 'Midnight Express 2', durationMinutes: 128 },
  { title: 'Laughter Lane', durationMinutes: 115 },
  { title: 'Skyline Heist', durationMinutes: 136 },
  { title: 'Raga', durationMinutes: 150 },
] as const;

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

function istDate(base: Date, dayOffset: number): string {
  return new Date(base.getTime() + IST_OFFSET_MS + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

// Builds shows for today and the next days, so the seed never goes stale. Dates are India time (+05:30).
// Ids are fixed per cinema, day offset, and slot. Movie titles are made up.
export function buildShowSeed(now: Date = new Date()): Show[] {
  const shows: Show[] = [];

  CINEMA_SEED.forEach((cinema, cinemaIndex) => {
    for (let day = 0; day < DAYS; day += 1) {
      const date = istDate(now, day);

      SLOTS.forEach((slot, slotIndex) => {
        const movie = MOVIES[(cinemaIndex + slotIndex) % MOVIES.length];
        if (!movie) return;

        shows.push({
          id: `show-${cinema.id}-d${day}-s${slotIndex}`,
          cinemaId: cinema.id,
          screen: (slotIndex % cinema.screens) + 1,
          movieTitle: movie.title,
          language: LANGUAGES[slotIndex] ?? 'Hindi',
          startsAt: `${date}T${slot}:00+05:30`,
          durationMinutes: movie.durationMinutes,
          priceInr: 180 + slotIndex * 40,
        });
      });
    }
  });

  return shows;
}

export const SHOW_SEED: readonly Show[] = buildShowSeed();
