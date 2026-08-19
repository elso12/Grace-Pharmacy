/**
 * ─── Zod Validation Middleware ────────────────────────────────────────────
 * Generic Express middleware factory that validates request data (body,
 * query, or params) against a Zod schema before the request reaches
 * the controller.
 *
 * On failure, returns a structured 422 response with per-field errors.
 *
 * @example
 *   router.post("/batches",
 *     validate(addBatchSchema, "body"),
 *     inventoryController.addBatch
 *   );
 *
 *   router.get("/fefo-dispense",
 *     validate(fefoDispenseSchema, "query"),
 *     inventoryController.fefoDispense
 *   );
 */

import { type Request, type Response, type NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

type RequestSource = "body" | "query" | "params";

export const validate = (schema: ZodSchema, source: RequestSource = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and replace with coerced/transformed values
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".") || "_root";
          fieldErrors[path] = issue.message;
        }

        res.status(422).json({
          status: "error",
          message: "Validation failed",
          errors: fieldErrors,
        });
        return;
      }
      next(error);
    }
  };
};
