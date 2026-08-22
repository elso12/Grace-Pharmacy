import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Plus, Search, Edit3, Trash2, X, Loader2,
  Phone, Mail, MapPin, CheckCircle, XCircle
} from 'lucide-react';
import api from '../../services/api';

/* ── Types ────────────────────────────────────────────────────────────── */
interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  licenseNumber?: string;
  paymentTerms?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

const EMPTY_FORM = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  licenseNumber: '',
  paymentTerms: 'Net 30',
  notes: '',
};

/* ── Component ────────────────────────────────────────────────────────── */
const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* Delete state */
  const [deleting, setDeleting] = useState<string | null>(null);

  /* ── Fetch ────────────────────────────────────────────────────────── */
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const { data } = await api.get('/suppliers', { params });
      setSuppliers(data.data.suppliers);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  /* ── Modal helpers ────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone,
      street: s.address?.street || '',
      city: s.address?.city || '',
      state: s.address?.state || '',
      zipCode: s.address?.zipCode || '',
      country: s.address?.country || '',
      licenseNumber: s.licenseNumber || '',
      paymentTerms: s.paymentTerms || 'Net 30',
      notes: s.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        contactPerson: form.contactPerson || undefined,
        email: form.email || undefined,
        phone: form.phone,
        address: {
          street: form.street || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zipCode: form.zipCode || undefined,
          country: form.country || undefined,
        },
        licenseNumber: form.licenseNumber || undefined,
        paymentTerms: form.paymentTerms || undefined,
        notes: form.notes || undefined,
      };

      if (editing) {
        await api.put(`/suppliers/${editing._id}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to save supplier', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    setDeleting(id);
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to delete supplier', err);
    } finally {
      setDeleting(null);
    }
  };

  /* ── Field helper ─────────────────────────────────────────────────── */
  const inputCls =
    'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Truck className="text-blue-400" size={28} />
            Supplier Management
          </h1>
          <p className="text-slate-400 mt-1">Manage pharmaceutical distributors and suppliers.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
        >
          <Plus size={16} /> Add Supplier
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full bg-slate-900/60 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors backdrop-blur"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-4 font-medium">Supplier</th>
              <th className="px-5 py-4 font-medium">Contact</th>
              <th className="px-5 py-4 font-medium">License</th>
              <th className="px-5 py-4 font-medium">Terms</th>
              <th className="px-5 py-4 font-medium text-center">Status</th>
              <th className="px-5 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">{s.name}</p>
                    {s.address?.city && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {s.address.city}{s.address.state ? `, ${s.address.state}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {s.contactPerson && <p className="text-white text-sm">{s.contactPerson}</p>}
                    {s.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={11} /> {s.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {s.phone}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">
                    {s.licenseNumber || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {s.paymentTerms || '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        s.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {s.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        disabled={deleting === s._id}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleSave}
              className="w-full max-w-lg bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-bold text-white">
                  {editing ? 'Edit Supplier' : 'New Supplier'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Name & Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Company Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Acme Pharma" />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Person</label>
                    <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className={inputCls} placeholder="John Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="orders@acme.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone *</label>
                    <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+1 555 000 0000" />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelCls}>Street Address</label>
                  <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className={inputCls} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} placeholder="New York" />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputCls} placeholder="NY" />
                  </div>
                  <div>
                    <label className={labelCls}>Zip</label>
                    <input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className={inputCls} placeholder="10001" />
                  </div>
                </div>

                {/* Business details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>License Number</label>
                    <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className={inputCls} placeholder="LIC-12345" />
                  </div>
                  <div>
                    <label className={labelCls}>Payment Terms</label>
                    <select
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      className={inputCls}
                    >
                      <option value="Net 30">Net 30</option>
                      <option value="Net 60">Net 60</option>
                      <option value="Net 90">Net 90</option>
                      <option value="COD">COD</option>
                      <option value="Prepaid">Prepaid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls + ' resize-none'} placeholder="Internal notes…" />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default SuppliersPage;
