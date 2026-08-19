import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, totalAmount }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulating Stripe Payment Intent
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        {!success ? (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Complete Payment</h2>
            <p className="text-slate-500 text-sm mb-6 flex items-center gap-1">
              <ShieldCheck size={16} className="text-emerald-500" />
              Secured by MockStripe
            </p>

            <div className="bg-slate-50 p-4 rounded-xl mb-6">
              <p className="text-slate-500 text-sm font-medium">Total Amount</p>
              <p className="text-3xl font-bold text-slate-800">$\{(totalAmount || 0).toFixed(2)}</p>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Card Information</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 mt-4"
              >
                {loading ? 'Processing...' : `Pay $\{(totalAmount || 0).toFixed(2)}`}
              </button>
            </form>
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="text-emerald-500 h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
            <p className="text-slate-500">Your order has been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
