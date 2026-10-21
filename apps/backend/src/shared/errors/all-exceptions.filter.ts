import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ValidationFailedException } from './validation.pipe';

// Stable, language-neutral codes; the frontend turns them into text.
const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad_request',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.CONFLICT]: 'conflict',
};

// A thrown exception can carry its own stable code, e.g.
// `new ConflictException({ code: 'kvintet_not_open', message: '...' })`.
const codeOf = (exception: HttpException): string | undefined => {
  const body = exception.getResponse();
  return typeof body === 'object' &&
    'code' in body &&
    typeof body.code === 'string'
    ? body.code
    : undefined;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Response {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ValidationFailedException) {
      return response.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        code: 'validation_failed',
        message: exception.message,
        errors: exception.errors,
      });
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return response.status(statusCode).json({
        statusCode,
        code:
          codeOf(exception) ?? STATUS_CODES[statusCode] ?? `http_${statusCode}`,
        message: exception.message,
      });
    }

    this.logger.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'internal_error',
      message: 'Internal server error',
    });
  }
}
