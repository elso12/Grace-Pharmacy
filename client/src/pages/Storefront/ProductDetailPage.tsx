import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Check, AlertCircle, ImageOff,
  Package, Truck, Shield, Clock, Plus, Minus, Loader2,
  ChevronRight
} from 'lucide-react';
import type { Product, StorefrontCategory } from '../../services/productApi';
import { getAllProducts } from '../../services/productApi';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/Storefront/ProductCard';

/* ── Category badge config (same as ProductCard) ───────────────────── */
const CATEGORY_STYLES: Record<StorefrontCategory, { bg: string; text: string; dot: string }> = {
  'Pain Relief':      { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  'Cold & Flu':       { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500'     },
  'Allergy':          { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'  },
  'Digestive Health': { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
  'Vitamins':         { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'First Aid':        { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
  'Mother & Baby':    { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500'    },
};
const DEFAULT_BADGE = { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };

/* ── Trust features ────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: Truck,   label: 'Free delivery on orders over $35' },
  { icon: Shield,  label: 'Genuine manufacturer-sourced' },
  { icon: Clock,   label: 'Express pickup available' },
  { icon: Package, label: 'Discreet, secure packaging' },
];

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setImgError(false);
        setQty(1);
        setAdded(false);

        // Fetch all products and find the one by ID (using existing API)
        const allProducts = await getAllProducts();
        const found = allProducts.find((p) => p._id === id);

        if (found) {
          setProduct(found);
          // Find related products in the same category
          const relatedProducts = allProducts
            .filter((p) => p._id !== id && p.category === found.category)
            .slice(0, 4);
          setRelated(relatedProducts);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/catalog')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
          Back to Catalog
        </button>
      </div>
    );
  }

  const badge = CATEGORY_STYLES[product.category as StorefrontCategory] ?? DEFAULT_BADGE;
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/catalog" className="hover:text-blue-600 transition-colors">Catalog</Link>
        <ChevronRight size={14} />
        <Link to={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-blue-600 transition-colors">
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Back button (mobile) */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 sm:hidden"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Product detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
          {product.imageUrl && !imgError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
              <ImageOff className="h-16 w-16" />
              <span className="text-sm text-slate-400">No image available</span>
            </div>
          )}

          {/* Prescription badge */}
          {product.requiresPrescription && (
            <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
              <AlertCircle className="h-3.5 w-3.5" />
              Prescription Required
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {/* Category badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {product.category}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            {product.name}
          </h1>

          {/* Manufacturer */}
          {product.manufacturer && (
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-6">
              {product.manufacturer}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-base text-slate-600 leading-relaxed mb-8">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-slate-900">{price}</span>
          </div>

          {/* Quantity selector + Add to cart */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-3 hover:bg-slate-100 transition-colors text-slate-600"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 py-3 text-sm font-bold text-slate-900 tabular-nums min-w-[50px] text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-3 py-3 hover:bg-slate-100 transition-colors text-slate-600"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={added}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl shadow-lg transition-all duration-200 ${
                added
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white hover:shadow-blue-500/30 hover:shadow-xl'
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Trust features */}
          <div className="grid grid-cols-2 gap-3">
            {TRUST_ITEMS.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <item.icon size={16} className="text-blue-500 shrink-0" />
                <span className="text-xs text-slate-600 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">You may also like</h2>
            <Link
              to={`/catalog?category=${encodeURIComponent(product.category)}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
