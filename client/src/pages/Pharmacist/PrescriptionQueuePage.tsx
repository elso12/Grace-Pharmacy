import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, X, CheckSquare, ShieldAlert, FileText, Search, Activity, SearchX } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Prescription {
  _id: string;
  prescriptionNumber: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  doctor: {
    name: string;
    licenseNumber?: string;
  };
  medications: Array<{
    product: { _id: string; name: string };
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }>;
  status: string;
  prescriptionDate: string;
  documentUrl?: string;
}

interface SafetyResult {
  isSafe: boolean;
  summary: { totalWarnings: number; highSeverity: number; mediumSeverity: number };
  drugInteractions: Array<{ severity: string; description: string }>;
  allergyConflicts: Array<{ severity: string; description: string; medication: string }>;
}

const PrescriptionQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  
  const [safetyCheckLoading, setSafetyCheckLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyResult | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/prescriptions');
      setQueue(data.data || []);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = async (rx: Prescription) => {
    setSelectedRx(rx);
    setSafetyResult(null);
    setClinicalNotes('');
    setRejectionReason('');
    setIsRejecting(false);
    
    // Auto-run safety check
    setSafetyCheckLoading(true);
    try {
      const payload = {
        patientId: rx.patient._id,
        medications: rx.medications.map(m => ({ name: m.product.name }))
      };
      const { data } = await api.post('/prescriptions/safety-check', payload);
      setSafetyResult(data.data);
      if (data.data.isSafe) {
        toast.success('Safety check passed: No conflicts detected.');
      } else {
        toast.error('Safety check failed: Conflicts detected.');
      }
    } catch (err) {
      console.error('Safety check failed', err);
      toast.error('Failed to run automated safety check.');
    } finally {
      setSafetyCheckLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRx) return;
    try {
      await api.post(`/prescriptions/${selectedRx._id}/approve`, { clinicalNotes });
      toast.success('Prescription digitally signed and approved!');
      setSelectedRx(null);
      fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!selectedRx) return;
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    try {
      await api.post(`/prescriptions/${selectedRx._id}/reject`, { rejectionReason, clinicalNotes });
      toast.success('Prescription rejected successfully.');
      setSelectedRx(null);
      fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            Verification Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review prescriptions, run clinical safety checks, and authorize fulfillment.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Activity className="animate-spin text-emerald-500 w-8 h-8" />
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <CheckSquare size={48} className="mb-4 text-emerald-500/50" />
            <p>Queue is empty. No pending verifications.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {queue.map(rx => (
              <div key={rx._id} className="bg-slate-800/50 p-5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-800 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    {rx.prescriptionNumber}
                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/20 text-amber-400">
                      {rx.status.replace('_', ' ')}
                    </span>
                  </h3>
                  <div className="text-sm text-slate-400 mt-1">
                    Patient: <span className="text-slate-300">{rx.patient.firstName} {rx.patient.lastName}</span> &bull; 
                    Dr. {rx.doctor.name}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {rx.medications.map((m, idx) => (
                      <span key={idx} className="bg-slate-950 px-2 py-1 rounded text-xs text-slate-300 border border-slate-800">
                        {m.product.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => openReviewModal(rx)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Search size={16} /> Review
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-blue-500" />
                Reviewing {selectedRx.prescriptionNumber}
              </h2>
              <button onClick={() => setSelectedRx(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              {/* Left Side: Document Viewer */}
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center min-h-[400px]">
                {selectedRx.documentUrl ? (
                  <img src={selectedRx.documentUrl} alt="Prescription Scan" className="max-w-full max-h-[600px] object-contain rounded-lg" />
                ) : (
                  <div className="text-slate-500 flex flex-col items-center">
                    <SearchX size={48} className="mb-2 opacity-20" />
                    <p>No document scan provided</p>
                  </div>
                )}
              </div>

              {/* Right Side: Verification Details & Safety */}
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Safety Check Banner */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                  <h3 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Activity size={16} className={safetyCheckLoading ? 'animate-pulse text-blue-500' : 'text-blue-500'} />
                    Clinical Safety Check
                  </h3>
                  
                  {safetyCheckLoading ? (
                    <div className="text-slate-400 text-sm flex items-center gap-2">
                      <Activity className="animate-spin w-4 h-4" /> Analyzing interactions...
                    </div>
                  ) : safetyResult ? (
                    safetyResult.isSafe ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Safe to Dispense</p>
                          <p className="opacity-80 mt-1">No known drug-drug interactions or patient allergy conflicts detected.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {safetyResult.summary.highSeverity > 0 && (
                          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-rose-500">Critical Warnings ({safetyResult.summary.highSeverity})</p>
                              <ul className="mt-2 list-disc list-inside space-y-1">
                                {safetyResult.drugInteractions.filter(w => w.severity === 'HIGH').map((w, i) => (
                                  <li key={i}>{w.description}</li>
                                ))}
                                {safetyResult.allergyConflicts.filter(w => w.severity === 'HIGH').map((w, i) => (
                                  <li key={i}>{w.description}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {safetyResult.summary.mediumSeverity > 0 && (
                          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-3 rounded-lg text-sm flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-amber-500">Moderate Warnings</p>
                              <ul className="mt-1 list-disc list-inside space-y-1 opacity-90">
                                {safetyResult.drugInteractions.filter(w => w.severity === 'MEDIUM').map((w, i) => (
                                  <li key={i}>{w.description}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-rose-400 text-sm">Failed to load safety data.</div>
                  )}
                </div>

                {/* Structured Data */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                  <h3 className="font-semibold text-slate-300 mb-3">Structured Medications</h3>
                  <div className="space-y-2">
                    {selectedRx.medications.map((m, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                        <div className="font-semibold text-slate-200">{m.product.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {m.dosage} &bull; {m.frequency} &bull; {m.duration} &bull; Qty: {m.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Input */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                  <h3 className="font-semibold text-slate-300 mb-2">Clinical Consultation Notes (Optional)</h3>
                  <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter instructions, counseling points, or warnings..."
                    className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                  
                  {isRejecting && (
                    <div className="mt-4 animate-in slide-in-from-top-2">
                      <h3 className="font-semibold text-rose-400 mb-2">Rejection Reason (Required)</h3>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Why is this prescription being rejected?"
                        className="w-full h-20 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-200 placeholder-rose-500/50 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                {!isRejecting ? (
                  <button onClick={() => setIsRejecting(true)} className="text-rose-400 hover:text-rose-300 font-medium text-sm transition-colors px-4 py-2 hover:bg-rose-500/10 rounded-lg">
                    Reject Prescription
                  </button>
                ) : (
                  <button onClick={() => setIsRejecting(false)} className="text-slate-400 hover:text-white font-medium text-sm transition-colors px-4 py-2 hover:bg-white/5 rounded-lg">
                    Cancel Rejection
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {isRejecting ? (
                  <button
                    onClick={handleReject}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                  >
                    Confirm Rejection
                  </button>
                ) : (
                  <button
                    onClick={handleApprove}
                    disabled={Boolean(safetyCheckLoading || (safetyResult && !safetyResult.isSafe && safetyResult.summary.highSeverity > 0))}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    <CheckSquare size={18} />
                    Sign & Authorize Fill
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionQueuePage;
