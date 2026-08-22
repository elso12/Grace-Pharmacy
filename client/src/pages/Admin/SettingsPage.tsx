import React, { useState } from 'react';
import {
  Settings, Building2, Globe, Bell, Palette, Server,
  Save, Loader2, CheckCircle, Sun, Moon
} from 'lucide-react';

/* ── Settings Page ──────────────────────────────────────────────────── */
const SettingsPage: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Pharmacy Profile */
  const [pharmacyName, setPharmacyName] = useState('Grace Pharmacy');
  const [pharmacyAddress, setPharmacyAddress] = useState('123 Health Blvd, Suite 200');
  const [pharmacyPhone, setPharmacyPhone] = useState('+1 (555) 123-4567');
  const [pharmacyEmail, setPharmacyEmail] = useState('admin@gracepharmacy.com');
  const [pharmacyLicense, setPharmacyLicense] = useState('PH-2024-00845');

  /* System Preferences */
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/New_York');
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [expiryAlertDays, setExpiryAlertDays] = useState('30');
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(true);

  /* Appearance */
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls =
    'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Settings className="text-blue-400" size={28} />
            System Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure pharmacy profile, system preferences, and appearance.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </header>

      {/* ── Pharmacy Profile ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Building2 size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pharmacy Profile</h2>
            <p className="text-xs text-slate-500">Business information displayed on receipts and documents.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Pharmacy Name</label>
            <input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>License Number</label>
            <input value={pharmacyLicense} onChange={(e) => setPharmacyLicense(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Business Address</label>
            <input value={pharmacyAddress} onChange={(e) => setPharmacyAddress(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={pharmacyPhone} onChange={(e) => setPharmacyPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={pharmacyEmail} onChange={(e) => setPharmacyEmail(e.target.value)} className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── System Preferences ───────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <Globe size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System Preferences</h2>
            <p className="text-xs text-slate-500">Regional and inventory alert settings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="KES">KES — Kenyan Shilling</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
              <option value="Africa/Nairobi">East Africa Time (EAT)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Low Stock Alert Threshold</label>
            <input
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className={inputCls}
              min="1"
            />
            <p className="text-[10px] text-slate-500 mt-1">Alert when product stock drops below this number.</p>
          </div>
          <div>
            <label className={labelCls}>Expiry Alert Days</label>
            <input
              type="number"
              value={expiryAlertDays}
              onChange={(e) => setExpiryAlertDays(e.target.value)}
              className={inputCls}
              min="1"
            />
            <p className="text-[10px] text-slate-500 mt-1">Alert when a batch expires within this many days.</p>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setAutoReorderEnabled(!autoReorderEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoReorderEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoReorderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">Auto Reorder Suggestions</p>
                <p className="text-[10px] text-slate-500">Generate reorder alerts when stock is low.</p>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* ── Notifications ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
            <p className="text-xs text-slate-500">Choose which alerts you want to receive.</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Low Stock Alerts', desc: 'Notify when a product drops below threshold' },
            { label: 'Expiring Batch Alerts', desc: 'Notify when batches are nearing expiry' },
            { label: 'New Order Notifications', desc: 'Notify when a customer places an order' },
            { label: 'Staff Activity Alerts', desc: 'Notify on staff login from new devices' },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/[0.04] cursor-pointer hover:bg-slate-800/80 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
            </label>
          ))}
        </div>
      </section>

      {/* ── Appearance ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-500/10">
            <Palette size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Appearance</h2>
            <p className="text-xs text-slate-500">Customize the look and feel.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-white/[0.08] bg-slate-800/30 hover:border-white/20'
            }`}
          >
            <Moon size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-slate-500'} />
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-400'}`}>Dark Mode</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-white/[0.08] bg-slate-800/30 hover:border-white/20'
            }`}
          >
            <Sun size={24} className={theme === 'light' ? 'text-amber-400' : 'text-slate-500'} />
            <span className={`text-sm font-semibold ${theme === 'light' ? 'text-white' : 'text-slate-400'}`}>Light Mode</span>
          </button>
        </div>
      </section>

      {/* ── System Info (Read-only) ──────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-slate-500/10">
            <Server size={20} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System Information</h2>
            <p className="text-xs text-slate-500">Read-only system diagnostics.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Server Version', value: 'v1.0.0' },
            { label: 'Node.js', value: 'v18.x LTS' },
            { label: 'Database', value: 'MongoDB 7.x' },
            { label: 'Environment', value: 'Production' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-white/[0.04]">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{item.label}</p>
              <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
