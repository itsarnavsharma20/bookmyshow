// Elasticsearch client. Placeholder until the @elastic/elasticsearch package is installed.
// The node URL always comes from env.elasticsearchNode. Never write a URL in code.

export type ElasticsearchHandle = {
  ping(): Promise<void>;
  close(): Promise<void>;
};

export async function connectElasticsearch(_node: string): Promise<ElasticsearchHandle> {
  throw new Error(
    'Elasticsearch client is not implemented yet. Install @elastic/elasticsearch and fill in src/infra/elasticsearch/client.ts.',
  );
}
