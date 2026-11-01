import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';
import { connectRedis } from '../infra/redis/client.ts';
import type { RedisHandle } from '../infra/redis/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisHandle | null;
  }
}

// Without REDIS_URL the decorator is null, and caching is skipped.
export async function registerRedis(app: FastifyInstance): Promise<void> {
  if (!env.redisUrl) {
    app.log.info('REDIS_URL is not set. Caching is off.');
    app.decorate('redis', null);
    return;
  }

  const redis = await connectRedis(env.redisUrl);
  app.decorate('redis', redis);
  app.addHook('onClose', async () => {
    await redis.close();
  });
}
