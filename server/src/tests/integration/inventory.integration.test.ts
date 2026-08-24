/**
 * ─── Inventory Integration Tests ─────────────────────────────────────────
 *
 * Verifies POST /api/inventory/batch creates a batch when authenticated
 * with valid credentials and correct role.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mock dependencies ───────────────────────────────────────────────────
vi.mock('../../config/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../services/cronService', () => ({ startCronJobs: vi.fn() }));
vi.mock('../../socket', () => ({ initSocketServer: vi.fn() }));



vi.mock('../../models/User.model', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn().mockResolvedValue({
      ...mockAdmin(),
    }),
    create: vi.fn(),
  },
}));

// Lazy factory for mockAdmin to avoid closure issues
function mockAdmin() {
  return {
    _id: '507f1f77bcf86cd799439011',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@gracepharmacy.com',
    role: 'ADMIN',
    isActive: true,
  };
}

vi.mock('../../models/Product.model', () => ({
  default: {
    findById: vi.fn().mockResolvedValue({
      _id: 'prod1',
      name: 'Amoxicillin',
      isActive: true,
    }),
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    countDocuments: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('../../models/InventoryBatch.model', () => ({
  default: {
    create: vi.fn().mockResolvedValue({
      _id: 'batch123',
      product: 'prod1',
      batchNumber: 'LOT-2026-001',
      quantity: 100,
      initialQuantity: 100,
      expiryDate: new Date('2027-12-31'),
      costPrice: 5,
      sellingPrice: 12.5,
      status: 'ACTIVE',
      populate: vi.fn().mockResolvedValue({
        _id: 'batch123',
        product: { _id: 'prod1', name: 'Amoxicillin', sku: 'AMX-001' },
        batchNumber: 'LOT-2026-001',
        quantity: 100,
      }),
    }),
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    aggregate: vi.fn().mockResolvedValue([]),
    distinct: vi.fn().mockResolvedValue([]),
  },
}));

// ── Import after mocks ──────────────────────────────────────────────────
import app from '../../app';
import User from '../../models/User.model';

// ═════════════════════════════════════════════════════════════════════════════

describe('Inventory Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';

    // Re-setup User.findById mock for protect middleware
    (User.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdmin());
  });

  // ── Test 1: POST /api/inventory/batch with valid auth ─────────────────
  it('POST /api/inventory/batch — should return 201 when authenticated with ADMIN role', async () => {
    // Generate a valid JWT for the admin user
    const token = jwt.sign(
      { id: '507f1f77bcf86cd799439011', email: 'admin@gracepharmacy.com', role: 'ADMIN' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const res = await request(app)
      .post('/api/inventory/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: '507f1f77bcf86cd799439011',
        batchNumber: 'LOT-2026-001',
        quantity: 100,
        expiryDate: futureDate.toISOString(),
        costPrice: 5.00,
        sellingPrice: 12.50,
      })
      .expect('Content-Type', /json/);

    if (res.status !== 201) console.log(res.body);

    expect(res.status).toBe(201);
  });
});
