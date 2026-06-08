import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { formatInTimezone } from '@/utils/date';
import { formatMoney } from '@/utils/currency';
import api from '@/services/api';
import { DashboardSummary, Invoice, ApiResponse } from '@/types';
import { Spinner } from '@/components/Spinner';
import { 
  Plus, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';



export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch Dashboard Summary
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
      return response.data.data;
    },
  });

  // Fetch Invoices (to display recent 5)
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['recentInvoices'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Invoice[]>>('/invoices');
      return response.data.data.slice(0, 5); // Take first 5 recent
    },
  });

  const isLoading = isSummaryLoading || isInvoicesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label={t('dashboard.retrievingData')} />
      </div>
    );
  }

  const summary = summaryData || {
    totalInvoices: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  };

  const recentInvoices = invoicesData || [];



  // Helper to format date in user's timezone
  const formatDate = (dateStr: string) => {
    return formatInTimezone(dateStr, user?.timezone || 'UTC', 'MMM d, yyyy');
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      SENT: 'bg-amber-50 border-amber-200 text-amber-800',
      OVERDUE: 'bg-red-50 border-red-200 text-red-700',
      DRAFT: 'bg-slate-50 border-slate-200 text-slate-600',
    };
    return styles[status] || styles.DRAFT;
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Upper header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">{t('dashboard.overview')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-gold hover:bg-amber-500 text-navy-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-gold/5 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('dashboard.newInvoiceBtn')}</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Invoices */}
        <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.totalInvoices')}</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-3xl font-bold text-slate-100">{summary.totalInvoices}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{t('dashboard.totalInvoicesSub')}</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.revenueSettled')}</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-bold text-emerald-400 tracking-tight truncate">
              {formatMoney(summary.totalPaid)}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{t('dashboard.revenueSettledSub')}</p>
          </div>
        </div>

        {/* Outstanding amount */}
        <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.outstanding')}</span>
            <div className="p-2 bg-amber-gold/10 rounded-lg text-amber-gold border border-amber-gold/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-bold text-amber-gold tracking-tight truncate">
              {formatMoney(summary.totalOutstanding)}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{t('dashboard.outstandingSub')}</p>
          </div>
        </div>

        {/* Overdue Count */}
        <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.overdue')}</span>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-3xl font-bold text-red-400">{summary.overdueCount}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{t('dashboard.overdueSub')}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Card */}
      <div className="bg-navy-900 border border-navy-800/80 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-5 border-b border-navy-800/60 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-100">{t('dashboard.recentInvoices')}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('dashboard.recentInvoicesSub')}</p>
          </div>
          <Link 
            to="/invoices" 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-gold transition"
          >
            <span>{t('dashboard.viewAllBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-navy-800/60">
                  <th className="px-6 py-4">{t('invoices.tableColNumber')}</th>
                  <th className="px-6 py-4">{t('invoices.tableColClient')}</th>
                  <th className="px-6 py-4">{t('invoices.tableColBilled')}</th>
                  <th className="px-6 py-4 text-right">{t('invoices.tableColAmount')}</th>
                  <th className="px-6 py-4 text-center">{t('invoices.statusLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/40 text-sm">
                {recentInvoices.map((invoice, idx) => (
                  <tr 
                    key={invoice.id} 
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className={`
                      cursor-pointer transition-colors duration-150 hover:bg-navy-800/30
                      ${idx % 2 === 1 ? 'bg-navy-950/10' : ''}
                    `}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-200 font-semibold">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{invoice.client?.name || 'Unknown Client'}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(invoice.issueDate)}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-100 font-semibold">
                      {formatMoney(Number(invoice.total), invoice.currency)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border uppercase
                        ${getStatusBadge(invoice.status)}
                      `}>
                        {t(`invoices.status${invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase()}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 gap-3">
            <FileText className="w-10 h-10 text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-400">{t('dashboard.noInvoices')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.noInvoicesSub')}</p>
            </div>
            <button
              onClick={() => navigate('/invoices/new')}
              className="mt-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 text-amber-gold hover:text-amber-500 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              {t('dashboard.createFirstInvoiceBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
