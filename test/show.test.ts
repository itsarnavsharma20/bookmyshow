import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { registerErrorHandler } from '../src/bootstrap/error-handler.ts';
import { showRoutes } from '../src/modules/show/show.routes.ts';
import { SHOW_SEED } from '../src/modules/show/show.seed.ts';

const CINEMA_ID = 'cinema-mum-juhu';
const atCinema = SHOW_SEED.filter((show) => show.cinemaId === CINEMA_ID);
const firstDate = atCinema[0]?.startsAt.slice(0, 10) ?? '';

describe('show routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    registerErrorHandler(app);
    await app.register(showRoutes, { prefix: '/v1' });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /v1/cinemas/:cinemaId/shows lists that cinema, earliest first', async () => {
    const response = await app.inject({ method: 'GET', url: `/v1/cinemas/${CINEMA_ID}/shows` });
    const page = response.json();
    const times: string[] = page.items.map((show: { startsAt: string }) => show.startsAt);

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, atCinema.length);
    assert.deepEqual(times, [...times].sort());
  });

  test('GET /v1/cinemas/:cinemaId/shows filters by date', async () => {
    const expected = atCinema.filter((show) => show.startsAt.startsWith(firstDate));
    const response = await app.inject({ method: 'GET', url: `/v1/cinemas/${CINEMA_ID}/shows?date=${firstDate}` });
    const page = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(page.total, expected.length);
    assert.ok(page.items.every((show: { startsAt: string }) => show.startsAt.startsWith(firstDate)));
  });

  test('GET /v1/cinemas/:cinemaId/shows returns an empty page for a date with no shows', async () => {
    const response = await app.inject({ method: 'GET', url: `/v1/cinemas/${CINEMA_ID}/shows?date=2000-01-01` });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().total, 0);
  });

  test('GET /v1/cinemas/:cinemaId/shows rejects a badly formatted date', async () => {
    const response = await app.inject({ method: 'GET', url: `/v1/cinemas/${CINEMA_ID}/shows?date=01-11-2026` });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_ERROR');
  });

  test('GET /v1/cinemas/:cinemaId/shows returns 404 for an unknown cinema', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/cinemas/cinema-nowhere/shows' });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, 'NOT_FOUND');
  });

  test('GET /v1/shows/:showId returns one show', async () => {
    const target = atCinema[0];
    assert.ok(target);
    const response = await app.inject({ method: 'GET', url: `/v1/shows/${target.id}` });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().movieTitle, target.movieTitle);
  });

  test('GET /v1/shows/:showId returns 404 for an unknown id', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/shows/show-nowhere' });

    assert.equal(response.statusCode, 404);
    assert.equal(response.json().error.code, 'NOT_FOUND');
  });
});
