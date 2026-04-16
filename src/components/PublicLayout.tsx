import React from 'react';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="theme-app min-h-screen font-sans">
      <Outlet />
    </div>
  );
}
