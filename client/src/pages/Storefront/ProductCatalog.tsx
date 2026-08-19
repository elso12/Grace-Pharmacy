import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, Search } from 'lucide-react';
import {
  getAllProducts,
  STOREFRONT_CATEGORIES,
  type Product,
  type StorefrontCategory,
} from '../../services/productApi';
import ProductCard from '../../components/Storefront/ProductCard';

// ── Category sidebar config ───────────────────────────────────────────────────
const CATEGORY_ICONS: Record<StorefrontCategory, string> = {
  'Vitamins':      '💊',
  'Pain Relief':   '🩹',
  'Allergy':       '🌿',
  'First Aid':     '🩺',
  'Mother & Baby': '🍼',
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-slate-100" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-20 bg-slate-200 rounded-full" />
      <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
      <div className="h-3 w-1/2 bg-slate-200 rounded-full" />
      <div className="flex justify-between items-center pt-3 mt-auto border-t border-slate-100">
        <div className="h-6 w-16 bg-slate-200 rounded-full" />
        <div className="h-9 w-28 bg-slate-200 rounded-xl" />
      </div>
    </div>
  </div>
);

// ── Page component ────────────────────────────────────────────────────────────
const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive active category from URL query param so the page is deep-linkable.
  const urlCategory = (searchParams.get('category') ?? '') as StorefrontCategory | '';

  const [activeCategory, setActiveCategory] = useState<StorefrontCategory | ''>(urlCategory);
  const [products,        setProducts]        = useState<Product[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ── Fetch whenever active category changes ──────────────────────────────────
  const fetchProducts = useCallback(async (category: StorefrontCategory | '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProducts(category || undefined);
      setProducts(data);
    } catch (err) {
      console.error('[CatalogPage] Fetch error:', err);
      setError('Failed to load products. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory, fetchProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Keep URL in sync when category changes
  const handleCategorySelect = (cat: StorefrontCategory | '') => {
    setActiveCategory(cat);
    setMobileSidebarOpen(false);
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  // ── Sidebar component (shared by desktop & mobile drawer) ──────────────────
  const SidebarContent = (
    <div className="space-y-1">
      {/* All Products */}
      <button
        id="filter-all"
        onClick={() => handleCategorySelect('')}
        className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
          activeCategory === ''
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className="text-base">🏷️</span>
        All Products
        {activeCategory === '' && (
          <span className="ml-auto text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md">
            {products.length}
          </span>
        )}
      </button>

      {/* Category filters */}
      {STOREFRONT_CATEGORIES.map((cat) => (
        <button
          key={cat}
          id={`filter-${cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`}
          onClick={() => handleCategorySelect(cat)}
          className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeCategory === cat
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="text-base">{CATEGORY_ICONS[cat]}</span>
          {cat}
          {activeCategory === cat && (
            <span className="ml-auto text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md">
              {products.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Page header strip ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {activeCategory || 'All Products'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {loading
              ? 'Loading products…'
              : `${products.length} product${products.length !== 1 ? 's' : ''} found`
            }
          </p>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search products, brands, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">

        {/* ════════════════════════════════════════════════════════════════
            SIDEBAR — Desktop (always visible ≥ md)
            ════════════════════════════════════════════════════════════════ */}
        <aside
          className="hidden md:block w-64 flex-shrink-0"
          aria-label="Product category filters"
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-28">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <Filter className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Filter by Category
              </h2>
            </div>
            {SidebarContent}
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════════
            MAIN CONTENT AREA
            ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0">

          {/* ── Mobile filter bar + drawer toggle ─────────────────────── */}
          <div className="flex md:hidden items-center justify-between mb-6 gap-3">
            <button
              id="mobile-filter-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCategory && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md">
                  1
                </span>
              )}
            </button>

            {activeCategory && (
              <button
                onClick={() => handleCategorySelect('')}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="h-4 w-4" />
                Clear filter
              </button>
            )}
          </div>

          {/* ── Mobile filter drawer overlay ──────────────────────────── */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
              <aside className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter by Category
                  </h2>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                    aria-label="Close filter drawer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {SidebarContent}
              </aside>
            </div>
          )}

          {/* ── Active filter chip (desktop) ──────────────────────────── */}
          {activeCategory && (
            <div className="hidden md:flex items-center gap-2 mb-6">
              <span className="text-sm text-slate-500">Active filter:</span>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm font-semibold">
                {CATEGORY_ICONS[activeCategory]} {activeCategory}
                <button
                  onClick={() => handleCategorySelect('')}
                  className="ml-1 hover:text-blue-900 transition-colors"
                  aria-label="Remove category filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          )}

          {/* ── Error state ───────────────────────────────────────────── */}
          {error && !loading && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm mb-6 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-0.5 text-red-600">{error}</p>
              </div>
              <button
                onClick={() => fetchProducts(activeCategory)}
                className="ml-auto px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────── */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-6xl mb-4">🔍</span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500 max-w-sm">
                We couldn't find any products in the "{activeCategory}" category. Try selecting a different one.
              </p>
              <button
                onClick={() => handleCategorySelect('')}
                className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                View all products
              </button>
            </div>
          )}

          {/* ── Product grid ──────────────────────────────────────────── */}
          {(loading || filteredProducts.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : filteredProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                    />
                  ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
