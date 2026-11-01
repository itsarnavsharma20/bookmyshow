// MongoDB client. Placeholder until the mongodb package is installed.
// The URI always comes from env.mongoUri. Never write a connection string in code.

export type MongoHandle = {
  ping(): Promise<void>;
  close(): Promise<void>;
};

export async function connectMongo(_uri: string): Promise<MongoHandle> {
  throw new Error('MongoDB client is not implemented yet. Install the mongodb package and fill in src/infra/mongo/client.ts.');
}
