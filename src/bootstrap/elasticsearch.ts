import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';
import { connectElasticsearch } from '../infra/elasticsearch/client.ts';
import type { ElasticsearchHandle } from '../infra/elasticsearch/client.ts';

declare module 'fastify' {
  interface FastifyInstance {
    elasticsearch: ElasticsearchHandle | null;
  }
}

// Without ELASTICSEARCH_NODE the decorator is null, and the search module falls back to its in-memory repository.
export async function registerElasticsearch(app: FastifyInstance): Promise<void> {
  if (!env.elasticsearchNode) {
    app.log.info('ELASTICSEARCH_NODE is not set. Search is off.');
    app.decorate('elasticsearch', null);
    return;
  }

  const elasticsearch = await connectElasticsearch(env.elasticsearchNode);
  app.decorate('elasticsearch', elasticsearch);
  app.addHook('onClose', async () => {
    await elasticsearch.close();
  });
}
