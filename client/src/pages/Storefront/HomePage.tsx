import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Clock, Zap } from 'lucide-react';
import { getAllProducts, type Product } from '../../services/productApi';
import ProductCard from '../../components/Storefront/ProductCard';

// ── Trust feature strip ───────────────────────────────────────────────────────
const TRUST_FEATURES = [
  { icon: Truck,       title: 'Free Local Delivery',  desc: 'On orders over $35 within 5 miles'           },
  { icon: ShieldCheck, title: 'Genuine Products',      desc: 'Sourced directly from manufacturers'         },
  { icon: Clock,       title: '24/7 Support',          desc: 'Pharmacists available around the clock'       },
  { icon: Zap,         title: 'Express Pickup',        desc: 'Ready in as little as 30 minutes in-store'   },
];

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
const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllProducts();
        if (!cancelled) setProducts(data);
      } catch (err) {
        if (!cancelled) {
          console.error('[HomePage] Failed to fetch products:', err);
          setError('Could not load products. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  // Show a featured slice — first 8 products from the API
  const featured = products.slice(0, 8);

  return (
    <div className="bg-white">

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — Hero Banner
          ════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-slate-900 overflow-hidden" aria-label="Hero">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-20"
          />
          {/* Two-stop gradient: solid left → transparent right so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-900/40" />
        </div>

        {/* Decorative blue glow blob */}
        <div
          aria-hidden="true"
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Now available online — same trusted pharmacy
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Fast Delivery to your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Local Pharmacy
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
              Skip the queue. Order prescriptions, vitamins, and daily health essentials online for convenient pickup or doorstep delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/catalog"
                id="hero-shop-now-cta"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg hover:shadow-blue-500/30 hover:shadow-xl"
              >
                Shop the Catalog
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/catalog?category=Vitamins"
                id="hero-vitamins-cta"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-slate-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/15"
              >
                Browse Vitamins
              </Link>
            </div>

            {/* Social proof nudge */}
            <p className="mt-8 text-sm text-slate-400">
              Trusted by <span className="text-white font-semibold">12,000+</span> customers · ⭐ 4.9 / 5 average rating
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          Trust Feature Strip
          ════════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-slate-100 bg-white" aria-label="Trust features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — Featured Products
          ════════════════════════════════════════════════════════════════════ */}
      <section
        id="featured-products"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        aria-label="Featured products"
      >
        {/* Section header */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-1">
              Handpicked for you
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Featured Products
            </h2>
            <p className="text-slate-500 mt-2 text-base">
              Popular health &amp; wellness essentials, straight from our catalog.
            </p>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition-colors whitespace-nowrap text-sm"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-6 py-4 text-sm mb-8">
            {error}
          </div>
        )}

        {/* Product grid: skeletons while loading, real cards when ready */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                />
              ))
          }
        </div>

        {/* "View all" CTA for mobile */}
        {!loading && !error && (
          <div className="mt-10 flex sm:hidden justify-center">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors"
            >
              View all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          Newsletter / CTA Banner
          ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 border-t border-slate-200" aria-label="Newsletter signup">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8">
            {/* Decorative blobs */}
            <div aria-hidden="true" className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div aria-hidden="true" className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl text-center sm:text-left">
              <h2 className="text-3xl font-extrabold text-white mb-3">Get 10% off your first order</h2>
              <p className="text-blue-100 text-base leading-relaxed">
                Subscribe for exclusive health tips, special offers, and early access to new products.
              </p>
            </div>

            <div className="relative z-10 w-full sm:w-auto flex-shrink-0">
              <form
                className="flex flex-col sm:flex-row gap-3"
                onSubmit={(e) => { e.preventDefault(); console.log('Newsletter subscribe'); }}
              >
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address for newsletter"
                  className="px-5 py-4 rounded-xl border-0 bg-white/15 text-white placeholder-blue-200 focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-4 focus:ring-white/30 transition-all w-full sm:w-72 outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 active:scale-95 transition-all whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
