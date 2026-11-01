import type { FastifyRequest } from 'fastify';

import { ForbiddenError, UnauthorizedError } from '../../shared/errors.ts';
import type { Role } from './auth.types.ts';

// preHandler for protected routes. Fills request.user from the Bearer token.
export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Invalid or missing token.');
  }
}

// preHandler that also checks the role in the token.
export function requireRole(role: Role) {
  return async (request: FastifyRequest): Promise<void> => {
    await authenticate(request);
    if (request.user.role !== role) throw new ForbiddenError();
  };
}
