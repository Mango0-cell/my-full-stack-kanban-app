import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    // Skip WebSocket contexts — they don't have HTTP request/response
    if (host.getType() === 'ws') {
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(`WS error: ${err.message}`);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const r = exResponse as Record<string, unknown>;
        message = (r.message as string) || exception.message;
        if (Array.isArray(r.message)) {
          message = (r.message as string[]).join(', ');
        }
      }
      code = this.getCode(status);
    } else {
      // Log FULL details for unexpected errors so developers can debug
      const err = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `UNHANDLED ${request.method} ${request.originalUrl} — ${err.message}`,
      );
      this.logger.error(err.stack);
    }

    response.status(status).json({
      data: null,
      message,
      error: { code, message },
    });
  }

  private getCode(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 429: return 'RATE_LIMIT';
      default: return 'INTERNAL_ERROR';
    }
  }
}
