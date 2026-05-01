import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // CORS — strict allowlist, NOT origin: true
  const allowedOrigins = (config.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (nodeEnv === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  }));
  app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Validate required env vars for production
  const jwtSecret = config.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is not set');
    process.exit(1);
  }
  const dbUrl = config.get<string>('DATABASE_URL');
  if (!dbUrl) {
    console.error('FATAL: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`Kanban API running on port ${port} [${nodeEnv}]`);
}
bootstrap();
