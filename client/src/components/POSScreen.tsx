import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Barcode,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  FileText,
  Tag,
  X,
  ChevronRight,
  Layers,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  HeartPulse,
  Activity,
  FileSpreadsheet,
} from "lucide-react";

import {
  MOCK_MEDICATIONS,
  MOCK_PATIENTS,
  evaluateClinicalSafety,
  type MedicationProduct,
  type InventoryBatch,
  type Patient,
  type CartItem,
  type ClinicalWarning,
} from "../data/posMockData";

// ═════════════════════════════════════════════════════════════════════════════
// ─── MAIN POS & DISPENSING SCREEN COMPONENT ────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

export const POSScreen: React.FC = () => {
  // ─── State: Patient Lookup ──────────────────────────────────────────────
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(MOCK_PATIENTS[0]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // ─── State: Product & Barcode Search ────────────────────────────────────
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── State: Active Dispensing Cart ──────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "cart-init-1",
      product: MOCK_MEDICATIONS[0], // Warfarin
      selectedBatch: MOCK_MEDICATIONS[0].batches[0],
      quantity: 1,
      unitPrice: MOCK_MEDICATIONS[0].price,
      discount: 0,
      dosageInstructions: "Take 1 tablet daily in the evening with water.",
      lineTotal: MOCK_MEDICATIONS[0].price,
    },
    {
      id: "cart-init-2",
      product: MOCK_MEDICATIONS[3], // Lisinopril
      selectedBatch: MOCK_MEDICATIONS[3].batches[0],
      quantity: 1,
      unitPrice: MOCK_MEDICATIONS[3].price,
      discount: 0,
      dosageInstructions: "Take 1 tablet every morning before breakfast.",
      lineTotal: MOCK_MEDICATIONS[3].price,
    },
  ]);

  // ─── State: Modals & Overrides ──────────────────────────────────────────
  const [activeBatchModalProduct, setActiveBatchModalProduct] = useState<MedicationProduct | null>(null);
  const [activeBatchModalCartId, setActiveBatchModalCartId] = useState<string | null>(null);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [pharmacistOverride, setPharmacistOverride] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<"RECEIPT" | "LABEL">("RECEIPT");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "INSURANCE" | "MOBILE">("CARD");
  const [checkoutSuccessToast, setCheckoutSuccessToast] = useState(false);

  // ─── Real-Time Clinical Safety Evaluation ───────────────────────────────
  const clinicalWarnings: ClinicalWarning[] = useMemo(() => {
    return evaluateClinicalSafety(cartItems, selectedPatient);
  }, [cartItems, selectedPatient]);

  const highSeverityCount = clinicalWarnings.filter((w) => w.severity === "HIGH").length;
  const mediumSeverityCount = clinicalWarnings.filter((w) => w.severity === "MEDIUM").length;
  const isCartSafe = clinicalWarnings.length === 0;

  // Reset override if cart becomes safe or changes drastically
  useEffect(() => {
    if (isCartSafe) setPharmacistOverride(false);
  }, [isCartSafe]);

  // ─── Filtered Medications Catalog ───────────────────────────────────────
  const filteredMedications = useMemo(() => {
    const q = productSearchQuery.toLowerCase().trim();
    return MOCK_MEDICATIONS.filter((med) => {
      const matchesCategory = selectedCategory === "ALL" || med.category === selectedCategory;
      const matchesSearch =
        !q ||
        med.name.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        med.sku.toLowerCase().includes(q) ||
        med.barcode.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [productSearchQuery, selectedCategory]);

  // ─── Filtered Patients List ─────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const q = patientSearchQuery.toLowerCase().trim();
    if (!q) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.email.toLowerCase().includes(q)
    );
  }, [patientSearchQuery]);

  // ─── Cart Calculations ──────────────────────────────────────────────────
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cartItems]);

  const cartTax = cartSubtotal * 0.05; // 5% tax
  const cartTotal = cartSubtotal + cartTax;

  // ─── Handlers: Cart Management ──────────────────────────────────────────
  const addToCart = (product: MedicationProduct, customBatch?: InventoryBatch) => {
    // FEFO: Auto-select recommended batch (first one with isRecommended or sorted by earliest expiry)
    const batchToUse =
      customBatch ||
      product.batches.find((b) => b.isRecommended) ||
      [...product.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];

    const existingIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && item.selectedBatch.id === batchToUse.id
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].lineTotal = Number(
        (newQty * updated[existingIndex].unitPrice * (1 - updated[existingIndex].discount / 100)).toFixed(2)
      );
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        selectedBatch: batchToUse,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        dosageInstructions: product.requiresPrescription ? "As directed by physician." : "",
        lineTotal: product.price,
      };
      setCartItems((prev) => [...prev, newItem]);
    }

    // Clear search if barcode or quick add
    setProductSearchQuery("");
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== cartId) return item;
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            lineTotal: Number((newQty * item.unitPrice * (1 - item.discount / 100)).toFixed(2)),
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartId));
  };

  const updateDosageInstruction = (cartId: string, text: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.id === cartId ? { ...i, dosageInstructions: text } : i))
    );
  };

  const handleBatchSwitch = (batch: InventoryBatch) => {
    if (!activeBatchModalProduct) return;
    if (activeBatchModalCartId) {
      // Switch batch for an existing cart item
      setCartItems((prev) =>
        prev.map((i) =>
          i.id === activeBatchModalCartId
            ? { ...i, selectedBatch: batch, unitPrice: batch.sellingPrice, lineTotal: Number((i.quantity * batch.sellingPrice * (1 - i.discount / 100)).toFixed(2)) }
            : i
        )
      );
    } else {
      // Add new item with this specific batch
      addToCart(activeBatchModalProduct, batch);
    }
    setActiveBatchModalProduct(null);
    setActiveBatchModalCartId(null);
  };

  const handleCompleteSale = () => {
    setShowCheckoutModal(false);
    setCartItems([]);
    setPharmacistOverride(false);
    setCheckoutSuccessToast(true);
    setTimeout(() => setCheckoutSuccessToast(false), 5000);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── RENDER ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* ─── HEADER BAR ───────────────────────────────────────────────────── */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <HeartPulse className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              PharmaCare <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ml-2">FEFO POS v4.2</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Enterprise Dispensing & Clinical Interaction Engine</p>
          </div>
        </div>

        {/* Cashier & Station Shortcuts */}
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" /> STATION 04</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">F1: New Sale</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">F9: Checkout</span>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-sm">
              PH
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">Pharm. Sarah Jenkins</p>
              <p className="text-[10px] text-emerald-400 font-mono font-medium">LIC: #PH-98234-CA</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── SUCCESS TOAST ────────────────────────────────────────────────── */}
      {checkoutSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 flex items-center space-x-4 border border-emerald-400/50 animate-bounce">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-base">Dispensing Transaction Complete!</h4>
            <p className="text-xs text-emerald-100">FEFO stock deducted in MongoDB. Receipt & Rx labels generated.</p>
          </div>
        </div>
      )}

      {/* ─── MAIN TWO-COLUMN COUNTER WORKSPACE ────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1800px] mx-auto w-full">
        {/* ════ LEFT COLUMN: PATIENT PROFILE & PRODUCT CATALOG (7 COLS) ════ */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* 1. PATIENT LOOKUP & SAFETY PROFILE PANEL */}
          <section className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm relative overflow-visible">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">Patient Safety Profile & Lookup</h2>
              </div>
              {selectedPatient ? (
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/20 transition"
                >
                  Clear (Walk-in Customer)
                </button>
              ) : (
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⚠️ No Patient Selected (Allergies Not Checked)
                </span>
              )}
            </div>

            {/* Patient Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search patient by Name or Phone (e.g., 'Eleanor' or '555-0192')..."
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  setIsPatientDropdownOpen(true);
                }}
                onFocus={() => setIsPatientDropdownOpen(true)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              
              {/* Autocomplete Dropdown */}
              {isPatientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
                  {filteredPatients.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setSelectedPatient(pat);
                        setIsPatientDropdownOpen(false);
                        setPatientSearchQuery("");
                      }}
                      className="p-3 hover:bg-indigo-600/20 cursor-pointer flex items-center justify-between transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-200">
                          {pat.firstName} {pat.lastName} <span className="text-xs text-slate-400 font-normal">({pat.gender})</span>
                        </p>
                        <p className="text-xs font-mono text-indigo-300">📞 {pat.phone} | 🛡️ {pat.insuranceProvider || "No Ins"}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {pat.allergies.length > 0 && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                            {pat.allergies.length} ALLERGIES
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                  {filteredPatients.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">No matching patients found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Patient Card */}
            {selectedPatient && (
              <div className="bg-gradient-to-br from-slate-950 to-slate-900/90 rounded-xl border border-slate-750 p-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow">
                      {selectedPatient.firstName[0]}
                      {selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                        <span className="ml-2 text-xs font-mono text-slate-400 font-normal">DOB: {selectedPatient.dateOfBirth}</span>
                      </h3>
                      <p className="text-xs text-indigo-300 font-mono">
                        📞 {selectedPatient.phone} • Policy: {selectedPatient.insurancePolicyNumber || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedPatient.activePrescriptions.length > 0 && (
                      <button
                        onClick={() => setShowPrescriptionModal(true)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-md transition flex items-center space-x-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Rx History ({selectedPatient.activePrescriptions.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Safety Badges: Allergies & Conditions */}
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Allergies */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mr-1 inline" /> Known Clinical Allergies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.allergies.length > 0 ? (
                        selectedPatient.allergies.map((all, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-md font-semibold border flex items-center space-x-1 ${
                              all.severity === "SEVERE"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            <span>⚠️ {all.substance} ({all.severity})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✓ No Documented Drug Allergies
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center">
                      <Activity className="w-3.5 h-3.5 text-indigo-400 mr-1 inline" /> Diagnosed Conditions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPatient.medicalConditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {cond}
                        </span>
                      ))}
                      {selectedPatient.medicalConditions.length === 0 && (
                        <span className="text-xs text-slate-500">None recorded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. PRODUCT CATALOG & FAST BARCODE SEARCH */}
          <section className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2">
                <Barcode className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">
                  Medication Catalog & Barcode Scanner
                </h2>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "PRESCRIPTION", "OTC", "CONTROLLED"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Barcode / Name Input Bar */}
            <div className="relative mb-5">
              <div className="absolute left-3.5 top-3.5 flex items-center space-x-2 pointer-events-none">
                <Barcode className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="text-slate-600">|</span>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan 13-digit barcode or type drug name (e.g., 'Warfarin', '890123...')"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredMedications.length > 0) {
                    addToCart(filteredMedications[0]);
                  }
                }}
                className="w-full bg-slate-950 border-2 border-slate-700/80 focus:border-emerald-500 rounded-xl pl-12 pr-24 py-3 text-base font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition shadow-inner"
              />
              <div className="absolute right-3 top-2.5 flex items-center space-x-1">
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                  ENTER ↵ to Add
                </span>
              </div>
            </div>

            {/* Medication Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[500px] pr-1">
              {filteredMedications.map((med) => {
                // Find FEFO recommended batch
                const fefoBatch = med.batches.find((b) => b.isRecommended) || med.batches[0];
                return (
                  <div
                    key={med.id}
                    className="bg-slate-950/80 rounded-xl border border-slate-800/80 hover:border-indigo-500/50 p-3.5 flex flex-col justify-between transition group hover:shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
                  >
                    {/* Category tag */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition flex items-center">
                          {med.name}{" "}
                          <span className="ml-1.5 text-xs text-slate-400 font-mono">({med.strength})</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono italic">{med.genericName}</p>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                          med.category === "PRESCRIPTION"
                            ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                            : med.category === "CONTROLLED"
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {med.category === "PRESCRIPTION" ? "Rx Only" : med.category}
                      </span>
                    </div>

                    {/* FEFO Batch Highlight Banner */}
                    <div className="bg-slate-900/90 rounded-lg p-2 mb-3 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                          <Sparkles className="w-3 h-3 mr-1 inline" /> FEFO RECOMMENDED:
                        </span>
                        <p className="font-mono text-slate-300 font-medium">
                          Batch #{fefoBatch.batchNumber}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-400 block">Exp: {fefoBatch.expiryDate}</span>
                        <span className={`text-[10px] font-bold ${fefoBatch.quantity < 20 ? "text-amber-400" : "text-slate-300"}`}>
                          Qty: {fefoBatch.quantity} units
                        </span>
                      </div>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                      <span className="text-base font-extrabold text-emerald-400 font-mono">
                        ${med.price.toFixed(2)}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        {med.batches.length > 1 && (
                          <button
                            onClick={() => {
                              setActiveBatchModalProduct(med);
                              setActiveBatchModalCartId(null);
                            }}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition flex items-center space-x-1"
                            title="Select a specific batch"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Batch ({med.batches.length})</span>
                          </button>
                        )}

                        <button
                          onClick={() => addToCart(med)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Rx</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ════ RIGHT COLUMN: ACTIVE DISPENSING CART & SAFETY ENGINE (5 COLS) ════ */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <section className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-sm flex-1 flex flex-col justify-between">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-sm uppercase tracking-wider text-slate-200">
                    Active Dispensing Cart ({cartItems.length})
                  </h2>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cart</span>
                  </button>
                )}
              </div>

              {/* ─── 3. LIVE INTERACTION WARNING BADGE ───────────────────── */}
              <div className="my-4">
                {isCartSafe ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-3 text-emerald-300 shadow-sm">
                    <ShieldCheck className="w-6 h-6 flex-shrink-0 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider">Clinical Safety Check: PASSED</h4>
                      <p className="text-xs text-emerald-200/80">
                        0 Drug-Drug interactions or patient allergy conflicts detected. Safe to dispense.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-xl p-3.5 border shadow-lg transition ${
                      highSeverityCount > 0
                        ? "bg-rose-950/80 border-rose-500/60 shadow-rose-900/30 animate-pulse"
                        : "bg-amber-950/80 border-amber-500/60 shadow-amber-900/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <ShieldAlert
                          className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                            highSeverityCount > 0 ? "text-rose-400" : "text-amber-400"
                          }`}
                        />
                        <div>
                          <h4
                            className={`font-extrabold text-xs uppercase tracking-wider flex items-center ${
                              highSeverityCount > 0 ? "text-rose-300" : "text-amber-300"
                            }`}
                          >
                            ⚠️ CLINICAL SAFETY ALERT ({clinicalWarnings.length} ISSUE{clinicalWarnings.length > 1 ? "S" : ""})
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">
                            Found <strong className="text-white">{highSeverityCount} HIGH</strong> &{" "}
                            <strong className="text-white">{mediumSeverityCount} MODERATE</strong> clinical conflicts!
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowWarningsModal(true)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${
                          highSeverityCount > 0
                            ? "bg-rose-600 text-white border-rose-400 hover:bg-rose-500"
                            : "bg-amber-600 text-white border-amber-400 hover:bg-amber-500"
                        }`}
                      >
                        View Details
                      </button>
                    </div>

                    {/* Quick preview of top warning */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 text-xs font-mono text-slate-200 flex items-center justify-between">
                      <span className="truncate max-w-[280px]">🔴 {clinicalWarnings[0].title}</span>
                      <span className="text-[10px] underline cursor-pointer" onClick={() => setShowWarningsModal(true)}>
                        Read full monograph
                      </span>
                    </div>

                    {/* Pharmacist Override Checkbox */}
                    {highSeverityCount > 0 && (
                      <div className="mt-3 pt-2 border-t border-rose-500/30 flex items-center space-x-2 bg-rose-900/40 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          id="override-check"
                          checked={pharmacistOverride}
                          onChange={(e) => setPharmacistOverride(e.target.checked)}
                          className="w-4 h-4 rounded border-rose-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <label htmlFor="override-check" className="text-xs text-rose-200 font-bold cursor-pointer select-none">
                          I acknowledge severe risks & apply Pharmacist Clinical Override (#PH-98234)
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {cartItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 flex flex-col items-center">
                    <ShoppingCart className="w-12 h-12 mb-3 stroke-1 text-slate-700" />
                    <p className="text-sm font-medium">Cart is currently empty.</p>
                    <p className="text-xs text-slate-600 mt-1">Scan a barcode or select medication from the catalog.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 space-y-2.5 relative group hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-100 flex items-center">
                            {item.product.name}{" "}
                            <span className="ml-1.5 text-xs text-slate-400 font-mono">({item.product.strength})</span>
                          </h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                              BATCH: #{item.selectedBatch.batchNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Exp: {item.selectedBatch.expiryDate}
                            </span>
                            {item.product.batches.length > 1 && (
                              <button
                                onClick={() => {
                                  setActiveBatchModalProduct(item.product);
                                  setActiveBatchModalCartId(item.id);
                                }}
                                className="text-[10px] text-indigo-400 underline hover:text-indigo-300 font-medium"
                              >
                                Change Batch
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-base font-extrabold font-mono text-emerald-400">
                            ${item.lineTotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeCartItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dosage Instructions Input */}
                      {item.product.requiresPrescription && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter Rx dosage instructions (e.g., 'Take 1 tab daily with food')..."
                            value={item.dosageInstructions || ""}
                            onChange={(e) => updateDosageInstruction(item.id, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                      )}

                      {/* Quantity Stepper & Discount */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-medium">Qty:</span>
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 font-mono font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">(${item.unitPrice}/ea)</span>
                        </div>

                        {/* Discount badge */}
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span className="text-[11px] text-slate-400 font-mono">0% Disc</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ─── TOTALS & CHECKOUT FOOTER ──────────────────────────────── */}
            <div className="pt-4 border-t border-slate-800 mt-4 space-y-4">
              {/* Financial Breakdown */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span className="text-slate-200 font-bold">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax (5%):</span>
                  <span className="text-slate-200 font-bold">${cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                  <span className="text-sm font-sans uppercase tracking-wider text-indigo-300">Total Amount Due:</span>
                  <span className="text-emerald-400 text-lg">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "CARD", label: "Card", icon: CreditCard },
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "INSURANCE", label: "Insurance", icon: ShieldCheck },
                  { id: "MOBILE", label: "Mobile", icon: Smartphone },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-bold transition ${
                        paymentMethod === pm.id
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Checkout / Print Preview Button */}
              <button
                disabled={cartItems.length === 0 || (highSeverityCount > 0 && !pharmacistOverride)}
                onClick={() => setShowCheckoutModal(true)}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition ${
                  cartItems.length === 0 || (highSeverityCount > 0 && !pharmacistOverride)
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 border border-emerald-400/40 transform hover:-translate-y-0.5"
                }`}
              >
                <Printer className="w-5 h-5" />
                <span>
                  {highSeverityCount > 0 && !pharmacistOverride
                    ? "⚠️ OVERRIDE REQUIRED TO DISPENSE"
                    : "Complete Sale / Preview Rx Label"}
                </span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 1: REAL-TIME FEFO BATCH SELECTION ─────────────────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {activeBatchModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setActiveBatchModalProduct(null);
                setActiveBatchModalCartId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Select Inventory Batch (FEFO Sorted)</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {activeBatchModalProduct.name} ({activeBatchModalProduct.strength}) • SKU: {activeBatchModalProduct.sku}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              💡 <strong className="text-emerald-400 font-mono">First-Expired, First-Out (FEFO) Policy:</strong> The pharmacy algorithm automatically recommends opening the batch nearest to expiration first to minimize stock spoilage.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {[...activeBatchModalProduct.batches]
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                .map((batch, idx) => {
                  const isRecommended = batch.isRecommended || idx === 0;
                  return (
                    <div
                      key={batch.id}
                      onClick={() => handleBatchSwitch(batch)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isRecommended
                          ? "bg-emerald-950/40 border-emerald-500/60 hover:bg-emerald-900/40 shadow-md shadow-emerald-900/20"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-white">
                            BATCH #{batch.batchNumber}
                          </span>
                          {isRecommended && (
                            <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow-sm flex items-center">
                              ⭐ RECOMMENDED (FEFO)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          Expiry Date: <strong className="text-slate-200">{batch.expiryDate}</strong>
                        </p>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-base font-extrabold text-emerald-400 block">
                          ${batch.sellingPrice.toFixed(2)}
                        </span>
                        <span className={`text-xs font-bold ${batch.quantity < 20 ? "text-amber-400" : "text-slate-400"}`}>
                          {batch.quantity} in stock
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setActiveBatchModalProduct(null);
                  setActiveBatchModalCartId(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 2: CLINICAL INTERACTION WARNINGS DETAIL ───────────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showWarningsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Clinical Pharmacology Safety Monograph</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Real-time Drug-Drug Interactions & Patient Allergy Evaluation
                  </p>
                </div>
              </div>
              <button onClick={() => setShowWarningsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {clinicalWarnings.map((warn) => (
                <div
                  key={warn.id}
                  className={`p-4 rounded-xl border ${
                    warn.severity === "HIGH"
                      ? "bg-rose-950/50 border-rose-500/50 text-rose-100"
                      : "bg-amber-950/50 border-amber-500/50 text-amber-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        warn.severity === "HIGH" ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"
                      }`}
                    >
                      {warn.severity} SEVERITY ({warn.type === "DRUG_INTERACTION" ? "Drug Interaction" : "Allergy Conflict"})
                    </span>
                    <span className="text-xs font-mono opacity-80">Source: NLM RxNav / Clinical KB</span>
                  </div>
                  <h4 className="font-extrabold text-sm mb-1.5">{warn.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{warn.description}</p>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center space-x-2 text-xs font-mono">
                    <span className="opacity-75">Involved Agents:</span>
                    {warn.relatedItems.map((item, idx) => (
                      <span key={idx} className="bg-black/30 px-2 py-0.5 rounded border border-white/10 font-bold">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {highSeverityCount > 0 ? (
                  <span className="text-rose-400 font-bold">⚠️ Requires Pharmacist clinical override checkbox to proceed.</span>
                ) : (
                  <span>Moderate warnings do not block checkout.</span>
                )}
              </div>
              <button
                onClick={() => setShowWarningsModal(false)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition"
              >
                Close Monograph
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 3: PATIENT PRESCRIPTION HISTORY ───────────────────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-lg text-white">Active Prescription Records</h3>
                  <p className="text-xs text-slate-400">
                    Patient: {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.phone})
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 max-h-96 overflow-y-auto pr-1">
              {selectedPatient.activePrescriptions.map((rx, idx) => (
                <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-850">
                    <span className="font-mono font-bold text-sm text-indigo-400">{rx.prescriptionNumber}</span>
                    <span className="text-xs text-slate-400 font-mono">Date: {rx.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3 font-medium">👨‍⚕️ Prescriber: {rx.doctor}</p>

                  <div className="space-y-2">
                    {rx.items.map((item, iIdx) => (
                      <div key={iIdx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-white">{item.productName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.dosage} • {item.frequency}</p>
                        </div>
                        <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          ─── MODAL 4: RECEIPT & RX LABEL PREVIEW BEFORE CHECKOUT ─────────────────
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            
            {/* Modal Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <Printer className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-lg text-white">Dispensing Verification & Print Preview</h3>
                  <p className="text-xs text-slate-400 font-mono">Verify FEFO deduction batches and prescription auxiliary labels</p>
                </div>
              </div>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPreviewTab("RECEIPT")}
                  className={`text-xs px-4 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                    previewTab === "RECEIPT"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Retail Invoice</span>
                </button>
                <button
                  onClick={() => setPreviewTab("LABEL")}
                  className={`text-xs px-4 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
                    previewTab === "LABEL"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Rx Container Labels ({cartItems.filter((i) => i.product.requiresPrescription).length})</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Preview Area */}
            <div className="py-6 flex-1 overflow-y-auto px-2">
              
              {/* TAB 1: RETAIL TAX INVOICE PREVIEW */}
              {previewTab === "RECEIPT" && (
                <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl font-mono max-w-xl mx-auto border border-slate-300">
                  {/* Invoice Branding Header */}
                  <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                    <h2 className="font-extrabold text-xl tracking-tight uppercase">PharmaCare Health Systems</h2>
                    <p className="text-xs text-slate-600">1024 Medical Plaza Blvd, Suite 400, CA 94102</p>
                    <p className="text-xs text-slate-600">Tel: (800) 555-0199 • DEA: #PH-98234-CA</p>
                    <div className="mt-2 text-xs font-bold bg-slate-100 py-1 rounded inline-block px-3">
                      OFFICIAL RETAIL TAX INVOICE
                    </div>
                  </div>

                  {/* Transaction Metadata */}
                  <div className="text-xs space-y-1 pb-4 border-b border-slate-200 mb-4">
                    <div className="flex justify-between">
                      <span>Invoice #:</span>
                      <span className="font-bold">INV-20260727-0482</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date / Time:</span>
                      <span>2026-07-27 17:15:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispensed By:</span>
                      <span>Pharm. Sarah Jenkins (#PH-98234)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patient / Customer:</span>
                      <span className="font-bold">{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Walk-in Customer"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="font-bold uppercase">{paymentMethod}</span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <table className="w-full text-xs mb-4">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-left">
                        <th className="pb-2">ITEM DESCRIPTION</th>
                        <th className="pb-2 text-center">QTY</th>
                        <th className="pb-2 text-right">PRICE</th>
                        <th className="pb-2 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 pr-2">
                            <p className="font-bold text-slate-800">{item.product.name} {item.product.strength}</p>
                            <p className="text-[10px] text-slate-500">
                              Batch: #{item.selectedBatch.batchNumber} (Exp: {item.selectedBatch.expiryDate})
                            </p>
                          </td>
                          <td className="py-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold">${item.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1 text-xs mb-6">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TAX (5.0%):</span>
                      <span>${cartTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>TOTAL AMOUNT DUE:</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Barcode Footer */}
                  <div className="text-center pt-2">
                    <div className="h-10 bg-slate-800 rounded flex items-center justify-center text-white font-mono tracking-[0.3em] text-xs font-bold mb-1">
                      ||||| | |||| ||| ||||| || |||
                    </div>
                    <p className="text-[10px] text-slate-500">Thank you for trusting PharmaCare Health Systems!</p>
                  </div>
                </div>
              )}

              {/* TAB 2: PRESCRIPTION CONTAINER LABELS PREVIEW */}
              {previewTab === "LABEL" && (
                <div className="space-y-6 max-w-xl mx-auto">
                  {cartItems.filter((i) => i.product.requiresPrescription).length === 0 ? (
                    <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                      No prescription-only (Rx) medications in cart. Container labels are only generated for Rx items.
                    </div>
                  ) : (
                    cartItems
                      .filter((i) => i.product.requiresPrescription)
                      .map((item, idx) => (
                        <div
                          key={item.id}
                          className="bg-amber-50 text-slate-900 p-6 rounded-2xl shadow-xl border-4 border-amber-300 font-sans relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            CONTAINER LABEL #{idx + 1}
                          </div>

                          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-3">
                            <div>
                              <h4 className="font-extrabold text-base uppercase text-slate-900">PHARMACARE DISPENSARY</h4>
                              <p className="text-xs text-slate-700 font-mono">Rx#: RX-20260727-{9000 + idx} • Date: 2026-07-27</p>
                            </div>
                            <div className="text-right font-mono text-xs font-bold">
                              <p>Keep out of reach of children</p>
                            </div>
                          </div>

                          {/* Patient Name */}
                          <div className="mb-3 bg-white p-2.5 rounded-lg border border-amber-200">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">PATIENT NAME:</span>
                            <p className="font-extrabold text-lg text-slate-900">
                              {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "WALK-IN PATIENT"}
                            </p>
                          </div>

                          {/* Drug & Instructions */}
                          <div className="mb-4">
                            <h3 className="font-extrabold text-xl text-indigo-900 font-mono">
                              {item.product.name} {item.product.strength}
                            </h3>
                            <p className="text-xs italic text-slate-600 mb-2">({item.product.genericName})</p>
                            
                            <div className="bg-amber-100/80 p-3 rounded-xl border border-amber-300">
                              <span className="text-[10px] uppercase font-bold text-amber-900 block mb-0.5">DOSAGE INSTRUCTIONS:</span>
                              <p className="text-sm font-bold text-slate-900 leading-snug">
                                {item.dosageInstructions || "Take exactly as directed by healthcare prescriber."}
                              </p>
                            </div>
                          </div>

                          {/* Auxiliary Warnings & Batch Info */}
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-300">
                            <div>
                              <span className="text-slate-500 block text-[10px]">DISPENSED BATCH:</span>
                              <span className="font-bold text-slate-900">#{item.selectedBatch.batchNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">DO NOT USE AFTER:</span>
                              <span className="font-bold text-rose-700">{item.selectedBatch.expiryDate} (FEFO)</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">QTY DISPENSED:</span>
                              <span className="font-bold text-slate-900">{item.quantity} UNITS</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">REFILLS REMAINING:</span>
                              <span className="font-bold text-slate-900">2 REFILLS</span>
                            </div>
                          </div>

                          {/* Warning Sticker Banner */}
                          <div className="mt-4 bg-rose-600 text-white p-2 rounded text-center text-xs font-bold uppercase tracking-wide">
                            ⚠️ CAUTION: FEDERAL LAW PROHIBITS TRANSFER OF THIS DRUG TO ANY PERSON OTHER THAN PATIENT.
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Return to Cart
              </button>

              <button
                onClick={handleCompleteSale}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Transaction & Print ({previewTab === "RECEIPT" ? "Invoice" : "Labels"})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSScreen;
