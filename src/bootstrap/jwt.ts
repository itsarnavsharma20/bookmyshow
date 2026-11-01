import { randomBytes } from 'node:crypto';

import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.ts';
import type { AuthTokenPayload } from '../modules/auth/auth.types.ts';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

// env.ts already requires JWT_SECRET in production. In development a random secret is used when it is missing.
export async function registerJwt(app: FastifyInstance): Promise<void> {
  let secret = env.jwtSecret;
  if (!secret) {
    secret = randomBytes(32).toString('hex');
    app.log.warn('JWT_SECRET is not set. Using a random secret, so tokens stop working after a restart.');
  }

  await app.register(jwt, { secret, sign: { expiresIn: env.jwtExpiresIn } });
}
