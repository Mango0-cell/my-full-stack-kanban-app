import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { validateEmail, validatePassword, validateRequired } from '../middleware/validator';
import { NotFoundError } from '../utils/errors';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);
    const displayName = validateRequired(req.body.display_name, 'display_name');

    const result = await authService.registerUser({ email, password, displayName });
    res.status(201).json({ data: result, message: 'Registration successful', error: null });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = validateEmail(req.body.email);
    const password = validateRequired(req.body.password, 'password');

    const result = await authService.loginUser({ email, password });
    res.json({ data: result, message: 'Login successful', error: null });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.json({ data: null, message: 'Logged out successfully', error: null });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    if (!user) throw new NotFoundError('User not found');
    res.json({ data: user, message: 'OK', error: null });
  } catch (err) {
    next(err);
  }
}
