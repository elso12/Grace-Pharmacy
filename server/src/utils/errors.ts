import { type Request, type Response, type NextFunction } from "express";

/**
 * ─── AppError ─────────────────────────────────────────────────────────────
 * Custom error class with HTTP status code for structured error handling.
 * Thrown from services/controllers, caught by the global error handler.
 *
 * @example
 *   throw new AppError("Product not found", 404);
 *   throw new AppError("Insufficient stock", 422);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Preserve proper stack trace in V8 engines
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * ─── Async Handler ────────────────────────────────────────────────────────
 * Wraps async route handlers to automatically catch rejected promises
 * and forward them to the global error handler via next().
 *
 * Eliminates the need for try/catch blocks in every controller.
 *
 * @example
 *   router.get("/products", asyncHandler(async (req, res) => {
 *     const products = await Product.find();
 *     res.json(products);
 *   }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * ─── Validation Error Formatter ───────────────────────────────────────────
 * Transforms Mongoose ValidationError into a client-friendly format.
 *
 * @example output:
 *   { name: "Product name is required", sku: "SKU must be unique" }
 */
export interface ValidationErrors {
  [field: string]: string;
}

export const formatValidationErrors = (
  error: Record<string, { message: string }>
): ValidationErrors => {
  const formatted: ValidationErrors = {};
  for (const [field, err] of Object.entries(error)) {
    formatted[field] = err.message;
  }
  return formatted;
};
