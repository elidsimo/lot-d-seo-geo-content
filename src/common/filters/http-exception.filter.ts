import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof ZodError) {
      this.logger.error(
        `Erreur de validation interne sur ${request.method} ${request.url} : ${JSON.stringify(exception.issues)}`,
      );
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Une erreur interne de validation des données est survenue',
      });
    }

    // Erreurs HTTP déjà structurées par NestJS (BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      this.logger.warn(`${request.method} ${request.url} -> ${status}`);
      return response.status(status).json(exception.getResponse());
    }

    // Toute autre erreur imprévue (bug, appel externe qui échoue, etc.)
    const message = exception instanceof Error ? exception.message : 'Erreur inconnue';
    this.logger.error(
      `${request.method} ${request.url} -> 500 : ${message}`,
      (exception as Error)?.stack,
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Une erreur interne est survenue',
    });
  }
}