/* oxlint-disable no-console */
// Seeds the data stores from each module's seed file. Run: node scripts/seed.ts
// It only adds or updates data. It never deletes or resets anything.
// Without MONGO_URI it is a dry run that prints what it would write.

import { env } from '../src/config/env.ts';
import { CINEMA_SEED } from '../src/modules/cinema/cinema.seed.ts';
import { CITY_SEED } from '../src/modules/city/city.seed.ts';
import { SHOW_SEED } from '../src/modules/show/show.seed.ts';

const collections = [
  { name: 'cities', documents: CITY_SEED },
  { name: 'cinemas', documents: CINEMA_SEED },
  { name: 'shows', documents: SHOW_SEED },
];

for (const { name, documents } of collections) {
  console.log(`${name.padEnd(8)} ${documents.length} documents`);
}

if (!env.mongoUri) {
  console.log('Dry run: MONGO_URI is not set, so nothing was written.');
} else {
  // Upserts by id go here once src/infra/mongo/client.ts is filled in.
  throw new Error('Writing to MongoDB is not implemented yet.');
}
