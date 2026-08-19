/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Authentication & Authorization Middleware ──────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Two middleware functions for securing routes:
 *
 *   1. `protect`  — Verifies the JWT from the Authorization header.
 *                    Attaches the authenticated user to `req.user`.
 *                    Must be applied BEFORE any route that requires login.
 *
 *   2. `authorizeRoles` — Restricts access to specific user roles.
 *                          Must be used AFTER `protect` (needs `req.user`).
 *
 * Usage example:
 *   router.post("/batches",
 *     protect,
 *     authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST),
 *     inventoryController.addBatch
 *   );
 */

import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User.model";
import { type UserRole } from "../types/enums";
import { AppError, asyncHandler } from "../utils/errors";

// ─── Extend Express Request to include `user` ──────────────────────────────
// This module augmentation lets TypeScript know that `req.user` exists
// on all requests that pass through the `protect` middleware.

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// ─── JWT Payload shape ──────────────────────────────────────────────────────
interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── PROTECT MIDDLEWARE ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Extracts and verifies the JWT from the `Authorization` header.
 *
 * Expected header format:
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 *
 * On success → attaches the full user document (minus password) to `req.user`.
 * On failure → throws a 401 AppError caught by the global error handler.
 *
 * Why we re-fetch the user from the DB instead of trusting the JWT payload?
 *   - The user might have been deactivated or deleted after the token was issued.
 *   - The role might have been changed by an admin.
 *   - We get the full document with virtuals (e.g., fullName) available.
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // ── Step 1: Extract token from header ─────────────────────────────
    let token: string | undefined;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // "Bearer eyJ..." → "eyJ..."
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      throw new AppError(
        "Not authorized — no token provided. Please log in.",
        401,
      );
    }

    // ── Step 2: Verify the token ──────────────────────────────────────
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError(
        "Server configuration error: JWT_SECRET is not defined.",
        500,
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (err) {
      // jwt.verify throws different errors for expired / malformed tokens
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          "Token has expired. Please log in again.",
          401,
        );
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          "Invalid token. Please log in again.",
          401,
        );
      }
      throw new AppError("Authentication failed.", 401);
    }

    // ── Step 3: Fetch the user from DB ────────────────────────────────
    // Don't select the password — it's not needed after authentication
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError(
        "The user belonging to this token no longer exists.",
        401,
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Contact an administrator.",
        403,
      );
    }

    // ── Step 4: Attach user to request and continue ───────────────────
    req.user = user;
    next();
  },
);

// ═════════════════════════════════════════════════════════════════════════════
// ─── AUTHORIZE ROLES MIDDLEWARE ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Restricts access to one or more user roles.
 *
 * Must be used AFTER `protect` — relies on `req.user` being populated.
 *
 * @param roles - Allowed roles (e.g., UserRole.ADMIN, UserRole.PHARMACIST)
 * @returns     Express middleware function
 *
 * @example
 *   // Only admins can delete products
 *   router.delete("/products/:id",
 *     protect,
 *     authorizeRoles(UserRole.ADMIN),
 *     productController.deleteProduct
 *   );
 *
 *   // Pharmacists and technicians can add batches
 *   router.post("/inventory/batches",
 *     protect,
 *     authorizeRoles(UserRole.ADMIN, UserRole.PHARMACIST, UserRole.TECHNICIAN),
 *     inventoryController.addBatch
 *   );
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If protect middleware wasn't applied, req.user won't exist
    if (!req.user) {
      throw new AppError(
        "Authorization check failed — user not authenticated. " +
          "Ensure the `protect` middleware runs before `authorizeRoles`.",
        401,
      );
    }

    // Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role as UserRole)) {
      throw new AppError(
        `Access denied. Role "${req.user.role}" is not authorized for this action. ` +
          `Required: ${roles.join(", ")}`,
        403, // 403 Forbidden (authenticated but not authorized)
      );
    }

    next();
  };
};
