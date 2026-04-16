import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { validatePassword, validateRequired } from '../middleware/validator';
import { NotFoundError } from '../utils/errors';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getProfile(req.user!.userId);
    if (!user) throw new NotFoundError('User not found');
    res.json({ data: user, message: 'OK', error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    res.json({ data: user, message: 'Profile updated', error: null });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentPassword = validateRequired(req.body.current_password, 'current_password');
    const newPassword = validatePassword(req.body.new_password);
    await userService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ data: null, message: 'Password changed successfully', error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const password = validateRequired(req.body.password, 'password');
    await userService.deleteAccount(req.user!.userId, password);
    res.json({ data: null, message: 'Account deleted', error: null });
  } catch (err) {
    next(err);
  }
}
