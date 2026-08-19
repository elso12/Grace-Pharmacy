import api from './api';

export interface OrderItemPayload {
  product: string; // Product ID
  quantity: number;
}

export interface OrderResponse {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
}

export const createOrder = async (
  items: OrderItemPayload[],
  orderType: 'ONLINE' | 'POS' = 'ONLINE'
): Promise<OrderResponse> => {
  const { data } = await api.post('/orders', { items, orderType });
  return data.data; // Assuming backend returns { status: 'success', data: { ... } }
};

export const getUserOrders = async (): Promise<OrderResponse[]> => {
  const { data } = await api.get('/orders/myorders');
  return data.data;
};
