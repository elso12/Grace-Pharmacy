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

// New Storefront Pages & Layouts
import StorefrontLayout from './layouts/StorefrontLayout';
import HomePage from './pages/Storefront/HomePage';
import ProductCatalog from './pages/Storefront/ProductCatalog';
import CheckoutPage from './pages/Storefront/CheckoutPage';
import OrderHistoryPage from './pages/Customer/OrderHistoryPage';
import PatientPortal from './pages/Customer/PatientPortal';

import AdminDashboard from './pages/Admin/AdminDashboard';
import InventoryFEFOPage from './pages/Admin/InventoryFEFOPage';
import ProductsPage from './pages/Admin/ProductsPage';
import PharmacistQueue from './pages/Admin/PharmacistQueue';
import PharmacistDashboard from './pages/Admin/PharmacistDashboard';
import UsersPage from './pages/Admin/UsersPage';
import AuditLogPage from './pages/Admin/AuditLogPage';
import ReportsPage from './pages/Admin/ReportsPage';
import OrdersPage from './pages/Admin/OrdersPage';

import PickListQueue from './pages/Technician/PickListQueue';
import CycleCountForm from './pages/Technician/CycleCountForm';
import ShelfDirectory from './pages/Technician/ShelfDirectory';



const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public Storefront Routes — wrapped in CartProvider for shared cart state */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<ProductCatalog />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            
            {/* Customer-only route inside the storefront layout */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/patient-portal" element={<PatientPortal />} />
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
              
              {/* Common Manager/Staff Pages */}
              <Route element={<ProtectedRoute allowedRoles={['PHARMACIST', 'ADMIN']} />}>
                <Route path="prescriptions" element={<PharmacistQueue />} />
                <Route path="pharmacist-dashboard" element={<PharmacistDashboard />} />
              </Route>

              {/* Technician / Staff Pages */}
              <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'PHARMACIST', 'ADMIN']} />}>
                <Route path="pick-list" element={<PickListQueue />} />
                <Route path="cycle-count" element={<CycleCountForm />} />
                <Route path="shelf-directory" element={<ShelfDirectory />} />
              </Route>
              
              {/* POS Page — restricted to cashiers, pharmacists, and admins */}
              <Route element={<ProtectedRoute allowedRoles={['CASHIER', 'PHARMACIST', 'ADMIN']} />}>
                <Route path="pos" element={<POSPage />} />
                <Route path="pos/shift-close" element={<ShiftClosePage />} />
              </Route>

              {/* Strict Admin Pages */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route index                element={<AdminDashboard />} />
                <Route path="dashboard"     element={<AdminDashboard />} />
                <Route path="products"      element={<ProductsPage />} />
                <Route path="inventory"     element={<InventoryFEFOPage />} />
                <Route path="users"         element={<UsersPage />} />
                <Route path="orders"        element={<OrdersPage />} />
                <Route path="audit"         element={<AuditLogPage />} />
                <Route path="reports"       element={<ReportsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

