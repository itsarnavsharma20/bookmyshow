import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { registerErrorHandler } from '../src/bootstrap/error-handler.ts';
import { CINEMA_SEED } from '../src/modules/cinema/cinema.seed.ts';
import { cinemaRoutes } from '../src/modules/cinema/cinema.routes.ts';

describe('cinema routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    registerErrorHandler(app);
    await app.register(cinemaRoutes, { prefix: '/v1' });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /v1/cities/:cityId/cinemas lists only that city', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-mumbai/cinemas' });
    const page = response.json();
    const expected = CINEMA_SEED.filter((cinema) => cinema.cityId === 'city-mumbai');

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, expected.length);
    assert.ok(page.items.every((cinema: { cityId: string }) => cinema.cityId === 'city-mumbai'));
  });

  test('GET /v1/cities/:cityId/cinemas filters by name with q', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-mumbai/cinemas?q=andheri' });
    const page = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, 1);
    assert.equal(page.items[0].id, 'cinema-mum-andheri');
  });

  test('GET /v1/cities/:cityId/cinemas returns 404 for an unknown city', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-nowhere/cinemas' });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, 'NOT_FOUND');
  });

  test('GET /v1/cities/:cityId/cinemas rejects a limit above the maximum', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cities/city-mumbai/cinemas?limit=1000' });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_ERROR');
  });

  test('GET /v1/cinemas/:cinemaId returns one cinema', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cinemas/cinema-blr-whitefield' });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().cityId, 'city-bengaluru');
  });

  test('GET /v1/cinemas/:cinemaId returns 404 for an unknown id', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cinemas/cinema-nowhere' });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, 'NOT_FOUND');
  });
});
