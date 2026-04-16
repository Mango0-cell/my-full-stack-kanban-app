import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthError } from '../utils/errors';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthError('Missing authorization header');
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
