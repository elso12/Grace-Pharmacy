/**
 * ─── Zod Validation Middleware ─────────────────────────────────────────────
 *
 * Two middleware factories:
 *
 * 1. `validate(schema, source)` — Legacy single-source validation.
 *    Validates only req.body | req.query | req.params against a Zod schema.
 *    Used by `inventory.routes.ts` (unchanged).
 *
 * 2. `validateRequest(schema)` — Full-request envelope validation.
 *    Validates { body, query, params } as a single Zod object.
 *    Used by auth, product, order, sale, and inventory mutation routes.
 *
 * On failure, returns a structured JSON error:
 * ```json
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": [{ "field": "email", "message": "Invalid email" }]
 * }
 * ```
 */

import { type Request, type Response, type NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

// ─── Legacy signature (source-specific) ─────────────────────────────────────
// Used by inventory.routes.ts — kept for backwards compatibility.

type RequestSource = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: RequestSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          fieldErrors[path] = issue.message;
        }

        res.status(422).json({
          success: false,
          message: 'Validation failed',
          errors: fieldErrors,
        });
        return;
      }
      next(error);
    }
  };
};

// ─── Full-request envelope signature ────────────────────────────────────────
// Validates body + query + params as a single Zod object.

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: Record<string, unknown>; query?: Record<string, unknown>; params?: Record<string, unknown> };

      // Replace req sources with parsed (coerced / transformed) values
      if (parsed.body)   req.body   = parsed.body;
      if (parsed.query)  req.query  = parsed.query as Record<string, string>;
      if (parsed.params) req.params = parsed.params as Record<string, string>;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map((e) => ({
            field: e.path.join('.').replace(/^(body|query|params)\./, ''),
            message: e.message,
          })),
        });
        return;
      }
      return next(error);
    }
  };
};
