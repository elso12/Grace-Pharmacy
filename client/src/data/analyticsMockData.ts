/**
 * ─── Analytics & Reporting Mock Data & Types ──────────────────────────────
 * Financial KPIs, monthly sales vs procurement cost trajectories, top
 * dispensed drug categories, and FEFO inventory expiry alert batches.
 */

export interface MonthlyFinancialData {
  month: string;
  sales: number;
  costs: number;
  profit: number;
  margin: number; // percentage
}

export interface CategoryDispenseData {
  category: "PRESCRIPTION" | "OTC" | "CONTROLLED" | "SUPPLEMENT" | "MEDICAL_DEVICE";
  dispensedCount: number;
  revenue: number;
  percentage: number;
  color: string;
}

export type ExpiryTimeframe = "ALL" | "30_DAYS" | "60_DAYS" | "90_DAYS" | "ACTIONED";
export type ExpiryBatchStatus = "ACTIVE" | "DISCOUNTED_30" | "DISCOUNTED_50" | "RETURN_INITIATED";

export interface ExpiryAlertBatch {
  id: string;
  productId: string;
  productName: string;
  genericName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  daysUntilExpiry: number;
  stock: number;
  unitCost: number;
  sellingPrice: number;
  totalLossRisk: number; // stock * unitCost
  supplierName: string;
  status: ExpiryBatchStatus;
  actionTimestamp?: string;
  notes?: string;
}

export interface AnalyticsSummaryKPIs {
  totalRevenueYTD: number;
  revenueGrowthMoM: number;
  totalProcurementCosts: number;
  costsChangeMoM: number;
  netGrossProfit: number;
  profitMarginPercentage: number;
  totalDispensedItems: number;
  expiringStockLossRisk: number; // total valuation of batches expiring within 90 days
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── 1. MONTHLY SALES VS PROCUREMENT COSTS (LAST 12 MONTHS) ────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_MONTHLY_FINANCIALS: MonthlyFinancialData[] = [
  { month: "Aug '25", sales: 68400, costs: 42100, profit: 26300, margin: 38.5 },
  { month: "Sep '25", sales: 72150, costs: 44200, profit: 27950, margin: 38.7 },
  { month: "Oct '25", sales: 76800, costs: 46500, profit: 30300, margin: 39.5 },
  { month: "Nov '25", sales: 81200, costs: 49100, profit: 32100, margin: 39.5 },
  { month: "Dec '25", sales: 94500, costs: 56200, profit: 38300, margin: 40.5 },
  { month: "Jan '26", sales: 88200, costs: 53100, profit: 35100, margin: 39.8 },
  { month: "Feb '26", sales: 85400, costs: 51200, profit: 34200, margin: 40.0 },
  { month: "Mar '26", sales: 91800, costs: 54900, profit: 36900, margin: 40.2 },
  { month: "Apr '26", sales: 96300, costs: 57100, profit: 39200, margin: 40.7 },
  { month: "May '26", sales: 102400, costs: 60200, profit: 42200, margin: 41.2 },
  { month: "Jun '26", sales: 108900, costs: 63800, profit: 45100, margin: 41.4 },
  { month: "Jul '26", sales: 114500, costs: 66400, profit: 48100, margin: 42.0 }, // Current month (estimate)
];

// ═════════════════════════════════════════════════════════════════════════════
// ─── 2. TOP 5 MOST DISPENSED DRUG CATEGORIES ───────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_TOP_CATEGORIES: CategoryDispenseData[] = [
  {
    category: "PRESCRIPTION",
    dispensedCount: 14850,
    revenue: 542000,
    percentage: 55.4,
    color: "#6366f1", // Indigo
  },
  {
    category: "OTC",
    dispensedCount: 8420,
    revenue: 184500,
    percentage: 24.2,
    color: "#10b981", // Emerald
  },
  {
    category: "CONTROLLED",
    dispensedCount: 3120,
    revenue: 142800,
    percentage: 12.1,
    color: "#f43f5e", // Rose
  },
  {
    category: "SUPPLEMENT",
    dispensedCount: 2450,
    revenue: 68400,
    percentage: 5.8,
    color: "#f59e0b", // Amber
  },
  {
    category: "MEDICAL_DEVICE",
    dispensedCount: 890,
    revenue: 42850,
    percentage: 2.5,
    color: "#8b5cf6", // Purple
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// ─── 3. EXPIRY ALERT BATCHES (NEXT 30, 60, 90 DAYS) ────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_EXPIRY_BATCHES: ExpiryAlertBatch[] = [
  {
    id: "exp-b01",
    productId: "prod-001",
    productName: "Warfarin Sodium",
    genericName: "warfarin",
    sku: "RX-WAR-005",
    batchNumber: "WAR-2026-08A",
    expiryDate: "2026-08-15", // ~18 days left!
    daysUntilExpiry: 18,
    stock: 45,
    unitCost: 12.0,
    sellingPrice: 18.5,
    totalLossRisk: 540.0, // 45 * $12
    supplierName: "Apex Pharma Distributors",
    status: "ACTIVE",
  },
  {
    id: "exp-b02",
    productId: "prod-003",
    productName: "Amoxicillin Trihydrate",
    genericName: "amoxicillin",
    sku: "RX-AMX-500",
    batchNumber: "AMX-2026-08Z",
    expiryDate: "2026-08-28", // ~31 days left
    daysUntilExpiry: 29,
    stock: 60,
    unitCost: 9.0,
    sellingPrice: 15.0,
    totalLossRisk: 540.0,
    supplierName: "BioHealth Global Supply",
    status: "ACTIVE",
  },
  {
    id: "exp-b03",
    productId: "prod-009",
    productName: "Omeprazole Delayed Release",
    genericName: "omeprazole",
    sku: "RX-OMP-020",
    batchNumber: "OMP-2026-09C",
    expiryDate: "2026-09-20", // ~54 days left
    daysUntilExpiry: 54,
    stock: 120,
    unitCost: 6.5,
    sellingPrice: 14.0,
    totalLossRisk: 780.0,
    supplierName: "MedicaCorp Direct",
    status: "ACTIVE",
  },
  {
    id: "exp-b04",
    productId: "prod-010",
    productName: "Atorvastatin Calcium",
    genericName: "atorvastatin",
    sku: "RX-ATR-040",
    batchNumber: "ATR-2026-09X",
    expiryDate: "2026-09-28", // ~62 days left
    daysUntilExpiry: 62,
    stock: 85,
    unitCost: 11.0,
    sellingPrice: 24.0,
    totalLossRisk: 935.0,
    supplierName: "Apex Pharma Distributors",
    status: "ACTIVE",
  },
  {
    id: "exp-b05",
    productId: "prod-002",
    productName: "Aspirin Protect",
    genericName: "acetylsalicylic acid",
    sku: "OTC-ASP-100",
    batchNumber: "ASP-2026-10A",
    expiryDate: "2026-10-10", // ~74 days left
    daysUntilExpiry: 74,
    stock: 210,
    unitCost: 4.5,
    sellingPrice: 8.99,
    totalLossRisk: 945.0,
    supplierName: "Consumer Health Inc.",
    status: "ACTIVE",
  },
  {
    id: "exp-b06",
    productId: "prod-011",
    productName: "Metformin Extended Release",
    genericName: "metformin hydrochloride",
    sku: "RX-MET-850",
    batchNumber: "MET-2026-10Y",
    expiryDate: "2026-10-22", // ~86 days left
    daysUntilExpiry: 86,
    stock: 180,
    unitCost: 5.0,
    sellingPrice: 12.5,
    totalLossRisk: 900.0,
    supplierName: "BioHealth Global Supply",
    status: "ACTIVE",
  },
  {
    id: "exp-b07",
    productId: "prod-012",
    productName: "Cetirizine Allergy Relief",
    genericName: "cetirizine hydrochloride",
    sku: "OTC-CET-010",
    batchNumber: "CET-2026-08B",
    expiryDate: "2026-08-20", // ~23 days left
    daysUntilExpiry: 23,
    stock: 40,
    unitCost: 3.2,
    sellingPrice: 7.5,
    totalLossRisk: 128.0,
    supplierName: "Consumer Health Inc.",
    status: "DISCOUNTED_30",
    actionTimestamp: "2026-07-25 09:30:00",
    notes: "Applied 30% clearance discount tag for front-counter promo shelf.",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// ─── 4. SUMMARY KPIS (YEAR TO DATE / TRAILING 12M) ─────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const MOCK_SUMMARY_KPIS: AnalyticsSummaryKPIs = {
  totalRevenueYTD: 1080550.0, // $1.08M
  revenueGrowthMoM: 5.1, // +5.1%
  totalProcurementCosts: 644900.0,
  costsChangeMoM: 4.0, // +4.0%
  netGrossProfit: 435650.0,
  profitMarginPercentage: 40.3,
  totalDispensedItems: 29730,
  expiringStockLossRisk: 4768.0, // Sum of totalLossRisk across all active expiring batches
};
