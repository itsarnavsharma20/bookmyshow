// Redis client. Placeholder until the redis package is installed.
// The URL always comes from env.redisUrl. Never write a connection string in code.

export type RedisHandle = {
  ping(): Promise<void>;
  close(): Promise<void>;
};

export async function connectRedis(_url: string): Promise<RedisHandle> {
  throw new Error('Redis client is not implemented yet. Install the redis package and fill in src/infra/redis/client.ts.');
}
