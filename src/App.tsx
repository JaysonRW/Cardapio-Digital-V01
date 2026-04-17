import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { PublicLayout } from './components/PublicLayout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { Menu } from './pages/Menu';
import { Login } from './pages/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Categories } from './pages/admin/Categories';
import { Products } from './pages/admin/Products';
import { Settings } from './pages/admin/Settings';
import { Onboarding } from './pages/admin/Onboarding';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeController } from './components/ThemeController';
import { TenantProvider } from './contexts/TenantContext';
import { AdminProvider } from './contexts/AdminContext';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main Landing / Redirect (Optional) */}
            <Route path="/" element={<Navigate to="/acaiteria-do-jorginho" replace />} />

            {/* Public Routes with Tenant Isolation */}
            <Route path="/:restaurantSlug" element={
              <TenantProvider>
                <CartProvider>
                  <PublicLayout />
                </CartProvider>
              </TenantProvider>
            }>
              <Route index element={<Home />} />
              <Route path="menu" element={<Menu />} />
            </Route>

            {/* Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminProvider>
                <AdminLayout />
              </AdminProvider>
            }>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products" element={<Products />} />
              <Route path="settings" element={<Settings />} />
            </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
  );
}
