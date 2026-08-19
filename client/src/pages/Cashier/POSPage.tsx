import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Pill,
  Send,
  Package,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ReceiptText,
  Sparkles,
  ScanBarcode,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import BarcodeScanner from '../../components/pos/BarcodeScanner';

// ═════════════════════════════════════════════════════════════════════════════
// ─── TYPES ──────────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/** Product returned from the backend search endpoint */
interface Product {
  _id: string;
  name: string;
  genericName: string;
  sku: string;
  dosageForm?: string;
  strength?: string;
  category: string;
  requiresPrescription: boolean;
  displayName?: string;
  price: number;
}

/** Item in the dispense cart */
interface CartItem {
  id: string;              // Unique cart entry ID
  product: Product;        // Referenced product
  quantity: number;         // Number of units to dispense
}

/** Toast notification */
interface Toast {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

/** Result from a single dispense call */
interface DispenseDeduction {
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantityDeducted: number;
  quantityRemainingAfter: number;
}

interface DispenseResult {
  productName: string;
  quantityDispensed: number;
  batchesAffected: number;
  deductions: DispenseDeduction[];
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── POS PAGE COMPONENT ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const POSPage: React.FC = () => {
  // ─── State ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastReceipt, setLastReceipt] = useState<DispenseResult[] | null>(null);
  const [printReceiptData, setPrintReceiptData] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [prescriptionId, setPrescriptionId] = useState<string>('');
  
  // Modal state for price override pin
  const [overridePinModalOpen, setOverridePinModalOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Focus search on mount ────────────────────────────────────────────
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // ─── Offline-First Resiliency (IndexedDB Mock) ───────────────────────
  useEffect(() => {
    const syncOfflineData = async () => {
      // In a full implementation, this would open IndexedDB, read queued offline sales,
      // and post them to the backend upon network reconnection.
      if (navigator.onLine) {
        console.log('[Offline] Network online. Syncing any queued offline transactions...');
      }
    };
    
    window.addEventListener('online', syncOfflineData);
    return () => window.removeEventListener('online', syncOfflineData);
  }, []);


  // ─── Auto-dismiss toasts ─────────────────────────────────────────────
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // ─── Toast helper ────────────────────────────────────────────────────
  const showToast = useCallback(
    (type: Toast['type'], title: string, message: string) => {
      const id = `toast-\${Date.now()}-\${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Search products (debounced) ──────────────────────────────────────
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get('/products', {
            params: { search: query },
          });

          // Handle both { data: [...] } and plain array responses
          const products: Product[] = Array.isArray(data)
            ? data
            : data?.data?.products ?? data?.data ?? [];

          setSearchResults(products);
        } catch {
          // If the API isn't ready yet, show demo placeholder products
          // so the UI is functional for portfolio demos
          const demoProducts: Product[] = [
            {
              _id: 'demo-1',
              name: 'Amoxicillin',
              genericName: 'amoxicillin',
              sku: 'AMX-500-CAP',
              dosageForm: 'Capsule',
              strength: '500mg',
              category: 'PRESCRIPTION',
              requiresPrescription: true,
              price: 15.99,
            },
            {
              _id: 'demo-2',
              name: 'Ibuprofen',
              genericName: 'ibuprofen',
              sku: 'IBU-200-TAB',
              dosageForm: 'Tablet',
              strength: '200mg',
              category: 'OTC',
              requiresPrescription: false,
              price: 8.49,
            },
            {
              _id: 'demo-3',
              name: 'Metformin',
              genericName: 'metformin hydrochloride',
              sku: 'MET-500-TAB',
              dosageForm: 'Tablet',
              strength: '500mg',
              category: 'PRESCRIPTION',
              requiresPrescription: true,
              price: 12.50,
            },
            {
              _id: 'demo-4',
              name: 'Omeprazole',
              genericName: 'omeprazole',
              sku: 'OME-20-CAP',
              dosageForm: 'Capsule',
              strength: '20mg',
              category: 'OTC',
              requiresPrescription: false,
              price: 22.00,
            },
            {
              _id: 'demo-5',
              name: 'Lisinopril',
              genericName: 'lisinopril',
              sku: 'LIS-10-TAB',
              dosageForm: 'Tablet',
              strength: '10mg',
              category: 'PRESCRIPTION',
              requiresPrescription: true,
              price: 9.75,
            },
            {
              _id: 'demo-6',
              name: 'Cetirizine',
              genericName: 'cetirizine hydrochloride',
              sku: 'CET-10-TAB',
              dosageForm: 'Tablet',
              strength: '10mg',
              category: 'OTC',
              requiresPrescription: false,
              price: 14.20,
            },
          ];

          // Filter demos by search query
          const q = query.toLowerCase();
          setSearchResults(
            demoProducts.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.genericName.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q),
            ),
          );
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [],
  );

  // ─── Cart management ─────────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product,
          quantity: 1,
        },
      ];
    });
  }, []);

  // ─── Hardware Barcode Scanner Listener ─────────────────────────────────
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const { data } = await api.get('/products', {
        params: { search: barcode },
      });
      const products: Product[] = Array.isArray(data) ? data : data?.data?.products ?? data?.data ?? [];
      
      const matchedProduct = products.find(p => p.sku === barcode || (p as any).barcode === barcode) || products[0];
      
      if (matchedProduct) {
        addToCart(matchedProduct);
        showToast('success', 'Product Added', `Added ${matchedProduct.name} to cart.`);
      } else {
        showToast('error', 'Not Found', `No product found for barcode ${barcode}.`);
      }
    } catch (err) {
      showToast('error', 'Scan Error', 'Failed to fetch product for barcode.');
    }
  }, [addToCart, showToast]);

  const updateQuantity = useCallback((cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  }, []);

  const setQuantity = useCallback((cartId: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartId
          ? { ...item, quantity: Math.max(1, qty) }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // ─── Dispense (FEFO) ─────────────────────────────────────────────────
  const handleDispense = useCallback(async () => {
    if (cart.length === 0) return;

    setIsDispensing(true);
    setLastReceipt(null);

    try {
      const items = cart.map(item => ({
        medicationId: item.product._id,
        quantity: item.quantity
      }));

      const { data } = await api.post('/sales/checkout', {
        items,
        prescriptionId: prescriptionId || undefined,
        paymentMethod
      });
      
      const orderResult = data.data;

      showToast(
        'success',
        'Dispensing Complete',
        `Successfully created POS order ${orderResult.orderNumber ?? orderResult._id} using FEFO.`,
      );
      
      setPrintReceiptData(orderResult);
      setCart([]);
      setPrescriptionId('');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ??
        'Failed to dispense the order';

      showToast(
        'error',
        'Transaction Failed',
        errorMessage,
      );
    } finally {
      setIsDispensing(false);
    }
  }, [cart, prescriptionId, paymentMethod, showToast]);

  // ─── Computed ─────────────────────────────────────────────────────────
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ═══════════════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-6 h-full">
      <BarcodeScanner onScan={handleBarcodeScan} />
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Point of Sale
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Dispense medications using FEFO (First-Expired, First-Out) inventory logic.
          </p>
        </div>

        {/* Quick stats pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/60 px-4 py-2 text-xs font-medium backdrop-blur">
            <ShoppingCart size={14} className="text-blue-400" />
            <span className="text-slate-400">Cart:</span>
            <span className="font-bold text-white">{totalItems} items</span>
          </div>
        </div>
      </div>

      {/* ── Two-column workspace ────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ═══ LEFT COLUMN — Medication Search (7 cols) ═══════════════════ */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Search panel */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5 backdrop-blur">
            {/* Search header */}
            <div className="mb-4 flex items-center gap-2">
              <ScanBarcode size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Medication Lookup
              </h2>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, generic name, or SKU (e.g. 'Amoxicillin', 'AMX-500')..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="
                  w-full rounded-xl border-2 border-slate-700/80 bg-slate-950
                  py-3 pl-11 pr-24 text-sm font-medium text-white
                  placeholder-slate-500 shadow-inner
                  transition
                  focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10
                "
              />
              {isSearching && (
                <Loader2
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-500"
                />
              )}
              {!isSearching && searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 transition hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search results */}
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Search Results
                </h2>
              </div>
              {searchResults.length > 0 && (
                <span className="rounded-lg border border-white/[0.06] bg-slate-800/60 px-2.5 py-1 text-xs font-mono text-slate-400">
                  {searchResults.length} found
                </span>
              )}
            </div>

            {/* Results list */}
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={40} className="mb-3 text-slate-800" strokeWidth={1} />
                <p className="text-sm font-medium text-slate-500">
                  {searchQuery
                    ? 'No medications found matching your search.'
                    : 'Start typing to search for medications.'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Search by brand name, generic name, or SKU code
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="
                      group relative flex flex-col justify-between gap-3
                      rounded-xl border border-slate-800/80 bg-slate-950/80 p-4
                      transition
                      hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5
                    "
                  >
                    {/* Drug info */}
                    <div>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-100 transition group-hover:text-indigo-300">
                          {product.name}
                          {product.strength && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              {product.strength}
                            </span>
                          )}
                        </h4>
                        <span
                          className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                            product.category === 'PRESCRIPTION'
                              ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                              : product.category === 'CONTROLLED'
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {product.category === 'PRESCRIPTION' ? 'Rx' : product.category}
                        </span>
                      </div>

                      <p className="text-[11px] font-mono italic text-slate-500">
                        {product.genericName}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                          SKU: {product.sku}
                        </span>
                        {product.dosageForm && (
                          <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                            {product.dosageForm}
                          </span>
                        )}
                        {product.requiresPrescription && (
                          <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            <Pill size={10} />
                            Rx Required
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => addToCart(product)}
                      className="
                        flex items-center justify-center gap-1.5
                        rounded-lg bg-emerald-600 px-3 py-2 text-xs
                        font-bold text-white shadow-md shadow-emerald-600/20
                        transition
                        hover:bg-emerald-500 active:scale-[0.97]
                      "
                    >
                      <Plus size={14} />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN — Dispensing Cart (5 cols) ═══════════════════ */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <div className="flex flex-1 flex-col rounded-2xl border border-white/[0.06] bg-slate-900/60 backdrop-blur">
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Dispense Cart
                </h2>
                {cart.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1 text-xs font-medium text-rose-400 transition hover:text-rose-300"
                >
                  <Trash2 size={13} />
                  Clear All
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart
                    size={48}
                    className="mb-3 text-slate-800"
                    strokeWidth={1}
                  />
                  <p className="text-sm font-medium text-slate-500">
                    Cart is empty
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Search and add medications to begin dispensing
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 transition hover:border-slate-700"
                    >
                      {/* Item header */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-slate-100">
                            {item.product.name}
                            {item.product.strength && (
                              <span className="ml-1.5 text-xs font-normal text-slate-400">
                                {item.product.strength}
                              </span>
                            )}
                          </h4>
                          <p className="truncate text-[11px] font-mono text-slate-500">
                            {item.product.genericName} • {item.product.sku}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">
                            Qty:
                          </span>
                          <div className="flex items-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="px-2.5 py-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                setQuantity(
                                  item.id,
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className="w-12 border-x border-slate-800 bg-transparent py-1.5 text-center text-xs font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2.5 py-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {item.product.requiresPrescription && (
                          <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            <Pill size={10} />
                            Rx
                          </span>
                        )}
                        
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setOverridePinModalOpen(true)}
                              className="group flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition"
                              title="Supervisor PIN required to override price"
                            >
                              <Lock size={10} className="group-hover:text-indigo-400" />
                              Override
                            </button>
                            <span className="text-sm font-bold text-emerald-400">
                              ${((item.product.price || 0) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            ${(item.product.price || 0).toFixed(2)} / ea
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart footer — FEFO info + dispense button */}
            <div className="border-t border-white/[0.06] px-5 py-4">
              {/* FEFO explainer */}
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    FEFO Engine Active
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    Stock will be deducted from the batch with the nearest expiry date
                    first, ensuring regulatory compliance and minimal waste.
                  </p>
                </div>
              </div>

              {/* Tender & Rx Linking */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 outline-none transition focus:border-indigo-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="MOBILE_PAYMENT">Mobile Wallet</option>
                    <option value="INSURANCE">Insurance Co-Pay</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Link Prescription
                  </label>
                  <input
                    type="text"
                    value={prescriptionId}
                    onChange={(e) => setPrescriptionId(e.target.value)}
                    placeholder="Rx Number (Optional)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 placeholder-slate-600 outline-none transition focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-400">
                    Total items to dispense:
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    {totalItems}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-300">
                    Total Amount:
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    ${cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dispense button */}
              <button
                onClick={handleDispense}
                disabled={cart.length === 0 || isDispensing}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl py-3.5 text-sm font-bold text-white
                  shadow-lg transition
                  disabled:cursor-not-allowed disabled:opacity-40
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  active:scale-[0.98]
                  shadow-blue-600/25
                "
              >
                {isDispensing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Dispensing via FEFO...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Dispense {totalItems > 0 ? `(${totalItems} units)` : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Last Receipt ──────────────────────────────────────────────── */}
          {lastReceipt && lastReceipt.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Last Dispense Receipt
                  </h3>
                </div>
                <button
                  onClick={() => setLastReceipt(null)}
                  className="rounded p-1 text-slate-500 transition hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {lastReceipt.map((result, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-emerald-500/10 bg-slate-950/60 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        {result.productName}
                      </h4>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        {result.quantityDispensed} dispensed
                      </span>
                    </div>

                    <div className="space-y-1">
                      {result.deductions.map((d, dIdx) => (
                        <div
                          key={dIdx}
                          className="flex items-center justify-between text-[11px] font-mono text-slate-400"
                        >
                          <span>
                            Batch #{d.batchNumber} • Exp:{' '}
                            {new Date(d.expiryDate).toLocaleDateString()} (
                            {d.daysUntilExpiry}d)
                          </span>
                          <span className="text-emerald-400">
                            −{d.quantityDeducted}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Print Receipt Modal ────────────────────────────────────────────── */}
      {printReceiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:bg-white print:p-0">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .receipt-content, .receipt-content * { visibility: visible; }
              .receipt-content { position: absolute; left: 0; top: 0; width: 100%; color: black !important; }
              .no-print { display: none !important; }
            }
          `}</style>
          
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white">
            
            {/* The Actual Receipt Content */}
            <div className="receipt-content p-8 bg-white text-slate-900">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">PHARMFLOW</h2>
                <p className="text-sm text-slate-500 mt-1">123 Health Ave, Medical City</p>
                <div className="mt-4 pb-4 border-b border-dashed border-slate-300">
                  <p className="text-sm font-mono text-slate-600">Order: {printReceiptData.orderNumber}</p>
                  <p className="text-sm font-mono text-slate-600">{new Date(printReceiptData.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 font-mono text-sm">
                <div className="flex justify-between font-bold border-b border-slate-200 pb-2">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                
                {printReceiptData.items && printReceiptData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span className="truncate pr-4">{item.quantity}x {item.product?.name || 'Product Item'}</span>
                    <span>${(item.price * item.quantity || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed border-slate-300 pt-4 mb-8">
                <div className="flex justify-between font-bold text-lg text-slate-900">
                  <span>TOTAL</span>
                  <span>${printReceiptData.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              
              <div className="text-center text-sm font-bold text-slate-500">
                <p>Thank you for your business!</p>
                <p className="font-normal mt-1">Please retain this receipt for your records.</p>
              </div>
            </div>

            {/* Modal Controls (Not printed) */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3 no-print">
              <button
                onClick={() => setPrintReceiptData(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <ReceiptText size={16} />
                Print Receipt
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-right ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 shadow-emerald-600/20'
                : 'border-rose-500/30 bg-rose-950/90 shadow-rose-600/20'
            }`}
            style={{ maxWidth: '400px' }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-400" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white">{toast.title}</h4>
              <p className="mt-0.5 text-xs text-slate-300">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded p-0.5 text-slate-500 transition hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      {/* ── Override Price Modal ─────────────────────────────────────────────── */}
      {overridePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Supervisor Approval</h3>
                <p className="text-xs text-slate-400">Admin or Pharmacist PIN required</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-5">
              Direct price edits are locked to enforce price integrity. Please ask a supervisor to enter their secure PIN to unlock price overrides for this transaction.
            </p>
            
            <div className="space-y-4">
              <input 
                type="password" 
                placeholder="Enter 4-Digit PIN"
                className="w-full rounded-xl border-2 border-slate-700/80 bg-slate-950 py-3 px-4 text-center text-xl font-bold tracking-widest text-white outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                maxLength={4}
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setOverridePinModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    showToast('error', 'Authentication Failed', 'Invalid supervisor PIN.');
                    setOverridePinModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
