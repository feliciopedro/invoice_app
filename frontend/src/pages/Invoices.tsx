import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { formatInTimezone } from '@/utils/date';
import { formatMoney } from '@/utils/currency';
import api from '@/services/api';
import { Invoice, Client, ApiResponse } from '@/types';
import { Spinner } from '@/components/Spinner';
import { 
  Plus, 
  Filter, 
  ChevronRight, 
  FileText,
  User
} from 'lucide-react';



export const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // 1. Fetch Clients (for the filter dropdown)
  const { data: clientsData } = useQuery({
    queryKey: ['filterClients'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Client[]>>('/clients');
      return response.data.data;
    },
  });

  // 2. Fetch Invoices with filters
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, clientFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const response = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
      return response.data.data;
    },
  });

  const clients = clientsData || [];
  const invoices = invoicesData || [];



  // Helper to format date
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

  const handleResetFilters = () => {
    setStatusFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">{t('invoices.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-gold hover:bg-amber-500 text-navy-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-gold/5 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('invoices.newInvoiceBtn')}</span>
        </button>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="bg-navy-900 border border-navy-800/80 p-5 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-slate-300 font-serif text-sm font-semibold border-b border-navy-800/40 pb-2.5">
          <Filter className="w-4 h-4 text-amber-gold" />
          <span>{t('invoices.filterTitle')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('invoices.statusLabel')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-gold text-xs"
            >
              <option value="">{t('invoices.allStatuses')}</option>
              <option value="DRAFT">{t('invoices.statusDraft')}</option>
              <option value="SENT">{t('invoices.statusSent')}</option>
              <option value="PAID">{t('invoices.statusPaid')}</option>
              <option value="OVERDUE">{t('invoices.statusOverdue')}</option>
            </select>
          </div>

          {/* Client Dropdown */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('invoices.clientLabel')}</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-gold text-xs"
            >
              <option value="">{t('invoices.allClients')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('invoices.fromDateLabel')}</label>
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-gold text-xs"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('invoices.toDateLabel')}</label>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-gold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(statusFilter || clientFilter || dateFrom || dateTo) && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-amber-gold hover:text-amber-500 font-bold transition cursor-pointer"
            >
              {t('invoices.resetFiltersBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Invoices List Display */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Spinner label={t('common.loading')} />
        </div>
      ) : invoices.length > 0 ? (
        <div className="bg-navy-900 border border-navy-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-navy-800/60">
                  <th className="px-6 py-4">{t('invoices.tableColNumber')}</th>
                  <th className="px-6 py-4">{t('invoices.tableColClient')}</th>
                  <th className="px-6 py-4">{t('invoices.tableColBilled')}</th>
                  <th className="px-6 py-4">{t('invoices.tableColDue')}</th>
                  <th className="px-6 py-4 text-right">{t('invoices.tableColAmount')}</th>
                  <th className="px-6 py-4 text-center">{t('invoices.statusLabel')}</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/40 text-sm">
                {invoices.map((invoice, idx) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className={`
                      cursor-pointer hover:bg-navy-800/30 transition-colors duration-150
                      ${idx % 2 === 1 ? 'bg-navy-950/10' : ''}
                    `}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-200 font-semibold">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{invoice.client?.name || 'Unknown Client'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(invoice.issueDate)}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(invoice.dueDate)}</td>
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
                    <td className="px-6 py-4 text-slate-500 text-right">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-navy-900 border border-navy-800/80 p-12 text-center text-slate-500 rounded-xl flex flex-col items-center justify-center gap-3">
          <FileText className="w-10 h-10 text-slate-600" />
          <div>
            <p className="text-sm font-semibold text-slate-400">{t('invoices.noMatched')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('invoices.noMatchedSub')}</p>
          </div>
          {(statusFilter || clientFilter || dateFrom || dateTo) && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 border border-navy-700 text-amber-gold hover:text-amber-500 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              {t('invoices.resetFiltersBtn')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
