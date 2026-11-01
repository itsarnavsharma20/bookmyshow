import type { FastifyInstance } from 'fastify';

import { AppError } from '../shared/errors.ts';

type ErrorBody = { error: { code: string; message: string; details?: unknown } };

function body(code: string, message: string, details?: unknown): ErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

// One JSON shape for every error: { error: { code, message } }.
export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(body('NOT_FOUND', `Route ${request.method} ${request.url} was not found.`));
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(body(error.code, error.message));
      return;
    }

    const failure = error instanceof Error ? error : new Error(String(error));

    if ('validation' in failure && failure.validation) {
      reply.status(400).send(body('VALIDATION_ERROR', failure.message, failure.validation));
      return;
    }

    const status = 'statusCode' in failure && typeof failure.statusCode === 'number' ? failure.statusCode : 500;
    if (status < 500) {
      reply.status(status).send(body('REQUEST_ERROR', failure.message));
      return;
    }

    request.log.error(failure);
    reply.status(500).send(body('INTERNAL_ERROR', 'Something went wrong.'));
  });
}
