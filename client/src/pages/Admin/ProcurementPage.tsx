import React, { useState, useEffect } from 'react';
import { Truck, FileText, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProcurementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'rma'>('pos');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPOs = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/procurement/purchase-orders');
      setPurchaseOrders(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch Purchase Orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pos') {
      fetchPOs();
    }
  }, [activeTab]);

  const autoGeneratePOs = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/procurement/purchase-orders/auto-generate');
      toast.success(data.message);
      fetchPOs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate POs');
      setIsLoading(false);
    }
  };

  const receiveShipment = async (poId: string) => {
    // In a real app, this would open a modal to enter batch details.
    // For this prototype, we will prompt or mock the batch details.
    const batchNumber = prompt("Enter received Batch Number:", `RCV-${Date.now().toString().slice(-4)}`);
    const quantityReceived = prompt("Enter quantity received:");
    const expiryDate = prompt("Enter expiry date (YYYY-MM-DD):", "2027-01-01");

    if (batchNumber && quantityReceived && expiryDate) {
      try {
        await api.post(`/procurement/purchase-orders/${poId}/receive`, {
          batchNumber,
          quantityReceived: parseInt(quantityReceived, 10),
          expiryDate
        });
        toast.success("Shipment received and injected into inventory!");
        fetchPOs();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to receive shipment');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-700 text-slate-300';
      case 'ORDERED': return 'bg-blue-500/20 text-blue-400';
      case 'RECEIVED_PARTIAL': return 'bg-amber-500/20 text-amber-400';
      case 'RECEIVED_FULL': return 'bg-emerald-500/20 text-emerald-400';
      case 'CANCELLED': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-indigo-500" />
            Procurement & Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage purchase orders, receive shipments, and process vendor returns.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={autoGeneratePOs}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm text-sm font-medium text-white transition"
          >
            <Clock className="w-4 h-4 mr-2" />
            Auto-Generate POs from Low Stock
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-xl shadow-lg border border-white/[0.06] p-6 backdrop-blur">
        <div className="flex space-x-4 border-b border-white/[0.06] pb-4 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg flex items-center gap-2 transition ${activeTab === 'pos' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('pos')}
          >
            <FileText className="w-4 h-4" />
            Purchase Orders
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg flex items-center gap-2 transition ${activeTab === 'rma' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('rma')}
          >
            <AlertCircle className="w-4 h-4" />
            Vendor Returns (RMA)
          </button>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">PO Number</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium">Total Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No Purchase Orders found.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po: any) => (
                        <tr key={po._id} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 font-mono text-white">{po.poNumber}</td>
                          <td className="px-4 py-3 text-slate-300">{po.supplierName}</td>
                          <td className="px-4 py-3 text-emerald-400 font-medium">${po.totalAmount?.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${getStatusColor(po.status)}`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            {po.status !== 'RECEIVED_FULL' && po.status !== 'CANCELLED' && (
                              <button 
                                onClick={() => receiveShipment(po._id)}
                                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
                              >
                                Receive Shipment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'rma' && (
              <div className="py-10 text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Vendor Returns Module</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Use this section to process Return Merchandise Authorizations (RMAs) for expired or damaged inventory batches.
                </p>
                {/* Form to create RMA would go here */}
                <button className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition">
                  Create New RMA
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProcurementPage;
