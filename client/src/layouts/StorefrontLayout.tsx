import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Pill, Activity, Baby, Heart, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import LiveChatWidget from '../components/LiveChatWidget';
import UserProfileMenu from '../components/common/UserProfileMenu';

// Category hrefs must match exact StorefrontCategory enum values used by the API
const categories = [
  { name: 'Vitamins',      icon: Pill,     href: '/catalog?category=Vitamins'     },
  { name: 'Pain Relief',   icon: Activity, href: '/catalog?category=Pain+Relief'  },
  { name: 'Allergy',       icon: Heart,    href: '/catalog?category=Allergy'       },
  { name: 'Mother & Baby', icon: Baby,     href: '/catalog?category=Mother+%26+Baby' },
];

/** Staff roles that have access to the admin panel. */
const STAFF_ROLES = new Set(['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']);

const StorefrontLayout: React.FC = () => {
  const { itemCount }                      = useCart();
  const { isAuthenticated, user, logout }  = useAuth();
  const navigate                           = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const adminHref = STAFF_ROLES.has(user?.role ?? '') ? '/admin/dashboard' : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Pill className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Grace Pharmacy Store
              </span>
            </Link>

            {/* Global Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden sm:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="storefront-search"
                  type="text"
                  placeholder="Search for medications, symptoms, or brands..."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">

              <NotificationBell />

              {isAuthenticated && user ? (
                /* ── Authenticated user controls ────────────────────────── */
                <div className="flex items-center gap-3">
                  {/* "Patient Portal" & "My Orders" link — only for customers */}
                  {user.role === 'CUSTOMER' && (
                    <>
                      <Link
                        to="/patient-portal"
                        className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Patient Portal
                      </Link>
                      <Link
                        to="/orders"
                        className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                    </>
                  )}

                  {/* Admin panel link — only for staff */}
                  {adminHref && (
                    <Link
                      to={adminHref}
                      id="nav-admin-link"
                      title="Admin panel"
                      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin
                    </Link>
                  )}

                  <UserProfileMenu />
                </div>
              ) : (
                /* ── Guest controls ─────────────────────────────────────── */
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    id="nav-login-link"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                  <Link
                    to="/register"
                    id="nav-register-link"
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-blue-500/25"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Cart icon — shown for guests and customers, hidden for staff */}
              {(!isAuthenticated || user?.role === 'CUSTOMER') && (
                <button
                  id="nav-cart-button"
                  onClick={() => navigate('/checkout')}
                  aria-label={`Shopping cart — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                  className="relative group cursor-pointer"
                >
                  <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-50 transition-colors">
                    <ShoppingCart className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
                  </div>

                  {/* Badge — only rendered when cart is non-empty */}
                  {itemCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in duration-200"
                      aria-hidden="true"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Navbar - Categories */}
        <div className="bg-white border-t border-slate-100 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Product categories">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.href}
                  className="flex items-center gap-2 py-4 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600"
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Pill className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold">Grace Pharmacy</span>
              </div>
              <p className="text-sm text-slate-400">
                Your trusted local pharmacy, now online. Fast delivery and genuine products guaranteed.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop</h3>
              <ul className="space-y-3">
                {categories.map((c) => (
                  <li key={c.name}>
                    <Link to={c.href} className="text-sm hover:text-white transition-colors">{c.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h3>
              <ul className="space-y-3">
                <li><Link to="/delivery" className="text-sm hover:text-white transition-colors">Delivery Info</Link></li>
                <li><Link to="/returns"  className="text-sm hover:text-white transition-colors">Returns &amp; Refunds</Link></li>
                <li><Link to="/faq"      className="text-sm hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact"  className="text-sm hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li>123 Health Ave, Medical District</li>
                <li>support@gracepharmacy.com</li>
                <li>1-800-PHARMACY</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
            &copy; {new Date().getFullYear()} Grace Pharmacy. All rights reserved.
          </div>
        </div>
      </footer>
      <LiveChatWidget />
    </div>
  );
};

export default StorefrontLayout;
