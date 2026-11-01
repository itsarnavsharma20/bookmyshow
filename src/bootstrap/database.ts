import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';
import { connectMongo } from '../infra/mongo/client.ts';
import type { MongoHandle } from '../infra/mongo/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    mongo: MongoHandle | null;
  }
}

// Without MONGO_URI the decorator is null, and repositories fall back to their in-memory store.
export async function registerDatabase(app: FastifyInstance): Promise<void> {
  if (!env.mongoUri) {
    app.log.info('MONGO_URI is not set. Using in-memory repositories.');
    app.decorate('mongo', null);
    return;
  }

  const mongo = await connectMongo(env.mongoUri);
  app.decorate('mongo', mongo);
  app.addHook('onClose', async () => {
    await mongo.close();
  });
}
