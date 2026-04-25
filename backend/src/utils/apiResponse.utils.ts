import { ZodError } from "zod";
import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    statusCode: z.number().int(),
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});

export const SuccessResponse = zodToJsonSchema(SuccessResponseSchema);
export class ApiSuccessRes<TData = unknown> {
  public success = true;

  public data: {
    statusCode: number;
    message: string;
    details?: TData;
  };

  constructor(statusCode: number, message: string, details?: TData) {
    this.data = {
      statusCode,
      message,
      ...(details !== undefined && { details }),
    };
  }
}

const isDev = process.env.NODE_ENV === "dev";
const ErrorObjectSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  errorStack: z.string().optional(),
});
const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ErrorObjectSchema,
});
export const ErrorResponse = zodToJsonSchema(ErrorResponseSchema);
(ErrorResponse as any).properties.success.example = false;

export class ApiError<TDetails = unknown> extends Error {
  public success = false;

  public error: {
    statusCode: number;
    message: string;
    details?: TDetails;
    errorStack?: string;
  };

  constructor(statusCode: number, message: string, details?: TDetails) {
    super(message);

    this.error = {
      statusCode,
      message,
      ...(details !== undefined && { details }),
      ...(isDev && this.stack && { errorStack: this.stack }),
    };

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest<T = unknown>(message: string, details?: T) {
    return new ApiError(400, message, details);
  }

  static validationError<T = unknown>(
    details: T,
    message = "Validation failed",
  ) {
    return new ApiError(400, message, details);
  }

  static fromZodError<T>(error: z.ZodError<T>) {
    return new ApiError(400, "Validation failed", error.flatten().fieldErrors);
  }

  static unauthorized(message = "UNAUTHORIZED") {
    return new ApiError(401, message);
  }

  static forbidden(message = "FORBIDDEN") {
    return new ApiError(403, message);
  }

  static notFound(message = "NOT_FOUND") {
    return new ApiError(404, message);
  }

  static conflict(message = "CONFLICT") {
    return new ApiError(409, message);
  }

  static internal(message = "INTERNAL_SERVER_ERROR") {
    return new ApiError(500, message);
  }
}
