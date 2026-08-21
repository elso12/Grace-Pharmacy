import React, { useState, useEffect } from 'react';
import { Search, User, FileText, Activity, AlertTriangle, ShieldCheck, ChevronRight, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  allergies: Array<{ substance: string; severity: string; notes?: string }>;
  medicalConditions: string[];
  notes?: string;
}

interface PrescriptionHistory {
  _id: string;
  prescriptionNumber: string;
  prescriptionDate: string;
  status: string;
  medications: Array<{
    product: { name: string };
    dosage: string;
    quantity: number;
  }>;
  verificationDetails?: {
    verifiedAt: string;
    digitalSignature: string;
    clinicalNotes: string;
  };
}

const PatientHistoryPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
  
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get('/customers');
      setPatients(data.data || []);
    } catch (err) {
      console.error('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/prescriptions/patients/${patient._id}/history`);
      setPrescriptions(data.data.prescriptions || []);
    } catch (err) {
      console.error('Failed to fetch patient history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedPatient || !newNote.trim()) return;
    try {
      setIsSubmittingNote(true);
      const { data } = await api.post(`/prescriptions/patients/${selectedPatient._id}/notes`, { note: newNote });
      toast.success('Consultation note added successfully!');
      setSelectedPatient(data.data); // Update patient with new notes
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note', err);
      toast.error('Failed to add consultation note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <User className="h-6 w-6 text-blue-500" />
            Patient History & Clinical Records
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access patient profiles, medication history, and log counseling notes.
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left Side: Patient Directory */}
        <div className="w-1/3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex justify-center p-8">
                <Activity className="animate-spin text-blue-500 w-6 h-6" />
              </div>
            ) : filteredPatients.map(patient => (
              <button
                key={patient._id}
                onClick={() => loadPatientHistory(patient)}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${
                  selectedPatient?._id === patient._id 
                    ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
                    : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                }`}
              >
                <div>
                  <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
                  <div className="text-xs opacity-70">{patient.phone}</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Patient Details & History */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-y-auto p-6">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <User size={48} className="mb-4 text-slate-700" />
              <p>Select a patient to view their clinical history.</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                  <p className="text-slate-400 mt-1">{selectedPatient.phone} &bull; {selectedPatient.email || 'No email'}</p>
                </div>
                {selectedPatient.allergies.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">{selectedPatient.allergies.length} Documented Allergies</span>
                  </div>
                )}
              </div>

              {/* Patient Attributes Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-500 mb-2">Allergies</h3>
                  {selectedPatient.allergies.length === 0 ? (
                    <span className="text-slate-400 text-sm">No known allergies (NKA).</span>
                  ) : (
                    <ul className="space-y-2">
                      {selectedPatient.allergies.map((alg, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          {alg.substance} ({alg.severity})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-500 mb-2">Medical Conditions</h3>
                  {selectedPatient.medicalConditions.length === 0 ? (
                    <span className="text-slate-400 text-sm">No conditions reported.</span>
                  ) : (
                    <ul className="space-y-2">
                      {selectedPatient.medicalConditions.map((cond, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {cond}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Consultation Notes */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-400" />
                  Clinical Consultation Notes
                </h3>
                
                <div className="mb-4 max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {selectedPatient.notes ? selectedPatient.notes : "No clinical notes documented for this patient."}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new counseling or consultation note..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 text-sm text-white focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isSubmittingNote || !newNote.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isSubmittingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {/* Prescription History */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Prescription History
                </h3>
                {historyLoading ? (
                  <div className="flex justify-center p-4">
                    <Activity className="animate-spin text-blue-500" />
                  </div>
                ) : prescriptions.length === 0 ? (
                  <div className="text-slate-400 text-sm text-center p-4 bg-slate-950 border border-slate-800 rounded-xl">
                    No prescription history found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map(rx => (
                      <div key={rx._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-slate-200">
                            {rx.prescriptionNumber}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                            rx.status === 'APPROVED' || rx.status === 'DISPENSED' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : rx.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' 
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {rx.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">
                          Prescribed: {new Date(rx.prescriptionDate).toLocaleDateString()}
                        </div>
                        <div className="space-y-1 mb-3">
                          {rx.medications.map((m, i) => (
                            <div key={i} className="text-sm text-slate-300">
                              &bull; {m.product.name} ({m.dosage}) - Qty: {m.quantity}
                            </div>
                          ))}
                        </div>
                        {rx.verificationDetails?.digitalSignature && (
                          <div className="mt-3 pt-3 border-t border-slate-800/50 text-xs text-emerald-500/80 font-mono flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>{rx.verificationDetails.digitalSignature}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPage;
