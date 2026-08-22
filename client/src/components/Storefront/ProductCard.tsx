import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle, ImageOff, Check } from 'lucide-react';
import type { Product, StorefrontCategory } from '../../services/productApi';
import { useCart } from '../../context/CartContext';

// ── Category badge config ─────────────────────────────────────────────────────
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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [imgError,  setImgError]  = useState(false);
  // `added` drives the brief "Added ✓" feedback state
  const [added,     setAdded]     = useState(false);

  const badge = CATEGORY_STYLES[product.category as StorefrontCategory] ?? DEFAULT_BADGE;
  const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price);

  const handleAddToCart = useCallback(() => {
    addToCart(product);

    // Flash the success state for 1.5 s, then revert
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [addToCart, product]);

  return (
    <article
      onClick={() => navigate(`/product/${product._id}`)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
    >

      {/* ── Toast notification (Success) ────────────────────────────────────────────── */}
      {/* Slides down from the top of the card for 1.5 s then disappears    */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white text-sm font-semibold transition-transform duration-300 ease-out ${
          added ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Check className="h-4 w-4" />
        Added to cart!
      </div>


      {/* ── Image area ────────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden flex-shrink-0">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <ImageOff className="h-10 w-10" />
            <span className="text-xs text-slate-400">No image</span>
          </div>
        )}

        {/* Prescription badge */}
        {product.requiresPrescription && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
            <AlertCircle className="h-3 w-3" />
            Rx Required
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col">

        {/* Category badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {product.category}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5 flex-1 line-clamp-2">
          {product.name}
        </h3>

        {/* Manufacturer */}
        {product.manufacturer && (
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
            {product.manufacturer}
          </p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <span className="text-xl font-extrabold text-slate-900 tabular-nums">
            {price}
          </span>

          <button
            id={`add-to-cart-${product._id}`}
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            aria-label={`Add ${product.name} to cart`}
            disabled={added}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 shadow-sm ${
              added
                ? 'bg-emerald-500 text-white cursor-default scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white hover:shadow-blue-500/30 hover:shadow-md'
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
