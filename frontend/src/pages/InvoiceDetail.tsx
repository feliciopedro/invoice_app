import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { formatInTimezone } from '@/utils/date';
import { formatMoney } from '@/utils/currency';
import api from '@/services/api';
import { Invoice, ApiResponse } from '@/types';
import { Spinner } from '@/components/Spinner';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  Send, 
  Download, 
  Trash2,
  AlertTriangle,
  Receipt
} from 'lucide-react';



export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch Invoice Details
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
      return response.data.data;
    },
  });

  // Mark Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, {
        status: 'PAID',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('invoiceDetail.title') + ' marked as PAID');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
    onError: (error: any) => {
      console.error('Error marking paid:', error);
      toast.error('Failed to update status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete<ApiResponse<any>>(`/invoices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('invoiceDetail.title') + ' deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate('/invoices');
    },
    onError: (error: any) => {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
      setConfirmDelete(false);
    },
  });

  // PDF download handler
  const handleDownloadPdf = async () => {
    if (!invoiceData) return;
    const toastId = toast.loading('Generating and downloading PDF...');
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceData.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully', { id: toastId });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF', { id: toastId });
    }
  };

  // Simulated Email Sending
  const handleSendInvoice = () => {
    const toastId = toast.loading('Simulating sending invoice email...');
    setTimeout(() => {
      toast.success(`Invoice sent successfully to ${invoiceData?.client?.email}`, { id: toastId });
      // If draft, mark as SENT
      if (invoiceData?.status === 'DRAFT') {
        api.patch(`/invoices/${id}/status`, { status: 'SENT' }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['invoice', id] });
          queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
        });
      }
    }, 1500);
  };

  const getLogoUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label={t('dashboard.retrievingData')} />
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="bg-navy-900 border border-navy-800 p-12 text-center text-slate-550 rounded-xl space-y-4">
        <Receipt className="w-12 h-12 mx-auto text-slate-400" />
        <h3 className="font-serif text-xl font-bold text-slate-700">{t('invoiceDetail.notFoundTitle')}</h3>
        <p className="text-xs text-slate-500">{t('invoiceDetail.notFoundSub')}</p>
        <Link to="/invoices" className="text-amber-gold hover:underline font-bold text-sm">
          {t('invoiceDetail.returnBtn')}
        </Link>
      </div>
    );
  }



  // Format date helper
  const formatDate = (dateStr: string) => {
    return formatInTimezone(dateStr, user?.timezone || 'UTC', 'MMMM d, yyyy');
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
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Back Link */}
        <div className="flex items-center gap-4">
          <Link 
            to="/invoices" 
            className="p-2 bg-navy-900 border border-navy-800 hover:border-navy-700 text-slate-500 hover:text-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <span>{t('invoiceDetail.title')} {invoiceData.invoiceNumber}</span>
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border uppercase
                ${getStatusBadge(invoiceData.status)}
              `}>
                {t(`invoices.status${invoiceData.status.charAt(0) + invoiceData.status.slice(1).toLowerCase()}`)}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t('invoiceDetail.createdOn')} {formatDate(invoiceData.createdAt)}</p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Edit Button (DRAFT only) */}
          {invoiceData.status === 'DRAFT' && (
            <Link
              to={`/invoices/${id}/edit`}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-navy-900 hover:bg-navy-850 border border-navy-800 hover:border-navy-700 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-lg transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{t('invoiceDetail.editBtn')}</span>
            </Link>
          )}

          {/* Mark PAID Button */}
          {invoiceData.status !== 'PAID' && (
            <button
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('invoiceDetail.markPaidBtn')}</span>
            </button>
          )}

          {/* Send Button */}
          {invoiceData.status !== 'PAID' && (
            <button
              onClick={handleSendInvoice}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 hover:text-amber-900 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('invoiceDetail.sendInvoiceBtn')}</span>
            </button>
          )}

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-gold hover:bg-amber-500 text-white hover:text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('invoiceDetail.downloadPdfBtn')}</span>
          </button>

          {/* Delete Button */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('invoiceDetail.deleteBtn')}</span>
          </button>
        </div>
      </div>

      {/* Invoice Page Visual Sheet */}
      <div className="bg-white text-slate-800 p-8 md:p-12 rounded-xl shadow-xl space-y-10 border border-slate-200 max-w-4xl mx-auto selection:bg-amber-gold/30">
        {/* Row 1: Logo and Sender details */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-start gap-4">
            {/* Logo display if loaded */}
            {invoiceData.user?.logoUrl ? (
              <img 
                src={getLogoUrl(invoiceData.user.logoUrl)!} 
                alt="Business logo"
                className="w-16 h-16 rounded-lg object-cover border border-slate-100 bg-slate-50"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-serif font-bold text-xl">
                {invoiceData.user?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800">
                {invoiceData.user?.businessName || invoiceData.user?.name}
              </h2>
              {invoiceData.user?.businessName && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">Owner: {invoiceData.user?.name}</p>
              )}
              {invoiceData.user?.businessAddress && (
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  {invoiceData.user?.businessAddress}
                </p>
              )}
              <p className="text-xs text-slate-500">Email: {invoiceData.user?.email}</p>
            </div>
          </div>

          {/* Document Heading Metadata */}
          <div className="sm:text-right space-y-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-800">INVOICE</h1>
            <div className="space-y-1 font-sans text-xs">
              <p className="text-slate-500">
                Invoice Number: <span className="font-mono text-slate-800 font-bold">{invoiceData.invoiceNumber}</span>
              </p>
              <p className="text-slate-500">
                Issue Date: <span className="text-slate-800 font-medium">{formatDate(invoiceData.issueDate)}</span>
              </p>
              <p className="text-slate-500">
                Due Date: <span className="text-slate-800 font-bold">{formatDate(invoiceData.dueDate)}</span>
              </p>
              <p className="text-slate-500">
                Status:{' '}
                <span className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border
                  ${invoiceData.status === 'PAID' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : invoiceData.status === 'SENT' ? 'bg-amber-50 border-amber-200 text-amber-600' : invoiceData.status === 'OVERDUE' ? 'bg-red-50 border-red-200 text-red-655' : 'bg-slate-50 border-slate-200 text-slate-600'}
                `}>
                  {t(`invoices.status${invoiceData.status.charAt(0) + invoiceData.status.slice(1).toLowerCase()}`)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Bill To details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{t('invoiceDetail.billTo')}</h3>
            <h4 className="font-serif text-md font-bold text-slate-800">{invoiceData.client?.name}</h4>
            <div className="text-xs text-slate-500 mt-1.5 space-y-1">
              {invoiceData.client?.address && <p>{invoiceData.client.address}</p>}
              <p>Email: {invoiceData.client?.email}</p>
              {invoiceData.client?.phone && <p>Phone: {invoiceData.client.phone}</p>}
            </div>
          </div>
        </div>

        {/* Row 3: Itemized Table */}
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">{t('invoiceForm.tableColDesc')}</th>
                <th className="px-6 py-4 text-center w-20">{t('invoiceForm.tableColQty')}</th>
                <th className="px-6 py-4 text-right w-32">{t('invoiceForm.tableColPrice')}</th>
                <th className="px-6 py-4 text-right w-36">{t('common.total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {(invoiceData.items || []).map((item, idx) => (
                <tr 
                  key={item.id}
                  className={idx % 2 === 1 ? 'bg-slate-50/30' : ''}
                >
                  <td className="px-6 py-4 text-slate-700 font-medium">{item.description}</td>
                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                    {formatMoney(Number(item.unitPrice), invoiceData.currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-800 font-semibold">
                    {formatMoney(Number(item.total), invoiceData.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row 4: Totals Summary block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4">
          {/* Notes column */}
          <div className="sm:max-w-md w-full">
            {invoiceData.notes && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t('invoiceDetail.notesTitle')}</h4>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{invoiceData.notes}</p>
              </div>
            )}
          </div>

          {/* Calculations column */}
          <div className="w-full sm:w-64 space-y-3 text-sm border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{t('invoiceDetail.subtotalLabel')}</span>
              <span className="font-mono text-slate-800 font-medium">
                {formatMoney(Number(invoiceData.subtotal), invoiceData.currency)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{t('invoiceDetail.taxLabel')} ({(Number(invoiceData.taxRate) * 100).toFixed(0)}%)</span>
              <span className="font-mono text-slate-800 font-medium">
                {formatMoney(Number(invoiceData.taxAmount), invoiceData.currency)}
              </span>
            </div>

            {Number(invoiceData.discount) > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t('invoiceDetail.discountLabel')}</span>
                <span className="font-mono text-red-500 font-medium">
                  - {formatMoney(Number(invoiceData.discount), invoiceData.currency)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 my-1"></div>

            <div className="flex justify-between items-center font-bold text-slate-800">
              <span>{t('invoiceDetail.grandTotalLabel')}</span>
              <span className="font-mono text-lg text-slate-900">
                {formatMoney(Number(invoiceData.total), invoiceData.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={() => setConfirmDelete(false)}></div>

          {/* Dialog Panel */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-6 text-center">
            <div className="mx-auto bg-red-500/10 text-red-400 border border-red-500/20 w-12 h-12 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-slate-100">{t('invoiceDetail.deleteTitle')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('invoiceDetail.deleteText', { number: invoiceData.invoiceNumber })}
              </p>
            </div>

            <div className="flex gap-3.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 px-4 bg-navy-850 hover:bg-navy-800 border border-navy-800 text-slate-600 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center"
              >
                {deleteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{t('common.delete')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
