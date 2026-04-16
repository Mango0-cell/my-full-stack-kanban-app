import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      message: err.message,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Unexpected errors
  if (env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(500).json({
    data: null,
    message: 'Internal server error',
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    data: null,
    message: 'Route not found',
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}
