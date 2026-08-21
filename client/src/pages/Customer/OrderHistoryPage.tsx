import React, { useState, useEffect } from 'react';
import { Package, Receipt, ChevronRight, Clock, CheckCircle2, Truck, Loader2 } from 'lucide-react';
import { getUserOrders, type OrderResponse } from '../../services/orderApi';

const getStatusConfig = (status: OrderResponse['status']) => {
  switch (status) {
    case 'PROCESSING':
      return { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock };
    case 'PACKED':
      return { label: 'Packed', color: 'bg-purple-100 text-purple-700', icon: Package };
    case 'READY_FOR_PICKUP':
      return { label: 'Ready for Pickup', color: 'bg-indigo-100 text-indigo-700', icon: Package };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', color: 'bg-blue-100 text-blue-700', icon: Truck };
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700', icon: Package };
  }
};

const ORDER_STEPS = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'PACKED', label: 'Packed' },
  { status: 'READY_FOR_PICKUP', label: 'Ready' }, // Or OUT_FOR_DELIVERY depending on type
  { status: 'COMPLETED', label: 'Completed' },
];

const getStepIndex = (status: string) => {
  const index = ORDER_STEPS.findIndex(s => s.status === status);
  if (status === 'OUT_FOR_DELIVERY') return 3; // Treat same as ready for index
  return index >= 0 ? index : 0;
};

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserOrders();
        setOrders(data);
      } catch (err) {
        console.error('[OrderHistoryPage] Failed to fetch orders:', err);
        setError('Could not load your orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
        <p className="text-slate-500 mt-2">View and track your recent pharmacy orders.</p>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
            <p>Loading your orders...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 text-center">
            {error}
          </div>
        )}

        {!loading && !error && orders.map((order) => {
          const status = getStatusConfig(order.status as any) || { label: order.status, color: 'bg-slate-100 text-slate-700', icon: Package };
          
          return (
            <div key={order._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                {/* ── Order Info ─────────────────────────────────────────── */}
                <div className="flex-1 space-y-4 sm:space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-900">{order.orderNumber}</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      <status.icon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Visual Stepper */}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                    <div className="mt-6 mb-4 w-full">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500 ease-in-out" 
                            style={{ width: `${(getStepIndex(order.status) / (ORDER_STEPS.length - 1)) * 100}%` }}
                          />
                        </div>
                        {ORDER_STEPS.map((step, idx) => {
                          const currentIdx = getStepIndex(order.status);
                          const isCompleted = idx <= currentIdx;
                          const isActive = idx === currentIdx;
                          
                          return (
                            <div key={step.status} className="relative z-10 flex flex-col items-center">
                              <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors ${
                                isCompleted ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 border-2 border-white'
                              } ${isActive ? 'ring-4 ring-blue-100' : ''}`}>
                                {isCompleted && <CheckCircle2 className="w-2.5 h-2.5 sm:w-4 sm:h-4" />}
                              </div>
                              <span className={`absolute top-full mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap ${
                                isActive ? 'text-blue-700' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-2 mt-4">
                    <p>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <p>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <p className="font-medium text-slate-900">Total: ${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* ── Actions ────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Receipt className="h-4 w-4" />
                    View Receipt
                  </button>
                  <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                    Details
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No orders yet</h3>
            <p className="text-slate-500 mt-1">When you place an order, it will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
