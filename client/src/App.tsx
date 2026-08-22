import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import POSPage from './pages/Cashier/POSPage';
import ShiftClosePage from './pages/Cashier/ShiftClosePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

// New Storefront Pages & Layouts
import StorefrontLayout from './layouts/StorefrontLayout';
import HomePage from './pages/Storefront/HomePage';
import ProductCatalog from './pages/Storefront/ProductCatalog';
import ProductDetailPage from './pages/Storefront/ProductDetailPage';
import CheckoutPage from './pages/Storefront/CheckoutPage';
import OrderHistoryPage from './pages/Customer/OrderHistoryPage';
import PatientPortal from './pages/Customer/PatientPortal';

import MessagesPage from './pages/Common/MessagesPage';

import AdminDashboard from './pages/Admin/AdminDashboard';
import InventoryFEFOPage from './pages/Admin/InventoryFEFOPage';
import ProductsPage from './pages/Admin/ProductsPage';
import UsersPage from './pages/Admin/UsersPage';
import AuditLogPage from './pages/Admin/AuditLogPage';
import ReportsPage from './pages/Admin/ReportsPage';
import OrdersPage from './pages/Admin/OrdersPage';
import SuppliersPage from './pages/Admin/SuppliersPage';
import SettingsPage from './pages/Admin/SettingsPage';

// Pharmacist Pages
import PrescriptionQueuePage from './pages/Pharmacist/PrescriptionQueuePage';
import BatchTrackerPage from './pages/Pharmacist/BatchTrackerPage';
import PatientHistoryPage from './pages/Pharmacist/PatientHistoryPage';
import PharmacistDashboard from './pages/Admin/PharmacistDashboard';
import PharmacistQueue from './pages/Admin/PharmacistQueue';

// Cashier Pages
import CashierDashboard from './pages/Cashier/CashierDashboard';

// Technician Pages
import PickListQueue from './pages/Technician/PickListQueue';
import CycleCountForm from './pages/Technician/CycleCountForm';
import ShelfDirectory from './pages/Technician/ShelfDirectory';
import TechnicianDashboard from './pages/Technician/TechnicianDashboard';



const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ className: 'bg-slate-800 text-white border border-slate-700' }} />
      <CartProvider>
        <Routes>
          {/* Public Storefront Routes — wrapped in CartProvider for shared cart state */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<ProductCatalog />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            {/* Customer-only route inside the storefront layout */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/patient-portal" element={<PatientPortal />} />
              <Route path="/messages" element={<div className="p-4 md:p-8 max-w-7xl mx-auto"><MessagesPage /></div>} />
            </Route>
          </Route>

          {/* Auth Routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']} />}>
            <Route element={<Layout />}>
              
              {/* ── Role-Specific Dashboards (index route) ──────────────── */}
              {/* Admin dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route index                element={<AdminDashboard />} />
                <Route path="dashboard"     element={<AdminDashboard />} />
              </Route>

              {/* Pharmacist dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['PHARMACIST']} />}>
                <Route index                element={<PharmacistDashboard />} />
                <Route path="dashboard"     element={<PharmacistDashboard />} />
              </Route>

              {/* Cashier dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['CASHIER']} />}>
                <Route index                element={<CashierDashboard />} />
                <Route path="dashboard"     element={<CashierDashboard />} />
              </Route>

              {/* Technician dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN']} />}>
                <Route index                element={<TechnicianDashboard />} />
                <Route path="dashboard"     element={<TechnicianDashboard />} />
              </Route>

              {/* ── Common Manager/Staff Pages (Pharmacist + Admin) ────── */}
              <Route element={<ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']} />}>
                <Route path="prescriptions"   element={<PrescriptionQueuePage />} />
                <Route path="batch-tracker"    element={<BatchTrackerPage />} />
                <Route path="patient-history"  element={<PatientHistoryPage />} />
                <Route path="approval-queue"   element={<PharmacistQueue />} />
              </Route>

              {/* Universal Staff Pages */}
              <Route path="messages" element={<MessagesPage />} />

              {/* ── Technician / Staff Pages ────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'PHARMACIST', 'ADMIN']} />}>
                <Route path="pick-list" element={<PickListQueue />} />
                <Route path="cycle-count" element={<CycleCountForm />} />
                <Route path="shelf-directory" element={<ShelfDirectory />} />
              </Route>
              
              {/* ── POS Page — restricted to cashiers, pharmacists, and admins ── */}
              <Route element={<ProtectedRoute allowedRoles={['CASHIER', 'PHARMACIST', 'ADMIN']} />}>
                <Route path="pos" element={<POSPage />} />
                <Route path="pos/shift-close" element={<ShiftClosePage />} />
              </Route>

              {/* ── Strict Admin Pages ──────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="products"      element={<ProductsPage />} />
                <Route path="inventory"     element={<InventoryFEFOPage />} />
                <Route path="users"         element={<UsersPage />} />
                <Route path="orders"        element={<OrdersPage />} />
                <Route path="audit"         element={<AuditLogPage />} />
                <Route path="reports"       element={<ReportsPage />} />
                <Route path="suppliers"     element={<SuppliersPage />} />
                <Route path="settings"      element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
