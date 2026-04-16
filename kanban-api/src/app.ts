import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { sanitizeInput } from './middleware/validator';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import columnRoutes from './routes/columns';
import cardRoutes from './routes/cards';
import cardActionRoutes from './routes/cardActions';
import commentRoutes from './routes/comments';
import attachmentRoutes from './routes/attachments';
import activityRoutes from './routes/activity';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']  // update for production
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4200'],
  credentials: true,
}));

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, message: 'Too many requests', error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' } },
}));

// Body parsing + sanitization
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitizeInput);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/columns', columnRoutes);
app.use('/api/columns/:cid/cards', cardRoutes);
app.use('/api/cards', cardActionRoutes);
app.use('/api', commentRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', activityRoutes);

// 404 + error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Kanban API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
