import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { AuthenticatedRequest } from '@/auth/types/auth.types';

interface CustomHttpExceptionResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  method: string;
  timeStamp: Date;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    let status: number;
    let errorMessage: string | string[];
    let errorType: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;

      errorMessage = errorResponse?.message || exception.message;
      errorType = errorResponse?.error || exception.name;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'Critical internal server error occurred!';
      errorType = 'InternalServerError';
    }

    const errorResponse: CustomHttpExceptionResponse = {
      statusCode: status,
      error: errorType,
      message: errorMessage,
      path: request.url,
      method: request.method,
      timeStamp: new Date(),
    };

    const logger = new Logger(`${request.method} ${request.url}`);
    logger.error(
      `${status} - User: ${
        request.user ? JSON.stringify(request.user) : 'Not signed in'
      }`,
    );

    response.status(status).json(errorResponse);
  }
}
