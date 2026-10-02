import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Target,
  Map,
  Bot,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('masar_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Gap Analysis', path: '/gap-analysis', icon: Target },
    { name: 'Roadmap', path: '/roadmap', icon: Map },
    { name: 'AI Mentor', path: '/mentor', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static
          inset-y-0 left-0
          z-50
          w-64
          bg-white
          border-r border-slate-200
          flex flex-col
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >

        {/* Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
            M
          </div>

          <div>
            <h1 className="font-bold text-slate-800 text-lg leading-tight">
              Masar
            </h1>

            <p className="text-xs text-slate-500 font-medium">
              Career Guidance
            </p>
          </div>

          {/* Close button - Mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden text-slate-500 hover:text-slate-800"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top Navbar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden shrink-0 text-slate-600 hover:text-slate-900"
          >
            <Menu size={24} />
          </button>

          {/* University */}
          <div className="flex-1 min-w-0">
            <p className="hidden sm:block text-sm text-slate-500 whitespace-nowrap">
                Suez Canal University — Faculty of Computers & Informatics
            </p>

            <p className="block sm:hidden text-xs text-slate-500 whitespace-nowrap">
                Suez Canal University
            </p>
         </div>
          {/* User */}
          <div className="shrink-0 flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block text-sm font-medium text-slate-700 whitespace-nowrap">
              Omar Tarek
            </span>

            <div className="w-8 h-8 shrink-0 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center text-xs">
              OT
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
};