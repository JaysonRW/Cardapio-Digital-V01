import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Package, Tags, Settings as SettingsIcon, LogOut, ExternalLink } from 'lucide-react';

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Painel' },
    { path: '/admin/categories', icon: Tags, label: 'Categorias' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/settings', icon: SettingsIcon, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md md:min-h-screen flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-full px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={20} />
            <span>Acessar Site</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
