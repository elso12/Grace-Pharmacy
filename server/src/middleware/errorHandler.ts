import { type Request, type Response, type NextFunction } from "express";
import { AppError, formatValidationErrors } from "../utils/errors";
import mongoose from "mongoose";

/**
 * ─── Global Error Handler Middleware ──────────────────────────────────────
 * Catches all errors thrown or forwarded via next(err) and returns a
 * structured JSON response. Handles:
 *   - AppError (custom operational errors)
 *   - Mongoose ValidationError (field-level validation)
 *   - Mongoose CastError (invalid ObjectId, etc.)
 *   - Duplicate key errors (code 11000)
 *   - Unknown/unexpected errors
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Custom AppError ──────────────────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // ── Mongoose Validation Error ────────────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = formatValidationErrors(
      err.errors as unknown as Record<string, { message: string }>
    );
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // ── Mongoose CastError (e.g., invalid ObjectId) ──────────────────────
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // ── MongoDB Duplicate Key Error ──────────────────────────────────────
  if (
    err.name === "MongoServerError" &&
    (err as unknown as Record<string, unknown>).code === 11000
  ) {
    const keyValue = (err as unknown as Record<string, unknown>).keyValue as Record<
      string,
      unknown
    >;
    const field = Object.keys(keyValue || {})[0] || "field";
    res.status(409).json({
      success: false,
      message: `Duplicate value for '${field}'. This value already exists.`,
    });
    return;
  }

  // ── Unexpected Error ─────────────────────────────────────────────────
  console.error("[UNHANDLED ERROR]", err);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};

/**
 * ─── 404 Not Found Handler ────────────────────────────────────────────────
 * Mounted after all routes to catch unmatched endpoints.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
