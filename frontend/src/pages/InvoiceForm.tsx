import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import api from '@/services/api';
import { Client, Invoice, ApiResponse, CreateInvoiceData } from '@/types';
import { Spinner } from '@/components/Spinner';
import toast from 'react-hot-toast';
import { SUPPORTED_CURRENCIES, formatMoney } from '@/utils/currency';

import { 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Info 
} from 'lucide-react';

// Zod Schema matching backend validation
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.number().nonnegative('Price must be 0 or greater'),
});

const invoiceFormSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
  taxRate: z.number().nonnegative('Tax rate must be 0 or greater'),
  discount: z.number().nonnegative('Discount must be 0 or greater'),
  currency: z.string().min(1).max(10),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
});

type InvoiceFormInput = z.infer<typeof invoiceFormSchema>;



export const InvoiceForm: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 1. Fetch Clients
  const { data: clientsData, isLoading: isClientsLoading } = useQuery({
    queryKey: ['formClients'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Client[]>>('/clients');
      return response.data.data;
    },
  });

  // 2. Fetch Invoice (if in edit mode)
  const { data: invoiceData, isLoading: isInvoiceLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: '',
      dueDate: '',
      status: 'DRAFT',
      taxRate: 0,
      discount: 0,
      currency: 'USD',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Pre-fill form on edit mode
  useEffect(() => {
    if (isEditMode && invoiceData) {
      // If invoice is already PAID or SENT, warn user and redirect
      if (invoiceData.status !== 'DRAFT') {
        toast.error('Only DRAFT invoices can be updated.');
        navigate(`/invoices/${id}`);
        return;
      }

      reset({
        clientId: invoiceData.clientId,
        dueDate: invoiceData.dueDate.split('T')[0] || '',
        status: invoiceData.status,
        taxRate: Number(invoiceData.taxRate) * 100, // display as percentage in UI
        discount: Number(invoiceData.discount),
        currency: invoiceData.currency,
        notes: invoiceData.notes || '',
        items: (invoiceData.items || []).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      });
    }
  }, [isEditMode, invoiceData, reset, navigate, id]);

  // Live Watch Calculations
  const watchItems = useWatch({ control, name: 'items' }) || [];
  const watchTaxRate = useWatch({ control, name: 'taxRate' }) || 0;
  const watchDiscount = useWatch({ control, name: 'discount' }) || 0;
  const watchCurrency = useWatch({ control, name: 'currency' }) || 'USD';

  // Calculate totals in real-time
  const subtotal = watchItems.reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const taxAmount = subtotal * (Number(watchTaxRate) / 100);
  const total = subtotal + taxAmount - Number(watchDiscount);

  // Invoice Mutation (Create / Update)
  const invoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      if (isEditMode) {
        const response = await api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, data);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<Invoice>>('/invoices', data);
        return response.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || (isEditMode ? 'Invoice updated' : 'Invoice created'));
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      navigate(`/invoices/${res.data.id}`);
    },
    onError: (error: any) => {
      console.error('Invoice mutation error:', error);
      const msg = error.response?.data?.message || 'Failed to save invoice';
      toast.error(msg);
    },
  });

  const handleFormSubmit = (data: InvoiceFormInput, status: 'DRAFT' | 'SENT') => {
    // Transform UI taxRate (percentage, e.g. 15) to backend rate (decimal, e.g. 0.15)
    const backendData: CreateInvoiceData = {
      ...data,
      taxRate: data.taxRate / 100,
      status,
    };
    invoiceMutation.mutate(backendData);
  };

  const isLoading = isClientsLoading || (isEditMode && isInvoiceLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" label={t('invoiceForm.newTitle')} />
      </div>
    );
  }

  const clients = clientsData || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Panel */}
      <div className="flex items-center gap-4">
        <Link 
          to={isEditMode ? `/invoices/${id}` : '/invoices'} 
          className="p-2 bg-navy-900 border border-navy-800 hover:border-navy-700 text-slate-550 hover:text-slate-700 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">
            {isEditMode ? t('invoiceForm.editTitle') : t('invoiceForm.newTitle')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isEditMode ? t('invoiceForm.editSubtitle', { number: invoiceData?.invoiceNumber }) : t('invoiceForm.newSubtitle')}
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Invoice Details & Items Form (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Block */}
          <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-5">
            <h2 className="font-serif text-lg font-bold text-slate-100 border-b border-navy-800/40 pb-2.5">
              {t('invoiceForm.detailsTitle')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('invoices.clientLabel')}
                </label>
                <select
                  {...register('clientId')}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm
                    ${errors.clientId ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                >
                  <option value="">{t('invoiceForm.selectClientPlaceholder')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
                {errors.clientId ? (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.clientId.message}</p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-500">
                    {t('invoiceForm.selectClientPlaceholder') === '' ? '' : (
                      <>
                        Don't see your client?{' '}
                        <Link to="/clients" className="text-amber-gold hover:underline font-semibold">
                          {t('invoiceForm.addClientLink')}
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('invoiceForm.dueLabel')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    {...register('dueDate')}
                    className={`
                      w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm
                      ${errors.dueDate ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                    `}
                  />
                </div>
                {errors.dueDate && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('common.currency')}
                </label>
                <select
                  {...register('currency')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tax Rate (UI percentage) */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('invoiceForm.taxRateLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  {...register('taxRate', { valueAsNumber: true })}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm
                    ${errors.taxRate ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
                {errors.taxRate && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.taxRate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Block */}
          <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-5">
            <div className="flex items-center justify-between border-b border-navy-800/40 pb-2.5">
              <h2 className="font-serif text-lg font-bold text-slate-100">{t('invoiceForm.lineItemsTitle')}</h2>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="flex items-center gap-1 text-xs font-bold text-amber-gold hover:text-amber-500 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('invoiceForm.addItemBtn')}</span>
              </button>
            </div>

            {errors.items?.message && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errors.items.message}</span>
              </div>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className="grid grid-cols-12 gap-3 items-start p-3 bg-navy-950/40 border border-navy-800/40 rounded-lg relative group"
                >
                  {/* Description (Col 6) */}
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[8px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 sm:hidden">
                      {t('invoiceForm.tableColDesc')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('invoiceForm.descPlaceholder')}
                      {...register(`items.${index}.description`)}
                      className={`
                        w-full px-3 py-2 rounded-lg bg-navy-950 border text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-gold
                        ${errors.items?.[index]?.description ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-navy-800'}
                      `}
                    />
                  </div>

                  {/* Quantity (Col 2) */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[8px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 sm:hidden">
                      {t('invoiceForm.tableColQty')}
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className={`
                        w-full px-3 py-2 rounded-lg bg-navy-950 border text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-gold text-right
                        ${errors.items?.[index]?.quantity ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-navy-800'}
                      `}
                    />
                  </div>

                  {/* Unit Price (Col 2) */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[8px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 sm:hidden">
                      {t('invoiceForm.tableColPrice')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      className={`
                        w-full px-3 py-2 rounded-lg bg-navy-950 border text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-gold text-right
                        ${errors.items?.[index]?.unitPrice ? 'border-red-500/80 ring-1 ring-red-500/20' : 'border-navy-800'}
                      `}
                    />
                  </div>

                  {/* Row Total (Col 2) */}
                  <div className="col-span-3 sm:col-span-1.5 flex flex-col justify-center h-full sm:pt-2 sm:text-right pr-2">
                    <span className="block text-[8px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 sm:hidden">
                      {t('common.total')}
                    </span>
                    <span className="font-mono text-xs text-slate-350 font-medium">
                      {((Number(watchItems[index]?.quantity) || 0) * (Number(watchItems[index]?.unitPrice) || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-center justify-end sm:pt-1">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-md transition cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Totals Panel & Actions (Col Span 1) */}
        <div className="space-y-6">
          {/* Real-time Totals Panel */}
          <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-5">
            <h2 className="font-serif text-lg font-bold text-slate-100 border-b border-navy-800/40 pb-2.5">
              {t('invoiceForm.summaryTitle')}
            </h2>

            <div className="space-y-4">
              {/* Discount Input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('invoiceForm.discountLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('discount', { valueAsNumber: true })}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm
                    ${errors.discount ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
                {errors.discount && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.discount.message}</p>
                )}
              </div>

              {/* Summary Calculations */}
              <div className="bg-navy-950/40 p-4 border border-navy-800/60 rounded-lg space-y-3.5 font-sans">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t('invoiceDetail.subtotalLabel')}</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatMoney(subtotal, watchCurrency)}
                  </span>
                </div>

                {/* Tax Amount */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t('invoiceDetail.taxLabel')} ({Number(watchTaxRate)}%)</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {formatMoney(taxAmount, watchCurrency)}
                  </span>
                </div>

                {/* Discount */}
                {watchDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{t('invoiceDetail.discountLabel')}</span>
                    <span className="font-mono text-red-500 font-semibold">
                      - {formatMoney(Number(watchDiscount), watchCurrency)}
                    </span>
                  </div>
                )}

                {/* Separator */}
                <div className="border-t border-navy-800/80 my-1"></div>

                {/* Grand Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-200">{t('invoiceDetail.grandTotalLabel')}</span>
                  <span className="font-mono text-lg font-bold text-slate-900">
                    {formatMoney(total, watchCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-3">
            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSubmit((data) => handleFormSubmit(data, 'DRAFT'))}
              disabled={invoiceMutation.isPending}
              className="w-full py-3.5 px-4 bg-navy-800 hover:bg-navy-750 border border-navy-800 hover:border-navy-700 text-slate-700 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{t('invoiceForm.saveDraftBtn')}</span>
            </button>

            {/* Save & Send */}
            <button
              type="button"
              onClick={handleSubmit((data) => handleFormSubmit(data, 'SENT'))}
              disabled={invoiceMutation.isPending}
              className="w-full py-3.5 px-4 bg-amber-gold hover:bg-amber-500 disabled:bg-amber-gold/50 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {invoiceMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" />
                  <span>{t('invoiceForm.saveSentBtn')}</span>
                </>
              )}
            </button>

            <Link
              to={isEditMode ? `/invoices/${id}` : '/invoices'}
              className="block w-full py-3 px-4 bg-transparent hover:bg-navy-850 text-center text-slate-400 hover:text-slate-200 font-bold text-xs rounded-lg transition"
            >
              {t('invoiceForm.discardBtn')}
            </Link>
          </div>

          {/* Notes Block */}
          <div className="bg-navy-900 border border-navy-800/80 p-6 rounded-xl space-y-4">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {t('invoiceForm.notesPlaceholder') === '' ? '' : t('invoiceDetail.notesTitle')}
            </label>
            <textarea
              rows={4}
              placeholder={t('invoiceForm.notesPlaceholder')}
              {...register('notes')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-amber-gold text-xs leading-relaxed resize-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
