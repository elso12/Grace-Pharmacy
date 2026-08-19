/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── PharmFlow — Shopping Cart Context ──────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single source of truth for the B2C shopping cart.
 *
 * Design decisions:
 *  - useReducer over useState: cart mutations (add/remove/update/clear) are
 *    multi-step transforms on an array. A reducer keeps each action pure,
 *    testable, and prevents the interleaved-setState bugs that arise when
 *    multiple setState calls fire inside one event handler.
 *
 *  - localStorage persistence via a synchronising useEffect: the effect runs
 *    whenever `state` changes and writes the latest cart to localStorage.
 *    Hydration happens once at reducer initialisation time (the `init`
 *    function passed as the third arg to useReducer) — this is the
 *    recommended React pattern and avoids a double-render.
 *
 *  - Derived values (cartTotal, itemCount) are computed during render from
 *    the reducer state. They are never stored in state to prevent them from
 *    going stale between dispatch and the next render cycle.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Product } from '../services/productApi';

// ─── localStorage key ─────────────────────────────────────────────────────────
const LS_CART_KEY = 'pharmflow_cart';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A product line-item inside the cart. */
export interface CartItem {
  id:       string;   // MongoDB _id
  name:     string;
  price:    number;
  quantity: number;
  imageUrl?: string;
  category:  string;
}

interface CartState {
  items: CartItem[];
}

// ── Actions ───────────────────────────────────────────────────────────────────
type CartAction =
  | { type: 'ADD_ITEM';       payload: Product }
  | { type: 'REMOVE_ITEM';    payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' };

// ─── Context value shape ──────────────────────────────────────────────────────
interface CartContextValue {
  items:      CartItem[];
  cartTotal:  number;
  itemCount:  number;

  /** Add a product to cart. Increments quantity if already present. */
  addToCart:      (product: Product) => void;
  /** Remove a line-item completely from the cart. */
  removeFromCart: (productId: string) => void;
  /** Set an item's quantity. Removes the item if quantity reaches 0. */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Empty the cart entirely. */
  clearCart:      () => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case 'ADD_ITEM': {
      const product   = action.payload;
      const existing  = state.items.find((i) => i.id === product._id);

      if (existing) {
        // Already in cart — bump quantity by 1
        return {
          items: state.items.map((i) =>
            i.id === product._id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      // New item — append with quantity 1
      const newItem: CartItem = {
        id:       product._id,
        name:     product.name,
        price:    product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        category: product.category,
      };
      return { items: [...state.items, newItem] };
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.id !== action.payload.productId),
      };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        // Treat quantity=0 as a remove
        return { items: state.items.filter((i) => i.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.id === productId ? { ...i, quantity } : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

// ─── Initialiser — hydrates from localStorage on first render ─────────────────
function initCart(): CartState {
  try {
    const raw = localStorage.getItem(LS_CART_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      // Basic shape validation to guard against corrupted data
      if (Array.isArray(parsed?.items)) return parsed;
    }
  } catch {
    console.warn('[CartContext] Failed to parse cart from localStorage — starting fresh.');
  }
  return { items: [] };
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, initCart);

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem(LS_CART_KEY, JSON.stringify(state));
  }, [state]);

  // ── Stable action dispatchers ────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  // ── Derived values (computed, never stored) ──────────────────────────────
  const cartTotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items:          state.items,
    cartTotal,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the shopping cart context.
 * Must be called inside a component that is a descendant of `CartProvider`.
 */
export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a <CartProvider>.');
  }
  return context;
};
