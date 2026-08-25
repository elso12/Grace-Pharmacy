import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, ShieldAlert, Pill, ArrowRight, CheckCircle2 } from 'lucide-react';

const PharmacistDashboard: React.FC = () => {
  // Mock metrics for the clinical overview
  const metrics = {
    pendingRx: 12,
    safetyAlerts: 3,
    expiringBatches: 8
  };

  const recentApprovals = [
    { id: 'RX-10029', patient: 'John Doe', medication: 'Amoxicillin 500mg', time: '10:45 AM' },
    { id: 'RX-10028', patient: 'Sarah Connor', medication: 'Lisinopril 10mg', time: '10:15 AM' },
    { id: 'RX-10027', patient: 'Bruce Wayne', medication: 'Atorvastatin 20mg', time: '09:30 AM' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Clinical Overview</h1>
        <p className="text-sm font-medium text-emerald-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Pending Prescriptions Card */}
        <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <FileCheck size={24} />
            </div>
            <span className="text-3xl font-bold text-white">{metrics.pendingRx}</span>
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-200">Pending Prescriptions</h3>
          <p className="mb-6 text-xs text-slate-400">Orders needing medical review</p>
          <Link
            to="/pharmacist/prescriptions"
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/20 py-2.5 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-600/30"
          >
            Open Rx Queue <ArrowRight size={16} />
          </Link>
        </div>

        {/* Safety Alerts Card */}
        <div className="flex flex-col rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/50" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <ShieldAlert size={24} />
            </div>
            <span className="text-3xl font-bold text-rose-400">{metrics.safetyAlerts}</span>
          </div>
          <h3 className="mb-1 text-base font-bold text-rose-200">Safety Alerts</h3>
          <p className="mb-6 text-xs text-rose-400/70">Flagged drug interactions</p>
          <button
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600/20 py-2.5 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-600/30"
          >
            Review Alerts <ArrowRight size={16} />
          </button>
        </div>

        {/* Expiring Batches Card */}
        <div className="flex flex-col rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
              <Pill size={24} />
            </div>
            <span className="text-3xl font-bold text-white">{metrics.expiringBatches}</span>
          </div>
          <h3 className="mb-1 text-base font-bold text-slate-200">Expiring Medication Batches</h3>
          <p className="mb-6 text-xs text-slate-400">Active batches expiring &lt; 60 days</p>
          <Link
            to="/pharmacist/batches"
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600/20 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-600/30"
          >
            Review Batches <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Recent Approvals Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-6 backdrop-blur-xl">
        <h3 className="mb-6 text-lg font-bold text-slate-200">Today's Recent Approvals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="rounded-tl-lg px-4 py-3 font-semibold">Prescription ID</th>
                <th className="px-4 py-3 font-semibold">Patient Name</th>
                <th className="px-4 py-3 font-semibold">Medication</th>
                <th className="px-4 py-3 font-semibold">Approval Time</th>
                <th className="rounded-tr-lg px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {recentApprovals.map((rx) => (
                <tr key={rx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4 font-mono font-medium text-emerald-400">{rx.id}</td>
                  <td className="px-4 py-4">{rx.patient}</td>
                  <td className="px-4 py-4">{rx.medication}</td>
                  <td className="px-4 py-4 text-slate-500">{rx.time}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
