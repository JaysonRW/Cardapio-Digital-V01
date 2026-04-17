import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { ThemeController } from './ThemeController';

export function PublicLayout() {
  const { settings } = useTenant();

  return (
    <div className="theme-app min-h-screen font-sans">
      <ThemeController settings={settings} />
      <Outlet />
    </div>
  );
}
