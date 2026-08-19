import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Search,
  Tag,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  MOCK_MONTHLY_FINANCIALS,
  MOCK_TOP_CATEGORIES,
  MOCK_EXPIRY_BATCHES,
  MOCK_SUMMARY_KPIS,
  type ExpiryAlertBatch,
  type ExpiryTimeframe,
  type ExpiryBatchStatus,
} from "../data/analyticsMockData";

// ═════════════════════════════════════════════════════════════════════════════
// ─── ANALYTICS & REPORTING DASHBOARD COMPONENT ─────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const AnalyticsScreen: React.FC = () => {
  // ─── State: Expiry Table Filters & Search ────────────────────────────────
  const [expiryBatches, setExpiryBatches] = useState<ExpiryAlertBatch[]>(MOCK_EXPIRY_BATCHES);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ExpiryTimeframe>("ALL");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"12M" | "YTD" | "Q2">("12M");

  // ─── State: Modals & Notifications ──────────────────────────────────────
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState<ExpiryAlertBatch | null>(null);
  const [discountPercent, setDiscountPercent] = useState<30 | 50>(30);
  const [discountNotes, setDiscountNotes] = useState("");
  const [actionToast, setActionToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // ─── Trigger Toast Helper ───────────────────────────────────────────────
  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4500);
  };

  // ─── Filtered Expiry Batches ────────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    const q = batchSearchQuery.toLowerCase().trim();
    return expiryBatches.filter((b) => {
      // 1. Search query filter
      const matchesSearch =
        !q ||
        b.productName.toLowerCase().includes(q) ||
        b.genericName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Timeframe / Status filter
      if (selectedTimeframe === "ALL") return b.status === "ACTIVE";
      if (selectedTimeframe === "30_DAYS") return b.status === "ACTIVE" && b.daysUntilExpiry <= 30;
      if (selectedTimeframe === "60_DAYS") return b.status === "ACTIVE" && b.daysUntilExpiry > 30 && b.daysUntilExpiry <= 60;
      if (selectedTimeframe === "90_DAYS") return b.status === "ACTIVE" && b.daysUntilExpiry > 60 && b.daysUntilExpiry <= 90;
      if (selectedTimeframe === "ACTIONED") return b.status !== "ACTIVE";

      return true;
    });
  }, [expiryBatches, selectedTimeframe, batchSearchQuery]);

  // ─── Action Handler 1: Mark for Discount ────────────────────────────────
  const handleApplyDiscount = () => {
    if (!showDiscountModal) return;
    const batchId = showDiscountModal.id;
    const newStatus: ExpiryBatchStatus = discountPercent === 30 ? "DISCOUNTED_30" : "DISCOUNTED_50";

    setExpiryBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        return {
          ...b,
          status: newStatus,
          sellingPrice: Number((b.sellingPrice * (1 - discountPercent / 100)).toFixed(2)),
          actionTimestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          notes: discountNotes || `Applied ${discountPercent}% clearance promotional discount tag for nearest expiration.`,
        };
      })
    );

    triggerToast(
      `Applied ${discountPercent}% Clearance Discount to Batch #${showDiscountModal.batchNumber}! Moved to Actioned tab.`
    );
    setShowDiscountModal(null);
    setDiscountNotes("");
  };

  // ─── Action Handler 2: Return to Supplier (RMA) ─────────────────────────
  const handleReturnToSupplier = (batch: ExpiryAlertBatch) => {
    if (!window.confirm(`Initiate Supplier Return (RMA) for Batch #${batch.batchNumber} (${batch.productName})?\n\nThis will remove ${batch.stock} units ($${batch.totalLossRisk}) from active risk and generate a credit memo request to ${batch.supplierName}.`)) {
      return;
    }

    setExpiryBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batch.id) return b;
        return {
          ...b,
          status: "RETURN_INITIATED" as const,
          actionTimestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          notes: `RMA Credit Request initiated with supplier '${batch.supplierName}' for ${batch.stock} units.`,
        };
      })
    );

    triggerToast(
      `RMA Return Initiated for Batch #${batch.batchNumber} with ${batch.supplierName}! Credit memo pending.`,
      "info"
    );
  };

  // ─── CSV Export Generator & Download ────────────────────────────────────
  const exportToCSV = () => {
    const headers = ["ID,Product Name,Generic Name,SKU,Batch Number,Expiry Date,Days Left,Stock Qty,Unit Cost ($),Selling Price ($),Total Value ($),Supplier,Status,Notes\n"];
    const rows = expiryBatches.map(
      (b) =>
        `"${b.id}","${b.productName}","${b.genericName}","${b.sku}","${b.batchNumber}","${b.expiryDate}",${b.daysUntilExpiry},${b.stock},${b.unitCost},${b.sellingPrice},${b.totalLossRisk},"${b.supplierName}","${b.status}","${b.notes || ""}"`
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PharmaCare_FEFO_Expiry_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("Exported Expiry & Financial Analytics Report to CSV file successfully!");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDER ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-12 overflow-x-hidden">
      
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {actionToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            actionToast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-400/50 shadow-emerald-600/30"
              : "bg-indigo-600 text-white border-indigo-400/50 shadow-indigo-600/30"
          }`}
        >
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm font-bold">{actionToast.message}</p>
        </div>
      )}

      {/* ─── DASHBOARD HEADER & EXPORT CONTROLS ───────────────────────────── */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-purple-200 bg-clip-text text-transparent flex items-center">
                Executive Analytics & Reporting Dashboard
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 ml-2.5">
                  TELEMETRY v4.2
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Financial Trajectories, Category Revenue & FEFO Expiry Risk Mitigation
              </p>
            </div>
          </div>

          {/* Controls: Date Range & Export UI */}
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              {(["12M", "YTD", "Q2"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    dateRange === r ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r === "12M" ? "Trailing 12M" : r === "YTD" ? "YTD 2026" : "Q2 2026"}
                </button>
              ))}
            </div>

            {/* Export Options UI Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToCSV}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center space-x-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Export PDF / Print</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ANALYTICS CONTENT AREA ──────────────────────────────────── */}
      <main className="max-w-[1700px] mx-auto w-full px-6 pt-6 space-y-6">
        
        {/* 1. EXECUTIVE KPI OVERVIEW GRID (4 CARDS) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Gross Revenue YTD */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Gross Revenue</p>
                <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">
                  ${(MOCK_SUMMARY_KPIS.totalRevenueYTD / 1000).toFixed(1)}K
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-emerald-400 font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mr-2">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +{MOCK_SUMMARY_KPIS.revenueGrowthMoM}%
              </span>
              <span className="text-slate-400 font-mono">vs. trailing month</span>
            </div>
          </div>

          {/* Card 2: Procurement Costs */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-rose-500/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Medication Procurement</p>
                <h3 className="text-2xl font-extrabold text-slate-200 mt-1 font-mono">
                  ${(MOCK_SUMMARY_KPIS.totalProcurementCosts / 1000).toFixed(1)}K
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-amber-400 font-bold flex items-center bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mr-2">
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> +{MOCK_SUMMARY_KPIS.costsChangeMoM}%
              </span>
              <span className="text-slate-400 font-mono">supplier index inflation</span>
            </div>
          </div>

          {/* Card 3: Net Profit Margin */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Gross Profit Margin</p>
                <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
                  {MOCK_SUMMARY_KPIS.profitMarginPercentage}%
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-slate-300 font-bold font-mono mr-2">
                ${(MOCK_SUMMARY_KPIS.netGrossProfit / 1000).toFixed(1)}K Net Profit
              </span>
              <span className="text-emerald-400 font-mono font-medium">(Target: &gt;38%)</span>
            </div>
          </div>

          {/* Card 4: Expiring Stock Valuation Risk */}
          <div className="bg-gradient-to-br from-rose-950/40 to-slate-900 rounded-2xl border border-rose-500/40 p-5 shadow-xl relative overflow-hidden group hover:border-rose-400 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-400 animate-pulse" /> Expiring Stock Risk (90d)
                </p>
                <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">
                  ${MOCK_SUMMARY_KPIS.expiringStockLossRisk.toLocaleString()}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 group-hover:scale-110 transition animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-rose-200 font-bold bg-rose-500/30 px-2 py-0.5 rounded border border-rose-400/30 mr-2 font-mono">
                {expiryBatches.filter((b) => b.status === "ACTIVE" && b.daysUntilExpiry <= 90).length} Batches At Risk
              </span>
              <span className="text-slate-400 underline cursor-pointer hover:text-white" onClick={() => setSelectedTimeframe("ALL")}>
                Action needed
              </span>
            </div>
          </div>
        </section>

        {/* 2. RECHARTS VISUALIZATION GRID (2 CHARTS) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CHART 1: LINE/AREA CHART - MONTHLY SALES VS PROCUREMENT COSTS (8 COLS) */}
          <div className="lg:col-span-8 bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
              <div>
                <h2 className="font-bold text-base text-white flex items-center">
                  <TrendingUp className="w-5 h-5 text-indigo-400 mr-2" />
                  Monthly Revenue Trajectory vs. Procurement Costs
                </h2>
                <p className="text-xs text-slate-400">
                  Comparing gross retail sales against wholesale procurement inventory expenses ($ USD)
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-1.5" /> Gross Sales</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-1.5" /> Procurement Costs</span>
              </div>
            </div>

            <div className="w-full h-[340px] pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_MONTHLY_FINANCIALS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val: any) => `$${val / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const sales = payload[0].value as number;
                        const costs = payload[1].value as number;
                        const profit = sales - costs;
                        const margin = ((profit / sales) * 100).toFixed(1);
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs font-mono">
                            <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-2 font-sans">{label} Financial Breakdown</p>
                            <p className="text-indigo-400">Gross Sales: <strong className="text-white">${sales.toLocaleString()}</strong></p>
                            <p className="text-rose-400">Procurement: <strong className="text-white">${costs.toLocaleString()}</strong></p>
                            <div className="mt-2 pt-1 border-t border-slate-800 flex justify-between gap-4 text-emerald-400 font-bold">
                              <span>Net Profit: ${profit.toLocaleString()}</span>
                              <span>({margin}%)</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Gross Sales ($)"
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCosts)"
                    name="Procurement Costs ($)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: BAR CHART - TOP 5 DISPENSED DRUG CATEGORIES (4 COLS) */}
          <div className="lg:col-span-4 bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="pb-4 mb-4 border-b border-slate-800">
                <h2 className="font-bold text-base text-white flex items-center">
                  <Layers className="w-5 h-5 text-emerald-400 mr-2" />
                  Top Dispensed Categories
                </h2>
                <p className="text-xs text-slate-400">Volume distribution across pharmaceutical classifications</p>
              </div>

              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_TOP_CATEGORIES} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `${val / 1000}k`} />
                    <YAxis type="category" dataKey="category" stroke="#e2e8f0" fontSize={10} tickLine={false} width={80} />
                    <Tooltip
                      cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                              <p className="font-bold text-white uppercase font-sans mb-1">{data.category}</p>
                              <p className="text-indigo-300">Dispensed: <strong>{data.dispensedCount.toLocaleString()} Rx</strong></p>
                              <p className="text-emerald-400">Revenue: <strong>${data.revenue.toLocaleString()}</strong></p>
                              <p className="text-slate-400 mt-1">Share: <strong>{data.percentage}% of total</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="dispensedCount" radius={[0, 6, 6, 0]} barSize={20}>
                      {MOCK_TOP_CATEGORIES.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Percentage Breakdown Cards */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-800">
              {MOCK_TOP_CATEGORIES.slice(0, 4).map((cat) => (
                <div key={cat.category} className="bg-slate-950 p-2 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[11px] font-bold text-slate-300 truncate">{cat.category === "PRESCRIPTION" ? "Rx Only" : cat.category}</span>
                  </div>
                  <span className="font-extrabold text-white">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. FEFO EXPIRY ALERT MANAGEMENT TABLE & ACTION ENGINE */}
        <section className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-white">FEFO Expiry Alert & Risk Mitigation Table</h2>
                <p className="text-xs text-slate-400">
                  Proactively salvage expiring stock via front-counter clearance discounts or supplier RMA returns
                </p>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                {[
                  { id: "ALL", label: "All Active" },
                  { id: "30_DAYS", label: "≤ 30 Days (Critical)", color: "text-rose-400 font-bold" },
                  { id: "60_DAYS", label: "31-60 Days", color: "text-amber-400" },
                  { id: "90_DAYS", label: "61-90 Days" },
                  { id: "ACTIONED", label: "Actioned (Discount/RMA)", color: "text-indigo-400" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTimeframe(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap font-medium ${
                      selectedTimeframe === tab.id
                        ? "bg-slate-800 text-white shadow font-bold"
                        : "text-slate-400 hover:text-white"
                    } ${tab.color || ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Batch Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter drug or batch #..."
                  value={batchSearchQuery}
                  onChange={(e) => setBatchSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Expiry Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px] bg-slate-950/40">
                  <th className="py-3 px-3">Medication & SKU</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Expiry Date & Urgency</th>
                  <th className="py-3 px-3 text-right">Stock</th>
                  <th className="py-3 px-3 text-right">Unit / Retail</th>
                  <th className="py-3 px-3 text-right">Total Risk ($)</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3 text-center">Status / Mitigation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-sans text-sm">
                      No inventory batches match the selected expiry filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const isCritical = batch.daysUntilExpiry <= 30;
                    const isWarning = batch.daysUntilExpiry > 30 && batch.daysUntilExpiry <= 60;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-850/60 transition group">
                        {/* Drug Name */}
                        <td className="py-3.5 px-3 font-sans">
                          <p className="font-bold text-white group-hover:text-indigo-300 transition">{batch.productName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{batch.sku} • <span className="italic">{batch.genericName}</span></p>
                        </td>

                        {/* Batch # */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-200 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            #{batch.batchNumber}
                          </span>
                        </td>

                        {/* Expiry & Badge */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-200">{batch.expiryDate}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm ${
                                isCritical
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                                  : isWarning
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}
                            >
                              {batch.daysUntilExpiry}d left
                            </span>
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-3 text-right font-bold text-white">
                          {batch.stock} units
                        </td>

                        {/* Prices */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="text-slate-400">${batch.unitCost.toFixed(2)}</span> /{" "}
                          <span className="font-bold text-emerald-400">${batch.sellingPrice.toFixed(2)}</span>
                        </td>

                        {/* Total Risk Valuation */}
                        <td className="py-3.5 px-3 text-right">
                          <span className={`font-extrabold text-sm ${isCritical ? "text-rose-400" : "text-slate-200"}`}>
                            ${batch.totalLossRisk.toFixed(2)}
                          </span>
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-3 font-sans text-slate-300 truncate max-w-[150px]">
                          {batch.supplierName}
                        </td>

                        {/* Actions Engine */}
                        <td className="py-3.5 px-3 text-center font-sans">
                          {batch.status === "ACTIVE" ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setShowDiscountModal(batch)}
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold rounded-lg border border-indigo-500/40 transition flex items-center space-x-1"
                                title="Apply promo clearance discount tag"
                              >
                                <Tag className="w-3 h-3" />
                                <span>Discount</span>
                              </button>

                              <button
                                onClick={() => handleReturnToSupplier(batch)}
                                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold rounded-lg border border-rose-500/40 transition flex items-center space-x-1"
                                title="Initiate supplier RMA return request"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Return RMA</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-bold text-slate-300">
                                {batch.status === "DISCOUNTED_30"
                                  ? "30% OFF TAG APPLIED"
                                  : batch.status === "DISCOUNTED_50"
                                  ? "50% OFF TAG APPLIED"
                                  : "RMA RETURN PENDING"}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 1: MARK FOR CLEARANCE DISCOUNT ────────────────────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button onClick={() => setShowDiscountModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Apply Clearance Discount Tag</h3>
                <p className="text-xs text-slate-400 font-mono">Batch #{showDiscountModal.batchNumber} • {showDiscountModal.productName}</p>
              </div>
            </div>

            <div className="space-y-4 my-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between"><span>Current Retail Price:</span> <span className="font-bold">${showDiscountModal.sellingPrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Unit Cost:</span> <span>${showDiscountModal.unitCost.toFixed(2)}</span></div>
                <div className="flex justify-between text-amber-400 font-bold"><span>Expires in:</span> <span>{showDiscountModal.daysUntilExpiry} days ({showDiscountModal.expiryDate})</span></div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Select Promotional Markdown Level:</label>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <button
                    type="button"
                    onClick={() => setDiscountPercent(30)}
                    className={`p-3 rounded-xl border text-left transition ${
                      discountPercent === 30
                        ? "bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span className="text-base font-extrabold text-indigo-300 block">30% OFF</span>
                    <span className="text-[11px] opacity-80">New Price: ${(showDiscountModal.sellingPrice * 0.7).toFixed(2)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountPercent(50)}
                    className={`p-3 rounded-xl border text-left transition ${
                      discountPercent === 50
                        ? "bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    <span className="text-base font-extrabold text-rose-300 block">50% OFF</span>
                    <span className="text-[11px] opacity-80">New Price: ${(showDiscountModal.sellingPrice * 0.5).toFixed(2)}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Audit Log Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Front-counter promotion shelf..."
                  value={discountNotes}
                  onChange={(e) => setDiscountNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => setShowDiscountModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDiscount}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
              >
                <Tag className="w-4 h-4" />
                <span>Confirm {discountPercent}% Markdown</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 2: EXPORT TO PDF / PRINT REPORT PREVIEW ───────────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Printer className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="font-bold text-lg text-white">Executive Analytics & Expiry Risk Report</h3>
                  <p className="text-xs text-slate-400 font-mono">Official PDF Print Presentation Document</p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 flex-1 overflow-y-auto px-2 font-mono">
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl max-w-2xl mx-auto border border-slate-300">
                
                {/* Document Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="font-extrabold text-2xl uppercase tracking-tight text-slate-900 font-sans">
                      PHARMACARE ENTERPRISE
                    </h2>
                    <p className="text-xs text-slate-600">Executive Financial & Inventory Intelligence Report</p>
                    <p className="text-[11px] text-slate-500 mt-1">Generated: {new Date().toLocaleString()} • Telemetry v4.2</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white font-extrabold text-xs px-3 py-1 rounded">
                      CONFIDENTIAL
                    </span>
                    <p className="text-[10px] text-slate-500 mt-2">DEA License: #PH-98234-CA</p>
                  </div>
                </div>

                {/* KPI Overview Summary */}
                <h3 className="font-extrabold text-sm uppercase text-slate-800 mb-3 font-sans border-b border-slate-200 pb-1">
                  1. Trailing 12-Month Financial Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">TOTAL GROSS REVENUE:</span>
                    <span className="font-extrabold text-base text-slate-900">${(MOCK_SUMMARY_KPIS.totalRevenueYTD / 1000).toFixed(1)}K</span>
                    <span className="text-emerald-700 block text-[10px] font-bold">+{MOCK_SUMMARY_KPIS.revenueGrowthMoM}% YoY</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROCUREMENT EXPENSE:</span>
                    <span className="font-extrabold text-base text-slate-900">${(MOCK_SUMMARY_KPIS.totalProcurementCosts / 1000).toFixed(1)}K</span>
                    <span className="text-slate-600 block text-[10px]">Wholesale inflation</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">NET PROFIT MARGIN:</span>
                    <span className="font-extrabold text-base text-indigo-700">{MOCK_SUMMARY_KPIS.profitMarginPercentage}%</span>
                    <span className="text-emerald-700 block text-[10px] font-bold">Above 38% target</span>
                  </div>
                </div>

                {/* Expiry Risk Breakdown */}
                <h3 className="font-extrabold text-sm uppercase text-slate-800 mb-3 font-sans border-b border-slate-200 pb-1">
                  2. FEFO Expiring Inventory Audit (Next 90 Days)
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  The following active inventory batches require immediate clearance markdown or supplier RMA return authorization to prevent financial write-off loss.
                </p>

                <table className="w-full text-[11px] mb-6 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 text-left border-b-2 border-slate-900">
                      <th className="py-2 px-2">MEDICATION & BATCH #</th>
                      <th className="py-2 px-2">EXPIRY DATE</th>
                      <th className="py-2 px-2 text-right">STOCK</th>
                      <th className="py-2 px-2 text-right">RISK VALUE</th>
                      <th className="py-2 px-2 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {expiryBatches
                      .filter((b) => b.status === "ACTIVE" && b.daysUntilExpiry <= 90)
                      .map((b) => (
                        <tr key={b.id}>
                          <td className="py-2 px-2 font-bold">{b.productName} <span className="font-normal text-slate-500">(#{b.batchNumber})</span></td>
                          <td className="py-2 px-2 text-rose-700 font-bold">{b.expiryDate} ({b.daysUntilExpiry}d)</td>
                          <td className="py-2 px-2 text-right">{b.stock}</td>
                          <td className="py-2 px-2 text-right font-bold">${b.totalLossRisk.toFixed(2)}</td>
                          <td className="py-2 px-2 text-center"><span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[9px] font-bold">ACTIVE RISK</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Sign-off Footer */}
                <div className="border-t-2 border-slate-900 pt-6 mt-8 flex justify-between items-end text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Prepared by: Pharmacist Clinical Operations</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">PharmaCare Health Systems Automated Telemetry</p>
                  </div>
                  <div className="text-center w-48 border-t border-slate-400 pt-1">
                    <p className="text-[10px] uppercase font-bold text-slate-600">Chief Pharmacist Signature</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowExportModal(false);
                  triggerToast("Sent Executive Report to browser PDF printer successfully!");
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsScreen;
