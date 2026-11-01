import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { registerErrorHandler } from '../src/bootstrap/error-handler.ts';
import { CITY_SEED } from '../src/modules/city/city.seed.ts';
import { cityRoutes } from '../src/modules/city/city.routes.ts';

describe('city routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    registerErrorHandler(app);
    await app.register(cityRoutes, { prefix: '/v1' });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /v1/cities returns the first page of cities', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities' });
    const page = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, CITY_SEED.length);
    assert.equal(page.items.length, CITY_SEED.length);
    assert.equal(page.page, 1);
  });

  test('GET /v1/cities respects limit and page', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities?limit=3&page=2' });
    const page = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(page.items.length, 3);
    assert.equal(page.items[0].id, CITY_SEED[3]?.id);
    assert.equal(page.totalPages, Math.ceil(CITY_SEED.length / 3));
  });

  test('GET /v1/cities filters by name with q', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities?q=mum' });
    const page = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, 1);
    assert.equal(page.items[0].name, 'Mumbai');
  });

  test('GET /v1/cities rejects a limit below 1', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities?limit=0' });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_ERROR');
  });

  test('GET /v1/cities/:cityId returns one city', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-pune' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().name, 'Pune');
  });

  test('GET /v1/cities/:cityId returns 404 for an unknown id', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-nowhere' });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, 'NOT_FOUND');
  });
});
