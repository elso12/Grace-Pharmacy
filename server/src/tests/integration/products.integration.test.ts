/**
 * ─── Products Integration Tests ──────────────────────────────────────────
 *
 * Verifies GET /api/products returns product list and
 * POST /api/products without auth returns 401.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ── Mock all heavy dependencies ─────────────────────────────────────────
vi.mock('../../config/db', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../services/cronService', () => ({ startCronJobs: vi.fn() }));
vi.mock('../../socket', () => ({ initSocketServer: vi.fn() }));

vi.mock('../../models/Product.model', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              {
                _id: 'prod1',
                name: 'Amoxicillin',
                genericName: 'amoxicillin',
                sku: 'AMX-001',
                category: 'PRESCRIPTION',
                unitPrice: 12.50,
                isActive: true,
                requiresPrescription: true,
                reorderLevel: 10,
                createdAt: new Date(),
              },
              {
                _id: 'prod2',
                name: 'Paracetamol',
                genericName: 'paracetamol',
                sku: 'PCM-001',
                category: 'OTC',
                unitPrice: 5.00,
                isActive: true,
                requiresPrescription: false,
                reorderLevel: 20,
                createdAt: new Date(),
              },
            ]),
          }),
        }),
      }),
    }),
    countDocuments: vi.fn().mockResolvedValue(2),
    findById: vi.fn(),
  },
}));

vi.mock('../../models/InventoryBatch.model', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    }),
    aggregate: vi.fn().mockResolvedValue([]),
    distinct: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../models/User.model', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

// ── Import after mocks ──────────────────────────────────────────────────
import app from '../../app';

// ═════════════════════════════════════════════════════════════════════════════

describe('Products Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Test 1: GET /api/products returns product list ────────────────────
  it('GET /api/products — should return 200 with product list and stock data', async () => {
    const res = await request(app)
      .get('/api/products')
      .expect('Content-Type', /json/);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ── Test 2: POST /api/products without auth ───────────────────────────
  it('POST /api/products — should return 401 without authorization', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: 'Test Drug',
        genericName: 'test',
        category: 'OTC',
        unitPrice: 10,
      })
      .expect('Content-Type', /json/);

    expect(res.status).toBe(401);
  });
});
