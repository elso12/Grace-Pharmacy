import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Pill, Package, Activity, Clock, FileText, Heart, Calendar, Phone } from 'lucide-react';
import FileDropzone from '../../components/FileDropzone';
import api from '../../services/api';

const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rxRes, ordRes] = await Promise.all([
          api.get('/api/prescriptions/my-prescriptions'),
          api.get('/api/orders/customer')
        ]);
        setPrescriptions(rxRes.data.data);
        setOrders(ordRes.data.data);
      } catch (err) {
        console.error("Error fetching patient portal data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRefill = async (id: string) => {
    try {
      await api.post(`/api/prescriptions/${id}/refill`);
      alert("Refill requested successfully. An order has been placed.");
      // Refresh data
      const [rxRes, ordRes] = await Promise.all([
        api.get('/api/prescriptions/my-prescriptions'),
        api.get('/api/orders/customer')
      ]);
      setPrescriptions(rxRes.data.data);
      setOrders(ordRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request refill.");
    }
  };

  const handlePrescriptionUpload = async (_file: File) => {
    try {
      // We would upload to S3 here, but for this demo we'll just mock an image URL
      const mockedUrl = "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600";
      await api.post('/api/prescriptions/upload', {
        prescriptionImageUrl: mockedUrl
      });
      alert("Prescription uploaded successfully. A pharmacist will review it shortly.");
      const rxRes = await api.get('/api/prescriptions/my-prescriptions');
      setPrescriptions(rxRes.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to upload prescription.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Welcome Banner ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
          <p className="text-blue-100 max-w-2xl text-lg">
            Manage your prescriptions, track orders, and securely connect with our pharmacists—all in one place.
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-200" />
            <div>
              <p className="text-sm text-blue-100 font-semibold uppercase tracking-wider">Health Profile</p>
              <p className="font-bold text-xl">Verified Patient</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Activity ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Prescriptions */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600">
                  <Pill className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">My Prescriptions</h2>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">No active prescriptions</h3>
                <p className="text-slate-500">Upload a new prescription to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.slice(0, 3).map((rx) => (
                  <div key={rx._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-slate-500">
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Prescription #{rx._id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm text-slate-500">Status: <span className="font-medium text-purple-600 capitalize">{rx.status.replace('_', ' ')}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRefill(rx._id)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      Request Refill
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Recent Orders</h2>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Package className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">No recent orders</h3>
                <p className="text-slate-500">Visit the storefront to shop for health essentials.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()} • ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      {order.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Right Column: Actions ─────────────────────────────────── */}
        <div className="space-y-8">
          
          {/* Upload Prescription */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Prescription</h2>
            <p className="text-sm text-slate-500 mb-6">Drop your doctor's script here for pharmacist verification.</p>
            <FileDropzone onFileSelect={handlePrescriptionUpload} />
          </div>

          {/* Pharmacist Consult */}
          <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Phone className="h-48 w-48 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl inline-flex mb-4">
                <Activity className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-emerald-900 mb-2">Pharmacist Consult</h2>
              <p className="text-sm text-emerald-700 mb-6">
                Have questions about side effects, interactions, or dosages? Chat live with a clinical pharmacist.
              </p>
              <button 
                className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all active:scale-95"
                onClick={() => {
                  const chatBtn = document.querySelector('[aria-label="Open Live Chat"]') as HTMLButtonElement;
                  if (chatBtn) chatBtn.click();
                  else alert('Live chat widget is currently offline.');
                }}
              >
                Start Live Chat
              </button>
            </div>
          </div>

          {/* Quick Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Health Profile Summary</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <span><strong className="text-slate-800">DOB:</strong> Jan 15, 1985</span>
              </li>
              <li className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-rose-400" />
                <span><strong className="text-slate-800">Allergies:</strong> Penicillin</span>
              </li>
              <li className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <span><strong className="text-slate-800">Insurance:</strong> BlueCross BlueShield</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
