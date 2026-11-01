import type { FastifyInstance } from 'fastify';

import { env } from '../../config/env.ts';
import { authenticate } from './auth.guard.ts';
import { createInMemoryUserRepository } from './auth.repository.ts';
import { LoginBodySchema, PublicUserSchema, RegisterBodySchema, TokenResponseSchema } from './auth.schema.ts';
import { createAuthService } from './auth.service.ts';
import type { LoginBody, RegisterBody } from './auth.types.ts';

// Stricter limit than the global one, because these routes can be used to guess passwords.
const SENSITIVE_RATE_LIMIT = { rateLimit: { max: 5, timeWindow: '1 minute' } };

// Uses the in-memory repository until the MongoDB one exists. Then this picks one based on app.mongo.
export async function authRoutes(app: FastifyInstance): Promise<void> {
  const service = createAuthService(createInMemoryUserRepository());

  app.post<{ Body: RegisterBody }>(
    '/auth/register',
    {
      config: SENSITIVE_RATE_LIMIT,
      schema: { body: RegisterBodySchema, response: { 201: PublicUserSchema } },
    },
    async (request, reply) => {
      const user = await service.register(request.body);
      return reply.status(201).send(user);
    },
  );

  app.post<{ Body: LoginBody }>(
    '/auth/login',
    {
      config: SENSITIVE_RATE_LIMIT,
      schema: { body: LoginBodySchema, response: { 200: TokenResponseSchema } },
    },
    async (request) => {
      const user = await service.verifyCredentials(request.body);
      const accessToken = app.jwt.sign({ sub: user.id, role: user.role });
      return { accessToken, tokenType: 'Bearer' as const, expiresIn: env.jwtExpiresIn };
    },
  );

  app.get(
    '/auth/me',
    { preHandler: authenticate, schema: { response: { 200: PublicUserSchema } } },
    (request) => service.getProfile(request.user.sub),
  );
}
