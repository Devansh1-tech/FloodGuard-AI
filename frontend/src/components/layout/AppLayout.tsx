/**
 * AppLayout.tsx — Main application master layout shell.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      {/* Main Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleCollapse}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        <main className="flex flex-1 flex-col overflow-y-auto bg-slate-900/50 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col">
            <Breadcrumb />
            <div className="flex-1 mt-2">
              <Outlet />
            </div>
          </div>
          <Footer />
        </main>
      </div>

      {/* Global Notifications Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '13px',
          },
        }}
      />
    </div>
  );
};
