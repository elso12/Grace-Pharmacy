import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download, Calendar, DollarSign, Pill, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

type Tab = 'tax' | 'controlled';

const CompliancePage: React.FC = () => {
  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [activeTab, setActiveTab] = useState<Tab>('tax');
  const [startDate, setStartDate] = useState<string>(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState<string>(getToday());
  
  const [isLoading, setIsLoading] = useState(false);
  const [taxData, setTaxData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);

  const fetchTaxReport = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/admin/compliance/tax-report`, {
        params: { startDate, endDate }
      });
      setTaxData(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch tax report');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditReport = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/admin/compliance/controlled-substances`, {
        params: { startDate, endDate }
      });
      setAuditData(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch audit log');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tax') {
      fetchTaxReport();
    } else {
      fetchAuditReport();
    }
  }, [activeTab, startDate, endDate]);

  const exportCSV = () => {
    if (activeTab === 'tax' && taxData) {
      const csv = `Metric,Amount\nGross Revenue,${taxData.grossRevenue}\nTaxable Sales,${taxData.taxableSales}\nNon-Taxable (Rx),${taxData.nonTaxableSales}\nTax Collected,${taxData.totalTaxCollected}`;
      downloadFile(csv, `tax_report_${startDate}_to_${endDate}.csv`);
    } else if (activeTab === 'controlled' && auditData?.auditLog) {
      let csv = `Date,Transaction ID,Order Number,Patient,Product Name,SKU,Category,Qty Dispensed,Dispensed By\n`;
      auditData.auditLog.forEach((row: any) => {
        csv += `${new Date(row.date).toLocaleString()},${row.transactionId},${row.orderNumber || '-'},${row.patientName},${row.product?.name},${row.product?.sku},${row.product?.category},${row.quantityDispensed},${row.dispensedBy?.firstName} ${row.dispensedBy?.lastName}\n`;
      });
      downloadFile(csv, `cs_audit_${startDate}_to_${endDate}.csv`);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-indigo-500" />
            Regulatory & Tax Compliance Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and export tax reports and controlled substance audits
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-white/[0.06] backdrop-blur">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-white border-none outline-none focus:ring-0"
            />
            <span className="text-slate-500">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-white border-none outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl shadow-sm text-sm font-medium text-white hover:bg-slate-700 transition"
          >
            <Download className="w-4 h-4 mr-2 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-xl shadow-lg border border-white/[0.06] p-6 backdrop-blur">
        <div className="flex space-x-4 border-b border-white/[0.06] pb-4 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg flex items-center gap-2 transition \${activeTab === 'tax' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('tax')}
          >
            <DollarSign className="w-4 h-4" />
            Tax & Revenue Report
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm rounded-lg flex items-center gap-2 transition \${activeTab === 'controlled' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('controlled')}
          >
            <Pill className="w-4 h-4" />
            Controlled Substances Audit
          </button>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'tax' && taxData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                  <p className="text-sm text-slate-400 font-medium mb-1">Gross Revenue</p>
                  <p className="text-3xl font-bold text-white">${taxData.grossRevenue?.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                  <p className="text-sm text-slate-400 font-medium mb-1">Taxable Sales (OTC)</p>
                  <p className="text-3xl font-bold text-emerald-400">${taxData.taxableSales?.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                  <p className="text-sm text-slate-400 font-medium mb-1">Non-Taxable Sales (Rx)</p>
                  <p className="text-3xl font-bold text-indigo-400">${taxData.nonTaxableSales?.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-6 rounded-xl border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  <p className="text-sm text-rose-300 font-medium mb-1">Total Tax Collected</p>
                  <p className="text-3xl font-bold text-rose-400">${taxData.totalTaxCollected?.toFixed(2)}</p>
                </div>
              </div>
            )}

            {activeTab === 'controlled' && auditData && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Date</th>
                      <th className="px-4 py-3 font-medium">Order #</th>
                      <th className="px-4 py-3 font-medium">Patient</th>
                      <th className="px-4 py-3 font-medium">Medication</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Dispensed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/30">
                    {auditData.auditLog?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No controlled substance movements found in this period.
                        </td>
                      </tr>
                    ) : (
                      auditData.auditLog?.map((log: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3 text-slate-300">{new Date(log.date).toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{log.orderNumber || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-500" />
                              <span className="text-white">{log.patientName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium">{log.product?.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{log.product?.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-rose-400 font-bold">{log.quantityDispensed}</td>
                          <td className="px-4 py-3 text-slate-300">{log.dispensedBy?.firstName} {log.dispensedBy?.lastName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompliancePage;
