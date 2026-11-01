import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { registerErrorHandler } from '../src/bootstrap/error-handler.ts';
import { CINEMA_SEED } from '../src/modules/cinema/cinema.seed.ts';
import { searchRoutes } from '../src/modules/search/search.routes.ts';

describe('search routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    registerErrorHandler(app);
    await app.register(searchRoutes, { prefix: '/v1' });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /v1/search finds cinemas by name, ignoring case', async () => {
    const expected = CINEMA_SEED.filter((cinema) => cinema.name.toLowerCase().includes('starlight'));
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=STARLIGHT&type=cinema&limit=50' });
    const result = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(result.total, expected.length);
    assert.ok(result.items.every((hit: { type: string }) => hit.type === 'cinema'));
  });

  test('GET /v1/search finds a movie once, with its show count', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=monsoon&type=movie' });
    const result = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(result.total, 1);
    assert.equal(result.items[0].title, 'The Last Monsoon');
    assert.match(result.items[0].subtitle, /^\d+ shows$/);
  });

  test('GET /v1/search narrows results to one city', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=starlight&type=cinema&cityId=city-delhi' });
    const result = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(result.total, 1);
    assert.equal(result.items[0].id, 'cinema-del-saket');
  });

  test('GET /v1/search applies the limit but reports the full total', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=starlight&type=cinema&limit=2' });
    const result = response.json();

    assert.equal(result.items.length, 2);
    assert.ok(result.total > 2);
  });

  test('GET /v1/search rejects a query shorter than 2 characters', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=a' });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_ERROR');
  });

  test('GET /v1/search returns an empty result when nothing matches', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/search?q=zzzzzz' });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { items: [], total: 0 });
  });
});
