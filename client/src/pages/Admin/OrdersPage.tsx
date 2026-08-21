import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Loader2, CheckCircle2, Clock, Truck, Package, RotateCcw } from 'lucide-react';
import api from '../../services/api';

interface OrderItem {
  medicationId: {
    _id: string;
    name: string;
    genericName: string;
    sku: string;
  };
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  _id: string;
  customerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  fulfillmentType: string;
  createdAt: string;
  prescriptionRequired: boolean;
  approvedByPharmacist: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {status}</span>;
    case 'PENDING':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1"><Clock className="w-3 h-3"/> {status}</span>;
    case 'PROCESSING':
    case 'PACKED':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1"><Package className="w-3 h-3"/> {status}</span>;
    case 'OUT_FOR_DELIVERY':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1"><Truck className="w-3 h-3"/> {status}</span>;
    case 'CANCELLED':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> {status}</span>;
    default:
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
  }
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/orders');
      setOrders(data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-blue-500" />
            Orders Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Oversee customer orders and update fulfillment statuses.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Order ID or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400">{error}</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/50 text-slate-500 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{o._id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">
                          {o.customerId ? `${o.customerId.firstName} ${o.customerId.lastName}` : 'Guest'}
                        </div>
                        <div className="text-xs text-slate-500">{o.customerId?.email}</div>
                      </td>
                      <td className="px-6 py-4">{o.fulfillmentType}</td>
                      <td className="px-6 py-4 font-bold text-white">${o.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                      <td className="px-6 py-4">
                        <select
                          className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500 [color-scheme:dark]"
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="PACKED">Packed</option>
                          <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
