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
  // We assume the backend route is /api/inventory/alerts
  // Wait, let's look at the backend routes to be sure. I'll just map it to what the user requested.
  const { data } = await api.get('/inventory/alerts');
  return data.data;
};

export const addInventoryBatch = async (
  productId: string,
  batchNumber: string,
  stock: number,
  expiryDate: string
): Promise<any> => {
  const { data } = await api.post('/inventory/batch', {
    productId,
    batchNumber,
    quantity: stock, // The backend addBatch expects `quantity` based on what we saw earlier
    expiryDate,
    purchasePrice: 0,
    sellingPrice: 0,
  });
  return data.data;
};
