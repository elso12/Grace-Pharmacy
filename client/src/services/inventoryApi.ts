import api from './api';

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  batchNumber: string;
  stockLevel: number;
  expiryDate: string;
  daysUntilExpiry: number;
}

export const getInventoryAlerts = async (): Promise<InventoryAlert[]> => {
  const { data } = await api.get('/inventory/alerts/expiry?days=365');
  
  const allBatches = [...(data.data.alreadyExpired || []), ...(data.data.expiringSoon || [])];

  // Map backend ExpiryAlertBatchItem to InventoryAlert
  return allBatches.map((batch: any) => ({
    id: batch._id,
    productId: batch.product._id,
    productName: batch.product.name,
    batchNumber: batch.batchNumber,
    stockLevel: batch.quantity,
    expiryDate: batch.expiryDate,
    daysUntilExpiry: batch.daysUntilExpiry,
  }));
};

export const addInventoryBatch = async (
  productId: string,
  batchNumber: string,
  stock: number,
  expiryDate: string
): Promise<any> => {
  const { data } = await api.post('/inventory/batches', {
    productId,
    batchNumber,
    quantity: stock, 
    expiryDate,
    purchasePrice: 0,
    sellingPrice: 0,
  });
  return data.data;
};

export const quarantineBatch = async (batchId: string): Promise<any> => {
  const { data } = await api.patch(`/inventory/batches/${batchId}/quarantine`);
  return data.data;
};
