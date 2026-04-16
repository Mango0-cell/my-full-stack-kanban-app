import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://mango@localhost/kanban_db',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
};

if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
