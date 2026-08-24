/**
 * ─── Auth Validation Schemas ──────────────────────────────────────────────
 *
 * Zod v4 schemas for all authentication endpoints.
 * Used with `validateRequest()` middleware so each schema wraps its
 * constraints under a `body` key.
 *
 * Zod v4 API notes:
 *   - Error messages use z.string("message") instead of { required_error }
 *   - z.nativeEnum() for TypeScript enums
 */

import { z } from 'zod';
import { UserRole } from '../types/enums';

// ─── Helpers ────────────────────────────────────────────────────────────────
const emailField = z
  .string('Email is required')
  .email('Invalid email format')
  .transform((v) => v.toLowerCase().trim());

const passwordField = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters');

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ═════════════════════════════════════════════════════════════════════════════
export const registerSchema = z.object({
  body: z.object({
    /** Optional single-field name (split into first/last by the controller) */
    name: z.string().min(1, 'Name cannot be empty').optional(),

    /** First name — required if `name` is absent */
    firstName: z.string().min(1, 'First name cannot be empty').optional(),

    /** Last name — optional (falls back to firstName if absent) */
    lastName: z.string().optional(),

    email: emailField,
    password: passwordField,

    /** Role — defaults to CUSTOMER in the controller */
    role: z.nativeEnum(UserRole).optional(),

    phone: z.string().trim().optional(),
    licenseNumber: z.string().trim().optional(),
  }).refine(
    (data) => data.name || data.firstName,
    { message: 'Either name or firstName is required', path: ['name'] }
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═════════════════════════════════════════════════════════════════════════════
export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string('Password is required').min(1, 'Password is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═════════════════════════════════════════════════════════════════════════════
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// ═════════════════════════════════════════════════════════════════════════════
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string('Reset token is required').min(1, 'Reset token is required'),
    newPassword: passwordField,
  }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
