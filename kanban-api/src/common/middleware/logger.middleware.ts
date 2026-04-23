import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, body } = req;

    // Log incoming request
    const safeBody = body ? { ...body } : {};
    if (safeBody.password) safeBody.password = '***';
    if (safeBody.current_password) safeBody.current_password = '***';
    if (safeBody.new_password) safeBody.new_password = '***';

    this.logger.log(`→ ${method} ${originalUrl} ${JSON.stringify(safeBody)}`);

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      this.logger[level](`← ${method} ${originalUrl} ${statusCode} ${duration}ms`);
    });

    next();
  }
}
