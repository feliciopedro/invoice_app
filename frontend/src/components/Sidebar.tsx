import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  Receipt
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.invoices'), path: '/invoices', icon: FileText },
    { name: t('sidebar.clients'), path: '/clients', icon: Users },
    { name: t('sidebar.settings'), path: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLogoUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header Menu Trigger */}
      <div className="md:hidden flex items-center justify-between bg-navy-900 border-b border-navy-800 px-4 py-3 text-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-gold" />
          <span className="font-serif text-lg font-bold tracking-tight">Ledger</span>
        </div>
        <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-100 focus:outline-none">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay on Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-navy-900 border-r border-navy-800 text-slate-200 z-50 flex flex-col justify-between
        transition-transform duration-300 md:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Branding Section */}
        <div>
          <div className="hidden md:flex items-center gap-3 px-6 py-8 border-b border-navy-800">
            <div className="bg-amber-gold/10 p-2 rounded-lg border border-amber-gold/25">
              <Receipt className="w-6 h-6 text-amber-gold" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-slate-100">Ledger</span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-250 group
                    ${isActive 
                      ? 'bg-amber-gold text-navy-950 font-semibold shadow-md shadow-amber-gold/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="border-t border-navy-800 p-4 space-y-4 bg-navy-950/40">
          <div className="flex items-center gap-3 px-2">
            {/* User Business Logo / Initial */}
            {user?.logoUrl ? (
              <img 
                src={getLogoUrl(user.logoUrl)!} 
                alt="Logo" 
                className="w-10 h-10 rounded-full border border-navy-700 object-cover bg-navy-900"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              style={{ display: user?.logoUrl ? 'none' : 'flex' }}
              className="w-10 h-10 rounded-full bg-navy-800 border border-navy-700 text-amber-gold flex items-center justify-center font-serif font-bold text-sm shrink-0"
            >
              {user?.name.charAt(0).toUpperCase()}
            </div>

            {/* Profile Info */}
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.businessName || t('sidebar.personalLedger')}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t('sidebar.signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
