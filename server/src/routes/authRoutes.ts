/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Authentication Routes ──────────────────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Maps HTTP endpoints to authentication controller handlers.
 *
 * Route structure (all mounted under /api/auth in app.ts):
 *
 *   POST  /register  → Create a new user account
 *   POST  /login     → Authenticate and receive a JWT
 *   GET   /me        → Get current authenticated user profile
 */

import { Router, type Request, type Response } from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/errors";

const router: Router = Router();

// ─── POST /api/auth/register ────────────────────────────────────────────────
// Creates a new user with a hashed password and returns a JWT.
// Body: { firstName, lastName, email, password, role?, phone?, licenseNumber? }
router.post("/register", registerUser);

// ─── POST /api/auth/login ───────────────────────────────────────────────────
// Authenticates credentials and returns a JWT + user profile.
// Body: { email, password }
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
// Returns the currently authenticated user's profile.
// Requires: Authorization: Bearer <token>
router.get(
  "/me",
  protect,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // req.user is populated by the `protect` middleware
    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: req.user!._id,
          firstName: req.user!.firstName,
          lastName: req.user!.lastName,
          email: req.user!.email,
          role: req.user!.role,
          phone: req.user!.phone,
          licenseNumber: req.user!.licenseNumber,
          isActive: req.user!.isActive,
          lastLoginAt: req.user!.lastLoginAt,
        },
      },
    });
  }),
);

export default router;
