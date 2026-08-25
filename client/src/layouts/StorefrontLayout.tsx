import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Pill, Activity, Heart, LayoutDashboard, Package, MessageSquare, Thermometer, Shield, HeartPulse, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import LiveChatWidget from '../components/LiveChatWidget';
import { UserProfileDropdown } from '../components/layout/UserProfileDropdown';

// Category hrefs must match exact StorefrontCategory enum values used by the API
const categories = [
  { name: 'Pain Relief',      icon: Activity,    href: '/catalog?category=Pain+Relief'  },
  { name: 'Cold & Flu',       icon: Thermometer, href: '/catalog?category=Cold+%26+Flu' },
  { name: 'Allergy',          icon: Heart,       href: '/catalog?category=Allergy'       },
  { name: 'Digestive Health', icon: HeartPulse,  href: '/catalog?category=Digestive+Health' },
  { name: 'Vitamins',         icon: Pill,        href: '/catalog?category=Vitamins'     },
  { name: 'First Aid',        icon: Shield,      href: '/catalog?category=First+Aid'    },
];

/** Staff roles that have access to the admin panel. */
const STAFF_ROLES = new Set(['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']);

const StorefrontLayout: React.FC = () => {
  const { itemCount }                      = useCart();
  const { isAuthenticated, user }          = useAuth();
  const navigate                           = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const adminHref = STAFF_ROLES.has(user?.role ?? '') ? '/admin/dashboard' : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Mobile Menu Toggle */}
            <button 
              className="sm:hidden p-2 -ml-2 text-slate-600 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 ml-2 sm:ml-0">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden xs:block">
                Grace Pharmacy
              </span>
            </Link>

            {/* Global Search Bar (Desktop) */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="storefront-search"
                  type="text"
                  placeholder="Search for medications, symptoms, or brands..."
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-slate-200 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0 ml-auto">

              {/* Mobile Search Toggle */}
              <button 
                className="md:hidden p-2 text-slate-600 hover:text-blue-600"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              >
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

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
                      <Link
                        to="/messages"
                        className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Messages
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

                  <UserProfileDropdown />
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
                    <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
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
          
          {/* Mobile Search Bar Expansion */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-4 pt-2">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for medications, symptoms..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}
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

      {/* ── Mobile Sidebar Menu ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] sm:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Menu
              </span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.name}
                    to={category.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <category.icon className="h-5 w-5" />
                    {category.name}
                  </Link>
                ))}
              </nav>

              {!isAuthenticated && (
                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
