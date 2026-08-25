import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, DollarSign, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InsuranceClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [adjudicateForm, setAdjudicateForm] = useState({
    status: 'APPROVED_PAID',
    approvedAmount: '',
    remittanceCode: '',
    rejectionReason: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [claimsRes, summaryRes] = await Promise.all([
        api.get('/insurance/claims'),
        api.get('/insurance/summary')
      ]);
      setClaims(claimsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch insurance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdjudicateModal = (claim: any) => {
    setSelectedClaim(claim);
    setAdjudicateForm({
      status: 'APPROVED_PAID',
      approvedAmount: claim.insuranceCoveredAmount,
      remittanceCode: '',
      rejectionReason: ''
    });
    setShowModal(true);
  };

  const handleAdjudicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    
    try {
      await api.patch(`/insurance/claims/${selectedClaim._id}/adjudicate`, {
        ...adjudicateForm,
        approvedAmount: parseFloat(adjudicateForm.approvedAmount)
      });
      toast.success('Claim adjudicated successfully');
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to adjudicate claim');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-slate-700 text-slate-300';
      case 'PENDING_ADJUDICATION': return 'bg-amber-500/20 text-amber-400';
      case 'APPROVED_PAID': return 'bg-emerald-500/20 text-emerald-400';
      case 'PARTIALLY_PAID': return 'bg-indigo-500/20 text-indigo-400';
      case 'REJECTED': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-indigo-500" />
            Insurance Claim Reconciliation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage PBM claims, adjudications, and track outstanding receivables.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Pending Receivables</p>
                <p className="text-2xl font-bold text-white">${summary.totalPendingReceivables.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Reimbursed</p>
                <p className="text-2xl font-bold text-white">${summary.totalPaidClaims.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">Claim Rejection Rate</p>
                <p className="text-2xl font-bold text-white">{summary.rejectionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl shadow-lg border border-white/[0.06] backdrop-blur overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <FileText className="text-slate-400" size={18} />
              <h2 className="text-lg font-bold text-white">Active Claims Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-medium">Claim #</th>
                    <th className="px-6 py-3 font-medium">Patient</th>
                    <th className="px-6 py-3 font-medium">Provider / Policy</th>
                    <th className="px-6 py-3 font-medium text-right">Billed</th>
                    <th className="px-6 py-3 font-medium text-right">Insurer Portion</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No claims found.
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim: any) => (
                      <tr key={claim._id} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 font-mono text-xs text-white">{claim.claimNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-300">{claim.patientName}</td>
                        <td className="px-6 py-4">
                          <div className="text-white">{claim.insuranceProvider}</div>
                          <div className="text-xs text-slate-500 font-mono">{claim.policyNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">${claim.totalBilledAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-medium text-indigo-400">${claim.insuranceCoveredAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md ${getStatusColor(claim.status)}`}>
                            {claim.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(claim.status === 'SUBMITTED' || claim.status === 'PENDING_ADJUDICATION') && (
                            <button 
                              onClick={() => openAdjudicateModal(claim)}
                              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              Adjudicate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Adjudication Modal */}
      {showModal && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-bold text-white">Process Remittance</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>
            
            <form onSubmit={handleAdjudicate} className="p-6 space-y-4">
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 mb-2 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Claim #:</span>
                  <span className="text-white font-mono">{selectedClaim.claimNumber}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Provider:</span>
                  <span className="text-white">{selectedClaim.insuranceProvider}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-400">Expected Insurer Portion:</span>
                  <span className="text-indigo-400">${selectedClaim.insuranceCoveredAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Adjudication Result</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setAdjudicateForm({...adjudicateForm, status: 'APPROVED_PAID'})}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold border transition ${adjudicateForm.status === 'APPROVED_PAID' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Paid
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAdjudicateForm({...adjudicateForm, status: 'REJECTED'})}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold border transition ${adjudicateForm.status === 'REJECTED' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Rejected
                  </button>
                </div>
              </div>

              {adjudicateForm.status === 'APPROVED_PAID' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Actual Paid Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      value={adjudicateForm.approvedAmount}
                      onChange={(e) => setAdjudicateForm({...adjudicateForm, approvedAmount: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Remittance Code (ERA)</label>
                    <input 
                      type="text" 
                      required
                      value={adjudicateForm.remittanceCode}
                      onChange={(e) => setAdjudicateForm({...adjudicateForm, remittanceCode: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. ERA-835-12345"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Rejection Reason</label>
                  <textarea 
                    required
                    value={adjudicateForm.rejectionReason}
                    onChange={(e) => setAdjudicateForm({...adjudicateForm, rejectionReason: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 h-24"
                    placeholder="e.g. Prior authorization required, patient ineligible..."
                  ></textarea>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg transition"
                >
                  Submit Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaimsPage;
