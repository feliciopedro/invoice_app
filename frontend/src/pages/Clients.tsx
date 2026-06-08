import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import api from '@/services/api';
import { Client, ApiResponse } from '@/types';
import { Spinner } from '@/components/Spinner';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  UserPlus, 
  X,
  AlertTriangle 
} from 'lucide-react';

// Zod Schema for Client Form
const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormInput = z.infer<typeof clientSchema>;

export const Clients: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Delete Confirmation States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch Clients
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Client[]>>('/clients', {
        params: { search: search || undefined },
      });
      return response.data.data;
    },
  });

  // Client Mutate (Create / Update)
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormInput) => {
      if (editingClient) {
        const response = await api.patch<ApiResponse<Client>>(`/clients/${editingClient.id}`, data);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<Client>>('/clients', data);
        return response.data;
      }
    },
    onSuccess: (res) => {
      toast.success(res.message || (editingClient ? 'Client updated' : 'Client created'));
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      closeModal();
    },
    onError: (error: any) => {
      console.error('Client submission error:', error);
      const msg = error.response?.data?.message || 'Failed to save client';
      toast.error(msg);
    },
  });

  // Client Delete Mutate
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<any>>(`/clients/${id}`);
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Client deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setConfirmDeleteId(null);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete client. They might have active invoices.');
      setConfirmDeleteId(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientSchema),
  });

  const openAddModal = () => {
    setEditingClient(null);
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = (data: ClientFormInput) => {
    clientMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const clients = clientsData || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">{t('clients.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-gold hover:bg-amber-500 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-gold/5 transition-all cursor-pointer w-full sm:w-auto animate-none"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>{t('clients.addClientBtn')}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex bg-navy-900 border border-navy-800/80 p-4 rounded-xl items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder={t('clients.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none text-sm"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-350 font-medium"
          >
            {t('common.clear')}
          </button>
        )}
      </div>

      {/* Main Clients Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <Spinner label={t('common.loading')} />
        </div>
      ) : clients.length > 0 ? (
        <div className="bg-navy-900 border border-navy-800/80 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-950/40 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-navy-800/60">
                  <th className="px-6 py-4">{t('clients.tableColName')}</th>
                  <th className="px-6 py-4">{t('clients.tableColEmail')}</th>
                  <th className="px-6 py-4">{t('clients.tableColPhone')}</th>
                  <th className="px-6 py-4">{t('clients.tableColAddress')}</th>
                  <th className="px-6 py-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/40 text-sm">
                {clients.map((client, idx) => (
                  <tr 
                    key={client.id}
                    className={`
                      hover:bg-navy-800/20 transition-colors duration-150
                      ${idx % 2 === 1 ? 'bg-navy-950/10' : ''}
                    `}
                  >
                    <td className="px-6 py-4 font-serif text-slate-200 font-bold">{client.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-xs">
                      {client.address ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{client.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3.5">
                        <button
                          onClick={() => openEditModal(client)}
                          className="text-slate-500 hover:text-black transition cursor-pointer"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(client.id)}
                          className="text-slate-450 hover:text-red-600 transition cursor-pointer"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-navy-900 border border-navy-800/80 p-12 text-center text-slate-500 rounded-xl flex flex-col items-center justify-center gap-3">
          <Users className="w-10 h-10 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-400">{t('clients.noClients')}</p>
            <p className="text-xs text-slate-550 mt-1">{t('clients.noClientsSub')}</p>
          </div>
          <button
            onClick={openAddModal}
            className="mt-2 px-4 py-2 bg-navy-800 hover:bg-navy-750 border border-navy-800 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            {t('clients.addFirstClientBtn')}
          </button>
        </div>
      )}

      {/* ADD / EDIT CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 transition-opacity duration-300" onClick={closeModal}></div>

          {/* Dialog Container */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl z-10 space-y-6 relative">
            <button 
              onClick={closeModal} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-2xl font-bold text-slate-100">
                {editingClient ? t('clients.modalEditTitle') : t('clients.modalAddTitle')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {editingClient ? t('clients.modalEditSubtitle') : t('clients.modalAddSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('clients.clientNameLabel')}</label>
                <input
                  type="text"
                  placeholder="Acme Customer"
                  {...register('name')}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                    ${errors.name ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('common.email')}</label>
                <input
                  type="email"
                  placeholder="billing@customer.com"
                  {...register('email')}
                  className={`
                    w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                    ${errors.email ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('clients.phoneLabel')}</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  {...register('phone')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('clients.addressLabel')}</label>
                <input
                  type="text"
                  placeholder="456 Commerce Blvd, Suite 10"
                  {...register('address')}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3.5 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 bg-navy-850 hover:bg-navy-800 border border-navy-800 text-slate-700 font-bold text-sm rounded-lg transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={clientMutation.isPending}
                  className="flex-1 py-3 px-4 bg-amber-gold hover:bg-amber-500 disabled:bg-amber-gold/50 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {clientMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{editingClient ? t('common.save') : t('clients.addClientBtn')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 transition-opacity" onClick={() => setConfirmDeleteId(null)}></div>

          {/* Dialog Panel */}
          <div className="bg-navy-900 border border-navy-800 rounded-xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-6 text-center">
            <div className="mx-auto bg-red-500/10 text-red-400 border border-red-500/20 w-12 h-12 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-slate-100">{t('clients.confirmDeleteTitle')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('clients.confirmDeleteText')}
              </p>
            </div>

            <div className="flex gap-3.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 px-4 bg-navy-850 hover:bg-navy-800 border border-navy-800 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-650 disabled:bg-red-500/50 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center"
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
