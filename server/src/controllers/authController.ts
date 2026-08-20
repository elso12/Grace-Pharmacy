/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Grace Pharmacy — Authentication Controller ──────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Handles user registration and login with enterprise-grade error handling.
 *
 * Design decisions:
 *  - Every handler is a plain async function with an EXPLICIT try/catch —
 *    no asyncHandler wrapper — so [AUTH ERROR] is always logged before any
 *    response is sent, making Docker log grepping reliable.
 *  - All field validation happens BEFORE any DB call to avoid unnecessary
 *    round-trips and to surface clear, actionable error messages.
 *  - Passwords are hashed by the User model's pre-save hook (bcryptjs, 12 rounds).
 *    The controller intentionally does NOT hash here to avoid double-hashing.
 *  - The `name` field from the frontend is automatically split into
 *    firstName / lastName for backwards-compatibility.
 *  - JWT_SECRET is checked at call time (not module load) so a missing env
 *    var surfaces immediately with a clear log line.
 */

import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import User, { type IUser } from "../models/User.model";
import { UserRole } from "../types/enums";

// ─── Constants ───────────────────────────────────────────────────────────────
const JWT_EXPIRES_IN = "8h";

/** Minimum password length — mirrors the User model's minlength constraint. */
const PASSWORD_MIN_LENGTH = 8;

/** Basic RFC-5322 email pattern used for fast pre-DB validation. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Signs a JWT for the given user document.
 * Throws immediately if JWT_SECRET is absent — surfaces in Docker logs.
 */
const generateToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // This is a fatal server misconfiguration — log it loudly.
    console.error("[AUTH ERROR]: JWT_SECRET is not defined in environment variables.");
    throw new Error("Server configuration error: JWT_SECRET is not set.");
  }

  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    secret,
    { expiresIn: JWT_EXPIRES_IN },
  );
};

/**
 * Builds the standardised auth payload returned to the client.
 * Deliberately omits the password hash even if it were selected.
 */
const buildAuthResponse = (user: IUser, token: string) => ({
  token,
  user: {
    id:            user._id,
    firstName:     user.firstName,
    lastName:      user.lastName,
    email:         user.email,
    role:          user.role,
    phone:         user.phone,
    licenseNumber: user.licenseNumber,
    isActive:      user.isActive,
    lastLoginAt:   user.lastLoginAt,
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// ─── REGISTER  POST /api/auth/register ──────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Creates a new user account.
 *
 * Accepted body shapes (both supported for frontend flexibility):
 *   { name, email, password, role?, phone?, licenseNumber? }
 *   { firstName, lastName, email, password, role?, phone?, licenseNumber? }
 *
 * Response 201: { status, message, data: { token, user } }
 * Response 400: Missing / invalid fields
 * Response 409: Email already registered
 * Response 500: Unexpected server error
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── Step 1: Destructure body ─────────────────────────────────────────
    const {
      name,         // Optional alias: full name sent as a single field
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      licenseNumber,
    } = req.body;

    // ── Step 2: Resolve firstName / lastName ────────────────────────────
    // Support both { name } and { firstName, lastName } from the frontend.
    let resolvedFirstName: string = firstName?.trim() ?? "";
    let resolvedLastName:  string = lastName?.trim()  ?? "";

    if (!resolvedFirstName && name) {
      const parts = String(name).trim().split(/\s+/);
      resolvedFirstName = parts[0] ?? "";
      resolvedLastName  = parts.slice(1).join(" ") || resolvedFirstName; // fallback: duplicate if single word
    }

    // ── Step 3: Validate required fields BEFORE any DB call ─────────────
    if (!resolvedFirstName) {
      res.status(400).json({ status: "error", message: "Missing name (or firstName). Please provide your full name." });
      return;
    }

    if (!email) {
      res.status(400).json({ status: "error", message: "Missing email. Please provide a valid email address." });
      return;
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      res.status(400).json({ status: "error", message: "Invalid email format. Please enter a valid email address." });
      return;
    }

    if (!password) {
      res.status(400).json({ status: "error", message: "Missing password. A password is required." });
      return;
    }

    if (String(password).length < PASSWORD_MIN_LENGTH) {
      res.status(400).json({
        status:  "error",
        message: `Password too short. Minimum ${PASSWORD_MIN_LENGTH} characters required.`,
      });
      return;
    }

    // ── Step 4: Validate role if provided ───────────────────────────────
    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        status:  "error",
        message: `Invalid role "${role}". Accepted values: ${Object.values(UserRole).join(", ")}.`,
      });
      return;
    }

    // ── Step 5: Check for duplicate email ───────────────────────────────
    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        status:  "error",
        message: "An account with this email address already exists.",
      });
      return;
    }

    // ── Step 6: Create user (password is hashed by the pre-save hook) ───
    console.log(`[AUTH] Registering new user: ${normalizedEmail}`);

    const user = await User.create({
      firstName:     resolvedFirstName,
      lastName:      resolvedLastName || resolvedFirstName,
      email:         normalizedEmail,
      password,                           // ← hashed by pre-save bcrypt hook
      role:          role || UserRole.CUSTOMER,
      phone,
      licenseNumber,
    });

    console.log(`[AUTH] User registered successfully: ${user._id} (${user.email})`);

    // ── Step 7: Sign JWT ─────────────────────────────────────────────────
    const token = generateToken(user);

    // ── Step 8: Return success ───────────────────────────────────────────
    res.status(201).json({
      status:  "success",
      message: `Account created successfully. Welcome, ${user.firstName}!`,
      data:    buildAuthResponse(user, token),
    });

  } catch (error: unknown) {
    // ── Catch-all: log the full error so it appears in Docker logs ───────
    console.error("[AUTH ERROR]:", error);

    // Surface Mongoose duplicate-key errors (code 11000) cleanly.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as Record<string, unknown>).code === 11000
    ) {
      res.status(409).json({
        status:  "error",
        message: "An account with this email address already exists.",
      });
      return;
    }

    // Surface Mongoose validation errors (e.g., minlength, required).
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as Record<string, unknown>).name === "ValidationError" &&
      "errors" in error
    ) {
      const validationErrors = (error as Record<string, unknown>).errors as Record<string, { message: string }>;
      const firstMessage = Object.values(validationErrors)[0]?.message ?? "Validation failed.";
      res.status(422).json({ status: "error", message: firstMessage });
      return;
    }

    // Fallback — avoid leaking stack traces to the client.
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    res.status(500).json({
      status:  "error",
      message: process.env.NODE_ENV === "production" ? "Registration failed. Please try again." : errorMessage,
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── LOGIN  POST /api/auth/login ────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Authenticates a user with email + password and returns a signed JWT.
 *
 * Body: { email, password }
 *
 * Response 200: { status, message, data: { token, user } }
 * Response 400: Missing fields
 * Response 401: Invalid credentials / account deactivated
 * Response 500: Unexpected server error
 *
 * Security notes:
 *  - Both "user not found" and "wrong password" return identical 401 messages
 *    to prevent user enumeration attacks.
 *  - lastLoginAt is updated after successful auth.
 *  - Password field is explicitly re-selected with "+password" since the
 *    User model uses `select: false` by default.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // ── Step 1: Validate presence of credentials BEFORE DB call ─────────
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ status: "error", message: "Missing email. Please provide your email address." });
      return;
    }

    if (!password) {
      res.status(400).json({ status: "error", message: "Missing password. Please provide your password." });
      return;
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      res.status(400).json({ status: "error", message: "Invalid email format." });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // ── Step 2: Look up user — explicitly select password ────────────────
    console.log(`[AUTH] Login attempt for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      // Do NOT reveal that the user doesn't exist (prevents enumeration).
      console.warn(`[AUTH] Login failed — no account found for: ${normalizedEmail}`);
      res.status(401).json({ status: "error", message: "Invalid email or password." });
      return;
    }

    // ── Step 3: Check account status before verifying password ──────────
    if (!user.isActive) {
      console.warn(`[AUTH] Login failed — account deactivated: ${user._id}`);
      res.status(403).json({
        status:  "error",
        message: "Your account has been deactivated. Please contact an administrator.",
      });
      return;
    }

    // ── Step 4: Verify password ──────────────────────────────────────────
    const isPasswordValid = await user.comparePassword(String(password));

    if (!isPasswordValid) {
      console.warn(`[AUTH] Login failed — wrong password for user: ${user._id}`);
      res.status(401).json({ status: "error", message: "Invalid email or password." });
      return;
    }

    // ── Step 5: Update last login timestamp (non-blocking save) ─────────
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    console.log(`[AUTH] Login successful for user: ${user._id} (${user.email})`);

    // ── Step 6: Sign JWT ─────────────────────────────────────────────────
    const token = generateToken(user);

    // ── Step 7: Return success ───────────────────────────────────────────
    res.status(200).json({
      status:  "success",
      message: `Welcome back, ${user.firstName}!`,
      data:    buildAuthResponse(user, token),
    });

  } catch (error: unknown) {
    // ── Catch-all: log the full error so it appears in Docker logs ───────
    console.error("[AUTH ERROR]:", error);

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    res.status(500).json({
      status:  "error",
      message: process.env.NODE_ENV === "production" ? "Login failed. Please try again." : errorMessage,
    });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ status: 'error', message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(200).json({ status: 'success', message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); 

    await user.save({ validateBeforeSave: false });
    console.log(`[AUTH] Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({ status: 'success', message: 'If an account exists, a reset link has been sent.' });
  } catch (error: any) {
    console.error('[AUTH ERROR]:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      res.status(400).json({ status: 'error', message: 'Token and new password (min 8 chars) required.' });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({ status: 'error', message: 'Token is invalid or expired.' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ status: 'success', message: 'Password reset successful.' });
  } catch (error: any) {
    console.error('[AUTH ERROR]:', error.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
