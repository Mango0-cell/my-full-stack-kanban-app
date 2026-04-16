import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PAYLOAD_SIZE = 10 * 1024; // 10kb

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      result[key] = stripHtml(val);
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = sanitizeObject(val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const raw = JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > MAX_PAYLOAD_SIZE) {
      return next(new ValidationError('Request payload too large (max 10kb)'));
    }
    req.body = sanitizeObject(req.body as Record<string, unknown>);
  }
  next();
}

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email address');
  }
  return email.toLowerCase();
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw new ValidationError('Password must be a string');
  }
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ValidationError('Password must contain uppercase, lowercase, and a number');
  }
  return password;
}

export function validateRequired(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
}
