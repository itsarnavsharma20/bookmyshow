import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import { registerErrorHandler } from '../src/bootstrap/error-handler.ts';
import { registerJwt } from '../src/bootstrap/jwt.ts';
import { authRoutes } from '../src/modules/auth/auth.routes.ts';

const account = { email: 'Asha@Example.com', password: 'correct horse battery', name: 'Asha' };

describe('auth routes', () => {
  let app: FastifyInstance;

  before(async () => {
    app = Fastify();
    registerErrorHandler(app);
    await registerJwt(app);
    await app.register(authRoutes, { prefix: '/v1' });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  async function login(email: string, password: string) {
    return app.inject({ method: 'POST', url: '/v1/auth/login', payload: { email, password } });
  }

  test('POST /v1/auth/register creates a customer and hides the password hash', async () => {
    const response = await app.inject({ method: 'POST', url: '/v1/auth/register', payload: account });
    const user = response.json();

    assert.equal(response.statusCode, 201);
    assert.equal(user.email, 'asha@example.com');
    assert.equal(user.role, 'customer');
    assert.equal('passwordHash' in user, false);
    assert.equal('password' in user, false);
  });

  test('POST /v1/auth/register rejects a duplicate email, whatever its case', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { ...account, email: 'ASHA@example.com' },
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.json().error.code, 'CONFLICT');
  });

  test('POST /v1/auth/register rejects a short password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { ...account, email: 'other@example.com', password: 'short' },
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'VALIDATION_ERROR');
  });

  test('POST /v1/auth/login returns a Bearer token', async () => {
    const response = await login(account.email, account.password);
    const body = response.json();

    assert.equal(response.statusCode, 200);
    assert.equal(body.tokenType, 'Bearer');
    assert.ok(body.accessToken.length > 20);
  });

  test('POST /v1/auth/login gives the same 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await login(account.email, 'not the password');
    const unknownEmail = await login('nobody@example.com', account.password);

    assert.equal(wrongPassword.statusCode, 401);
    assert.equal(unknownEmail.statusCode, 401);
    assert.deepEqual(wrongPassword.json(), unknownEmail.json());
  });

  test('GET /v1/auth/me returns the profile for a valid token', async () => {
    const { accessToken } = (await login(account.email, account.password)).json();
    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().email, 'asha@example.com');
  });

  test('GET /v1/auth/me returns 401 without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' });

    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, 'UNAUTHORIZED');
  });

  test('GET /v1/auth/me returns 401 for a bad token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { authorization: 'Bearer not.a.token' },
    });

    assert.equal(response.statusCode, 401);
  });
});
