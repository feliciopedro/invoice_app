import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { MeResponse, ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { 
  User as UserIcon, 
  Building, 
  MapPin, 
  Lock, 
  Upload, 
  ShieldAlert, 
  Image as ImageIcon,
  KeyRound,
  Eye,
  EyeOff,
  Globe
} from 'lucide-react';

// Common timezone definitions
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
];

// Zod schema for profile form
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  businessName: z.string().max(100, 'Business name cannot exceed 100 characters').optional().or(z.literal('')),
  businessAddress: z.string().max(250, 'Address cannot exceed 250 characters').optional().or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
});

type ProfileFormInput = z.infer<typeof profileSchema>;

// Zod schema for password form
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormInput = z.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      businessName: user?.businessName || '',
      businessAddress: user?.businessAddress || '',
      timezone: user?.timezone || 'UTC',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordSchema),
  });

  const getLogoUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (e.g., 2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onProfileSubmit = async (data: ProfileFormInput) => {
    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('businessName', data.businessName || '');
      formData.append('businessAddress', data.businessAddress || '');
      formData.append('timezone', data.timezone || 'UTC');
      
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      const response = await api.patch<MeResponse>('/auth/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        updateUser(response.data.data.user);
        setSelectedFile(null);
        toast.success(t('settings.profileTitle') + ' updated');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormInput) => {
    setIsChangingPassword(true);
    try {
      const response = await api.post<ApiResponse<any>>('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        toast.success(t('settings.securityTitle') + ' updated');
        resetPasswordForm();
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to change password. Make sure current password is correct.';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">{t('settings.title')}</h1>
        <p className="text-xs font-mono font-medium text-slate-500 uppercase tracking-widest mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-navy-900 border border-navy-800/80 rounded-xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute w-64 h-64 bg-amber-gold/2 rounded-full blur-[60px] -top-32 -left-32 pointer-events-none"></div>

            <h2 className="font-serif text-xl font-bold text-slate-200 border-b border-navy-800 pb-4 mb-6">{t('settings.profileTitle')}</h2>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              
              {/* Logo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-navy-800/50">
                <div className="relative group shrink-0">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Logo Preview" 
                      className="w-24 h-24 rounded-full border border-navy-700 object-cover bg-navy-950" 
                    />
                  ) : user?.logoUrl ? (
                    <img 
                      src={getLogoUrl(user.logoUrl)!} 
                      alt="Current Logo" 
                      className="w-24 h-24 rounded-full border border-navy-700 object-cover bg-navy-950" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-navy-950 border border-dashed border-navy-700 flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">No Logo</span>
                    </div>
                  )}

                  {/* Overlay upload icon */}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-amber-gold"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <h3 className="text-sm font-semibold text-slate-200">{t('settings.logoLabel')}</h3>
                  <p className="text-xs text-slate-500 max-w-xs">{t('settings.logoNotice')}</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="px-3.5 py-1.5 bg-navy-950 hover:bg-navy-800 border border-navy-800 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded transition cursor-pointer flex items-center gap-2 mx-auto sm:mx-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('settings.uploadBtn')}</span>
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.nameLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      {...registerProfile('name')}
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                        ${profileErrors.name ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                      `}
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{profileErrors.name.message}</p>
                  )}
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.businessNameLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Acme Corporation"
                      {...registerProfile('businessName')}
                      className={`
                        w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                        ${profileErrors.businessName ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                      `}
                    />
                  </div>
                  {profileErrors.businessName && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{profileErrors.businessName.message}</p>
                  )}
                </div>

                {/* Business Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.businessAddressLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 flex items-start text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <textarea
                      placeholder="123 Financial Way, Suite 100&#10;New York, NY 10001"
                      rows={4}
                      {...registerProfile('businessAddress')}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-655 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm resize-none
                        ${profileErrors.businessAddress ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                      `}
                    />
                  </div>
                  {profileErrors.businessAddress && (
                    <p className="mt-1.5 text-xs text-red-400 font-medium">{profileErrors.businessAddress.message}</p>
                  )}
                </div>

                {/* Timezone Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.timezoneLabel')}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Globe className="w-4 h-4" />
                    </span>
                    <select
                      {...registerProfile('timezone')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-gold text-sm"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-amber-gold hover:bg-amber-500 disabled:bg-amber-gold/50 text-navy-950 font-bold text-sm rounded-lg shadow-md hover:shadow-amber-gold/10 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('common.saving')}</span>
                    </>
                  ) : (
                    <span>{t('settings.saveProfileBtn')}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right 1 Column: Change Password */}
        <div className="space-y-6">
          <div className="bg-navy-900 border border-navy-800/80 rounded-xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute w-64 h-64 bg-red-500/2 rounded-full blur-[60px] -bottom-32 -right-32 pointer-events-none"></div>

            <h2 className="font-serif text-xl font-bold text-slate-200 border-b border-navy-800 pb-4 mb-6">{t('settings.securityTitle')}</h2>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.currentPasswordLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('currentPassword')}
                    className={`
                      w-full pl-10 pr-10 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                      ${passwordErrors.currentPassword ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.newPasswordLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('newPassword')}
                    className={`
                      w-full pl-10 pr-10 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                      ${passwordErrors.newPassword ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('settings.confirmPasswordLabel')}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerPassword('confirmPassword')}
                    className={`
                      w-full pl-10 pr-10 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                      ${passwordErrors.confirmPassword ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password notice */}
              <div className="p-3 bg-navy-950 border border-navy-800 rounded-lg flex gap-2.5 text-xs text-slate-500 leading-normal">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-gold/60 mt-0.5" />
                <span>{t('settings.passwordNotice')}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-2.5 bg-navy-950 hover:bg-navy-800 border border-navy-800 text-slate-200 font-bold text-sm rounded-lg hover:text-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {isChangingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('common.saving')}</span>
                  </>
                ) : (
                  <span>{t('settings.updatePasswordBtn')}</span>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
