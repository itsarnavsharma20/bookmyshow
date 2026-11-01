// App errors with an HTTP status. The error handler in bootstrap turns these into JSON replies.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request.') {
    super(400, 'BAD_REQUEST', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You are not allowed to do this.') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', id ? `${resource} ${id} was not found.` : `${resource} was not found.`);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with the current state.') {
    super(409, 'CONFLICT', message);
  }
}
