import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { ThemeController } from './ThemeController';
import { LayoutDashboard, Package, Tags, Settings as SettingsIcon, LogOut, ExternalLink, ShoppingCart, Users, Ticket } from 'lucide-react';

export function AdminLayout() {
  const { user, loading: authLoading, logout } = useAuth();
  const { restaurant, settings, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se não tem restaurante e não está na página de onboarding, redireciona
  if (!restaurant && location.pathname !== '/admin/onboarding') {
    return <Navigate to="/admin/onboarding" replace />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Painel' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/admin/categories', icon: Tags, label: 'Categorias' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/customers', icon: Users, label: 'Clientes & Fidelidade' },
    { path: '/admin/coupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/settings', icon: SettingsIcon, label: 'Configurações' },
  ];

  return (
    <div className="theme-app min-h-screen flex flex-col md:flex-row font-sans">
      <ThemeController settings={settings} />
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[var(--border)] text-[var(--text)] flex flex-col shrink-0">
        <div className="p-6 border-b border-[var(--border)]">
          <h1 className="text-xl font-bold tracking-tight">Painel Admin</h1>
          <p className="text-xs text-zinc-500 truncate mt-1">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 flex md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${
                  isActive
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft-border)]'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-[var(--text)] border border-transparent'
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? 'text-[var(--primary)]' : 'text-zinc-400'}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border)] space-y-1">
          {restaurant && (
            <Link
              to={`/${restaurant.slug}`}
              target="_blank"
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 hover:text-[var(--text)] transition-all text-sm font-medium w-full text-zinc-600"
            >
              <ExternalLink size={18} className="text-zinc-400" />
              <span>Acessar Site</span>
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium w-full text-left text-zinc-600"
          >
            <LogOut size={18} className="text-zinc-400" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
