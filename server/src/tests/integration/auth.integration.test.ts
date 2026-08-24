/**
 * ─── Auth Integration Tests ──────────────────────────────────────────────
 *
 * Verifies the full HTTP request lifecycle for authentication endpoints
 * through the real Express middleware chain (Helmet, CORS, rate-limiting,
 * Zod validation, error handler) using Supertest.
 *
 * Database layer is mocked — no real MongoDB connection required.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock Mongoose models before importing app ────────────────────────────
// The `protect` middleware calls User.findById, so we mock the model.
// The authController calls User.findOne and User.create.

const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@gracepharmacy.com',
  role: 'ADMIN',
  phone: '+254700000000',
  isActive: true,
  lastLoginAt: new Date(),
  password: '$2a$12$hashedpassword',
  comparePassword: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../../models/User.model', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock connectDB to prevent real database connection on import
vi.mock('../../config/db', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock cron jobs
vi.mock('../../services/cronService', () => ({
  startCronJobs: vi.fn(),
}));

// Mock socket
vi.mock('../../socket', () => ({
  initSocketServer: vi.fn(),
}));

// ── Import after mocks ──────────────────────────────────────────────────
import app from '../../app';
import User from '../../models/User.model';

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Test 1: Successful login ──────────────────────────────────────────
  it('POST /api/auth/login — should return 200 and a JWT for valid credentials', async () => {
    // Arrange: User.findOne returns the mock user with password selected
    const userWithPassword = {
      ...mockUser,
      comparePassword: vi.fn().mockResolvedValue(true),
      save: vi.fn().mockResolvedValue(undefined),
    };

    // User.findOne().select('+password') chain
    (User.findOne as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockResolvedValue(userWithPassword),
    });

    // Ensure JWT_SECRET is set
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gracepharmacy.com', password: 'Admin@123' })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe('admin@gracepharmacy.com');
  });

  // ── Test 2: Invalid credentials ───────────────────────────────────────
  it('POST /api/auth/login — should return 401 for invalid credentials', async () => {
    // Arrange: User exists but password doesn't match
    const userWithPassword = {
      ...mockUser,
      comparePassword: vi.fn().mockResolvedValue(false),
      save: vi.fn(),
    };

    (User.findOne as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockResolvedValue(userWithPassword),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gracepharmacy.com', password: 'wrongpassword' })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(401);
  });

  // ── Test 3: Validation errors on malformed payload ────────────────────
  it('POST /api/auth/login — should return 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Admin@123' }) // missing email
      .expect('Content-Type', /json/);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
