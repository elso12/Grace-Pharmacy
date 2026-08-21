import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, ShieldAlert, CheckCircle2, XCircle, Key } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  lastLoginAt?: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'PHARMACIST',
    phone: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = '/users?';
      if (filterRole) query += `role=${filterRole}&`;
      if (filterStatus) query += `status=${filterStatus}&`;

      const { data } = await api.get(query);
      setUsers(data.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Could not load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterStatus]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentUser?.id) {
      alert("You cannot disable your own account.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this user?`)) return;

    try {
      await api.patch(`/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update user status.');
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    if (id === currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }
    try {
      await api.put(`/users/${id}`, { role: newRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Failed to change role:', err);
      alert('Failed to update user role.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      setIsSubmitting(true);
      await api.post(`/users/${selectedUserId}/reset-password`, { password: newPassword });
      setResetModalOpen(false);
      setNewPassword('');
      alert('Password reset successfully!');
    } catch (err: any) {
      console.error('Failed to reset password', err);
      alert(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/users', newUser);
      setAddUserModalOpen(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'PHARMACIST', phone: '' });
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to add user', err);
      alert(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="h-6 w-6 text-blue-500" />
            Staff Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage pharmacy staff roles, access, and statuses.
          </p>
        </div>
        <button 
          onClick={() => setAddUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:border-blue-500 [color-scheme:dark]"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="CASHIER">Cashier</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:border-blue-500 [color-scheme:dark]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto pb-32">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ShieldAlert className="h-8 w-8 animate-pulse text-blue-500" />
                <p className="text-sm font-medium">Loading staff data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400">{error}</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/50 text-slate-500 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Staff Member</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${
                          u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          u.role === 'PHARMACIST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {u.isActive ? (
                            <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500 font-medium text-xs">Active</span></>
                          ) : (
                            <><XCircle className="h-4 w-4 text-rose-500" /> <span className="text-rose-500 font-medium text-xs">Disabled</span></>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative group">
                          <button
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setResetModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                            title="Reset Password"
                          >
                            <Key size={16} />
                          </button>
                          
                          <select 
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                            disabled={u.id === currentUser?.id}
                            className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="PHARMACIST">Pharmacist</option>
                            <option value="TECHNICIAN">Technician</option>
                            <option value="CASHIER">Cashier</option>
                          </select>

                          <button
                            onClick={() => toggleStatus(u.id, u.isActive)}
                            disabled={u.id === currentUser?.id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                              u.isActive ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Staff Modal ──────────────────────────────────────────────── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus className="text-blue-500" /> Add New Staff Member
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">First Name *</label>
                  <input required type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Last Name *</label>
                  <input required type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address *</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Temporary Password *</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" minLength={6} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Role *</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 [color-scheme:dark]">
                  <option value="ADMIN">Administrator</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="TECHNICIAN">Pharmacy Technician</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => setAddUserModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ─────────────────────────────────────────── */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Key className="text-blue-500" /> Reset Password
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter a new temporary password for this user.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">New Password *</label>
                <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500" minLength={6} placeholder="e.g. TempPass123!" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => { setResetModalOpen(false); setNewPassword(''); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || newPassword.length < 6} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
                  {isSubmitting ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
