import React, { useEffect, useState } from 'react';
import { Package, MapPin, CheckSquare, Clock } from 'lucide-react';
import api from '../../services/api';

interface ShelfLocation {
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
}

interface PickItem {
  medicationId: {
    _id: string;
    name: string;
    genericName: string;
    sku: string;
    shelfLocation?: ShelfLocation;
  };
  quantity: number;
}

interface Order {
  _id: string;
  customerId: { firstName: string; lastName: string; email: string };
  status: string;
  createdAt: string;
  items: PickItem[];
}

const PickListQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/ready-to-pack');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching ready-to-pack orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const formatLocation = (loc?: ShelfLocation) => {
    if (!loc || (!loc.aisle && !loc.rack && !loc.shelf && !loc.bin)) return 'Not assigned';
    return `Aisle ${loc.aisle || '-'} / Rack ${loc.rack || '-'} / Shelf ${loc.shelf || '-'} / Bin ${loc.bin || '-'}`;
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Pick List Queue</h1>
        <p className="mt-1 text-sm text-slate-400">View orders ready to be picked and packed.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-900/60 rounded-2xl border border-white/[0.06] backdrop-blur">
            <Package size={48} className="mx-auto mb-4 text-emerald-500/50" />
            <p>No orders currently waiting to be picked.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-slate-900/60 rounded-2xl border border-white/[0.06] backdrop-blur p-6 transition-all hover:border-white/10">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                        {order.status}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Customer: {order.customerId?.firstName} {order.customerId?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <Clock size={14} className="text-emerald-500" />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-white/5">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/80 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium">SKU</th>
                        <th className="px-4 py-3 font-medium text-center">Qty to Pick</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{item.medicationId?.name}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.medicationId?.sku}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-emerald-500/20 text-emerald-400 font-bold rounded-lg">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={14} className="text-slate-500" />
                              {formatLocation(item.medicationId?.shelfLocation)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleUpdateStatus(order._id, 'PACKED')}
                    disabled={updating === order._id}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckSquare size={18} />
                    {updating === order._id ? 'Updating...' : 'Mark as Packed'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(order._id, 'READY_FOR_PICKUP')}
                    disabled={updating === order._id}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Package size={18} />
                    Ready for Pickup
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickListQueue;
