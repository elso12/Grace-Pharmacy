import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, MapPin, Package, Truck, CheckCircle2, AlertCircle, ArrowLeft, ImageOff, CreditCard } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
type FulfillmentType = 'PICKUP' | 'DELIVERY';

interface ShippingForm {
  firstName:       string;
  lastName:        string;
  email:           string;
  phone:           string;
  address:         string;
  city:            string;
  zip:             string;
  fulfillmentType: FulfillmentType;
  paymentMethod:   string;
  notes:           string;
}

const INITIAL_FORM: ShippingForm = {
  firstName:       '',
  lastName:        '',
  email:           '',
  phone:           '',
  address:         '',
  city:            '',
  zip:             '',
  fulfillmentType: 'DELIVERY',
  paymentMethod:   'CREDIT_CARD',
  notes:           '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

// ── CheckoutPage ──────────────────────────────────────────────────────────────
const CheckoutPage: React.FC = () => {
  const navigate                = useNavigate();
  const { items, cartTotal, itemCount, removeFromCart, updateQuantity, clearCart } = useCart();

  const [form,        setForm]        = useState<ShippingForm>(INITIAL_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  // ── Derived totals ──────────────────────────────────────────────────────
  const DELIVERY_FEE    = form.fulfillmentType === 'DELIVERY' ? 5.99 : 0;
  const TAX_RATE        = 0.0875; // 8.75 %
  const subtotal        = cartTotal;
  const tax             = subtotal * TAX_RATE;
  const orderTotal      = subtotal + tax + DELIVERY_FEE;

  // ── Form helpers ────────────────────────────────────────────────────────
  const handleField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    form.firstName.trim() &&
    form.lastName.trim()  &&
    form.email.trim()     &&
    form.phone.trim()     &&
    (form.fulfillmentType === 'PICKUP' || (form.address.trim() && form.city.trim() && form.zip.trim()));

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // The api instance's request interceptor automatically attaches
      // the Authorization: Bearer <token> header from localStorage.
      await api.post('/orders/checkout', {
        items: items.map((item) => ({
          productId: item.id,
          name:      item.name,
          price:     item.price,
          quantity:  item.quantity,
        })),
        shippingAddress: {
          street:  form.address,
          city:    form.city,
          zip:     form.zip,
        },
        fulfillmentType: form.fulfillmentType,
        paymentMethod:   form.paymentMethod,
        notes:           form.notes,
        subtotal,
        tax,
        deliveryFee:     DELIVERY_FEE,
        total:           orderTotal,
      });

      // ✅ Success path
      clearCart();
      setSuccessMsg('Your order has been placed successfully! Redirecting…');

      setTimeout(() => navigate('/orders'), 2500);

    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ??
        'Failed to place order. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty cart state ────────────────────────────────────────────────────
  if (items.length === 0 && !successMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="h-12 w-12 text-slate-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Your cart is empty</h1>
          <p className="text-slate-500 mb-8">
            Add some products from our catalog to get started.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  // ── Success overlay ─────────────────────────────────────────────────────
  if (successMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-500">{successMsg}</p>
        </div>
      </div>
    );
  }

  // ── Main checkout layout ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <Link
            to="/catalog"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Back to catalog"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Checkout</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleCheckout}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

          {/* ══════════════════════════════════════════════════════════════
              COLUMN 2 (rendered first on mobile) — ORDER SUMMARY
              ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-start-2 lg:row-start-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <ShoppingCart className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Order Summary
                </h2>
              </div>

              {/* Line items */}
              <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-6 py-4">

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageOff className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmt(item.price)} each</p>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 w-5 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Line total + remove */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">
                        {fmt(item.price * item.quantity)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="mt-1 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Price breakdown */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax (8.75%)</span>
                  <span className="tabular-nums">{fmt(tax)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>
                    {form.fulfillmentType === 'PICKUP' ? 'Pickup (free)' : 'Delivery fee'}
                  </span>
                  <span className="tabular-nums">
                    {form.fulfillmentType === 'PICKUP' ? '—' : fmt(DELIVERY_FEE)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Order Total</span>
                  <span className="tabular-nums text-blue-700">{fmt(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUMN 1 — SHIPPING DETAILS FORM
              ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-start-1 lg:row-start-1 space-y-6">

            {/* ── Fulfillment type selector ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                Fulfillment Method
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Pickup */}
                <label
                  htmlFor="fulfillment-pickup"
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.fulfillmentType === 'PICKUP'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    id="fulfillment-pickup"
                    type="radio"
                    name="fulfillmentType"
                    value="PICKUP"
                    checked={form.fulfillmentType === 'PICKUP'}
                    onChange={handleField}
                    className="sr-only"
                  />
                  <Package className={`h-6 w-6 ${form.fulfillmentType === 'PICKUP' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${form.fulfillmentType === 'PICKUP' ? 'text-blue-700' : 'text-slate-700'}`}>
                      Store Pickup
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Free · Ready in 30 min</p>
                  </div>
                </label>

                {/* Delivery */}
                <label
                  htmlFor="fulfillment-delivery"
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.fulfillmentType === 'DELIVERY'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    id="fulfillment-delivery"
                    type="radio"
                    name="fulfillmentType"
                    value="DELIVERY"
                    checked={form.fulfillmentType === 'DELIVERY'}
                    onChange={handleField}
                    className="sr-only"
                  />
                  <Truck className={`h-6 w-6 ${form.fulfillmentType === 'DELIVERY' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-bold ${form.fulfillmentType === 'DELIVERY' ? 'text-blue-700' : 'text-slate-700'}`}>
                      Home Delivery
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmt(5.99)} · Within 2 hrs</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ── Contact details ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                {form.fulfillmentType === 'PICKUP' ? 'Contact Details' : 'Shipping Details'}
              </h2>

              <div className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-firstName" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="checkout-firstName"
                      name="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={handleField}
                      required
                      autoComplete="given-name"
                      placeholder="John"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-lastName" className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="checkout-lastName"
                      name="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={handleField}
                      required
                      autoComplete="family-name"
                      placeholder="Doe"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="checkout-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleField}
                    required
                    autoComplete="email"
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="checkout-phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleField}
                    required
                    autoComplete="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Address fields — only shown for DELIVERY */}
                {form.fulfillmentType === 'DELIVERY' && (
                  <>
                    <div>
                      <label htmlFor="checkout-address" className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Street Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="checkout-address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleField}
                        required={form.fulfillmentType === 'DELIVERY'}
                        autoComplete="street-address"
                        placeholder="123 Main Street, Apt 4B"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkout-city" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-city"
                          name="city"
                          type="text"
                          value={form.city}
                          onChange={handleField}
                          required={form.fulfillmentType === 'DELIVERY'}
                          autoComplete="address-level2"
                          placeholder="New York"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-zip" className="block text-xs font-semibold text-slate-600 mb-1.5">
                          ZIP Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="checkout-zip"
                          name="zip"
                          type="text"
                          value={form.zip}
                          onChange={handleField}
                          required={form.fulfillmentType === 'DELIVERY'}
                          autoComplete="postal-code"
                          placeholder="10001"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Payment Method ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Payment Method
              </h2>
              <div>
                <select
                  id="checkout-paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleField}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="MOBILE_PAYMENT">Mobile Wallet</option>
                  <option value="CASH">Cash on Delivery / Pickup</option>
                  <option value="INSURANCE">Insurance Co-Pay</option>
                </select>
              </div>
            </div>

            {/* Optional notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                Additional Info
              </h2>
              <div>
                  <label htmlFor="checkout-notes" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Order Notes <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="checkout-notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleField}
                    placeholder="Any special instructions for your order…"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

            {/* ── Error banner ───────────────────────────────────────── */}
            {error && (
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-xl text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Order failed</p>
                  <p className="mt-0.5 text-rose-600">{error}</p>
                </div>
              </div>
            )}

            {/* ── Submit button ──────────────────────────────────────── */}
            <button
              id="place-order-btn"
              type="submit"
              disabled={submitting || !isFormValid}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-xl transition-all duration-200 shadow-sm hover:shadow-blue-500/30 hover:shadow-lg active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Place Order · {fmt(orderTotal)}
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              By placing your order, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-slate-600">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
