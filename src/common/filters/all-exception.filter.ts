import { Response } from "express";
import * as Sentry from "@sentry/nestjs";
import { ApiProperty } from "@nestjs/swagger";
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";

export class CustomError {
  @ApiProperty()
  message: string;

  @ApiProperty()
  status_code: number;

  @ApiProperty()
  error: unknown;

  constructor(message: string, status_code: number, error: unknown) {
    this.message = message;
    this.status_code = status_code;
    this.error = error;
  }
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    // Default error message
    const error = new CustomError("Internal Server Error", 500, exception);

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      error.status_code = exception.getStatus();
      error.error = typeof exceptionResponse === "object" && !this.isErrorRedundant(exceptionResponse) ? exceptionResponse["error"] || exceptionResponse : undefined;
      error.message = typeof exceptionResponse === "string" ? exceptionResponse : exceptionResponse["message"] || exceptionResponse["error"];
    }

    response.status(error.status_code).json(error);
  }

  // Check if the error object is redundant; i.e. it only contains message and statusCode which are already handled
  private isErrorRedundant(errorObject: any): boolean {
    const keys = Object.keys(errorObject);
    return keys.length === 2 && keys.includes("message") && keys.includes("statusCode");
  }
}
