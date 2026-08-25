import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Phone, User, Activity } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BranchManagementPage: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    type: 'RETAIL',
    address: '',
    phone: '',
  });

  const fetchBranches = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/branches', { withCredentials: true });
      setBranches(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/branches', newBranch, { withCredentials: true });
      toast.success('Branch created successfully');
      setShowModal(false);
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create branch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Branch Directory</h1>
          <p className="text-sm text-slate-400">Manage pharmacy locations and satellite clinics</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus size={16} /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-white">Loading branches...</p>
        ) : (
          branches.map((branch) => (
            <div key={branch._id} className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{branch.name}</h3>
                  <p className="text-xs text-blue-400 font-mono mt-1">{branch.code}</p>
                </div>
                <span className="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                  {branch.type}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={14} />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone size={14} />
                  <span>{branch.phone}</span>
                </div>
                {branch.managerId && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <User size={14} />
                    <span>Manager: {branch.managerId.firstName} {branch.managerId.lastName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Activity size={14} />
                  <span className={branch.isActive ? 'text-green-400' : 'text-red-400'}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 border border-white/[0.1]">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Branch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Name</label>
                <input
                  required
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                  className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Code</label>
                <input
                  required
                  type="text"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({...newBranch, code: e.target.value})}
                  className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Address</label>
                <input
                  required
                  type="text"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                  className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Phone</label>
                <input
                  required
                  type="text"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                  className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Type</label>
                <select
                  value={newBranch.type}
                  onChange={(e) => setNewBranch({...newBranch, type: e.target.value})}
                  className="mt-1 block w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2"
                >
                  <option value="RETAIL">Retail</option>
                  <option value="HEADQUARTERS">Headquarters</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="SATELLITE_CLINIC">Satellite Clinic</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagementPage;
