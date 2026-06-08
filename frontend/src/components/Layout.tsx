import React from 'react';
import { Sidebar } from './Sidebar';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { UserCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-navy-950">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-navy-800 bg-navy-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">{t('sidebar.workspace')}</h2>
            <p className="font-serif text-sm font-bold text-slate-200">{user?.businessName || t('sidebar.personalLedger')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-semibold tracking-wider uppercase">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t('sidebar.sessionSecure')}</span>
            </div>
            <div className="h-6 w-px bg-navy-800"></div>
            <p className="text-xs font-medium text-slate-400">
              Welcome, <span className="text-slate-200 font-semibold">{user?.name}</span>
            </p>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
