import React, { useState } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Lock
} from 'lucide-react';

const ShiftClosePage: React.FC = () => {
  const [cashActual, setCashActual] = useState<number>(0);
  const [cardActual, setCardActual] = useState<number>(0);
  const [mobileActual, setMobileActual] = useState<number>(0);

  const [submitted, setSubmitted] = useState<boolean>(false);

  // Mock expected amounts for demonstration
  const expectedCash = 1240.50;
  const expectedCard = 3450.00;
  const expectedMobile = 420.00;

  const cashVariance = cashActual - expectedCash;
  const cardVariance = cardActual - expectedCard;
  const mobileVariance = mobileActual - expectedMobile;

  const totalVariance = cashVariance + cardVariance + mobileVariance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white">Shift Closed Successfully</h1>
        <p className="text-slate-400">The reconciliation report has been saved and sent to the Admin.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-lg bg-slate-800 px-6 py-2 font-bold text-white transition hover:bg-slate-700"
        >
          View Receipt
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full max-w-4xl mx-auto">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Shift Reconciliation
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your actual drawer counts to close your shift.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Expected Totals (System) ── */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">
            System Expected
          </h2>
          
          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                <DollarSign size={20} />
              </div>
              <span className="font-bold text-slate-300">Cash Sales</span>
            </div>
            <span className="font-mono text-lg text-white">${expectedCash.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                <CreditCard size={20} />
              </div>
              <span className="font-bold text-slate-300">Card Sales</span>
            </div>
            <span className="font-mono text-lg text-white">${expectedCard.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400">
                <Smartphone size={20} />
              </div>
              <span className="font-bold text-slate-300">Mobile Wallet</span>
            </div>
            <span className="font-mono text-lg text-white">${expectedMobile.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Actual Input Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-slate-900/60 p-6 backdrop-blur">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
            <span>Actual Count</span>
            <Calculator size={16} className="text-slate-500" />
          </h2>

          <div className="flex items-center gap-4">
            <label className="w-32 font-bold text-slate-400">Cash Drawer</label>
            <div className="relative flex-1">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                step="0.01"
                required
                value={cashActual || ''}
                onChange={(e) => setCashActual(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className={`w-20 text-right font-mono text-sm font-bold \${cashVariance === 0 ? 'text-emerald-400' : cashVariance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {cashVariance > 0 ? '+' : ''}{cashVariance.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 font-bold text-slate-400">Card Receipts</label>
            <div className="relative flex-1">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                step="0.01"
                required
                value={cardActual || ''}
                onChange={(e) => setCardActual(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className={`w-20 text-right font-mono text-sm font-bold \${cardVariance === 0 ? 'text-emerald-400' : cardVariance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {cardVariance > 0 ? '+' : ''}{cardVariance.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 font-bold text-slate-400">Mobile Settled</label>
            <div className="relative flex-1">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number"
                step="0.01"
                required
                value={mobileActual || ''}
                onChange={(e) => setMobileActual(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className={`w-20 text-right font-mono text-sm font-bold \${mobileVariance === 0 ? 'text-emerald-400' : mobileVariance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {mobileVariance > 0 ? '+' : ''}{mobileVariance.toFixed(2)}
            </div>
          </div>
          
          <hr className="my-2 border-slate-800" />
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">Total Variance</span>
            <span className={`text-xl font-black \${totalVariance === 0 ? 'text-emerald-400' : totalVariance > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {totalVariance > 0 ? '+' : ''}{totalVariance.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Lock size={18} />
            Close Shift & Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShiftClosePage;
