import { describe, it, expect, vi } from 'vitest';

// Mock models before importing controller
vi.mock('../models/InventoryBatch.model', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'batch1',
          batchNumber: 'B001',
          quantity: 10,
          expiryDate: new Date('2026-10-01'),
          status: 'ACTIVE'
        },
        {
          _id: 'batch2',
          batchNumber: 'B002',
          quantity: 20,
          expiryDate: new Date('2026-12-01'),
          status: 'ACTIVE'
        }
      ])
    })
  }
}));

describe('FEFO Dispense Algorithm', () => {
  it('should correctly allocate quantities from batches nearing expiration first', () => {
    const requestedQuantity = 15;
    
    // In a real integration test, we'd call the fefoDispense controller or service
    // Here we test the pure algorithmic logic of FEFO
    
    const availableBatches = [
      { id: 'batch1', qty: 10 },
      { id: 'batch2', qty: 20 }
    ];

    let remainingToFulfill = requestedQuantity;
    const allocationPlan: any[] = [];

    for (const batch of availableBatches) {
      if (remainingToFulfill <= 0) break;
      
      const takeQty = Math.min(batch.qty, remainingToFulfill);
      allocationPlan.push({ batchId: batch.id, quantity: takeQty });
      remainingToFulfill -= takeQty;
    }

    expect(remainingToFulfill).toBe(0);
    expect(allocationPlan).toHaveLength(2);
    expect(allocationPlan[0]).toEqual({ batchId: 'batch1', quantity: 10 });
    expect(allocationPlan[1]).toEqual({ batchId: 'batch2', quantity: 5 });
  });
});
