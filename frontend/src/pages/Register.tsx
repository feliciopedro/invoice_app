import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { AuthResponse } from '@/types';
import toast from 'react-hot-toast';
import { Receipt, Mail, Lock, User, Briefcase, MapPin, ArrowRight, Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
});

type RegisterFormInput = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        toast.success('Account registered successfully');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register account';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative Blur Spheres */}
      <div className="absolute w-[400px] h-[400px] bg-amber-gold/5 rounded-full blur-[100px] -top-32 -left-32 pointer-events-none"></div>
      <div className="absolute w-[450px] h-[450px] bg-blue-500/5 rounded-full blur-[120px] -bottom-32 -right-32 pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 bg-navy-900 border border-navy-800/80 p-8 md:p-10 rounded-2xl shadow-xl z-10">
        {/* Top Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="bg-amber-gold/10 p-3.5 rounded-xl border border-amber-gold/20 mb-4">
            <Receipt className="w-8 h-8 text-amber-gold" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-100">Ledger</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">Create Business Account</p>
        </div>

        {/* Register Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name')}
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                    ${errors.name ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="john@company.com"
                  {...register('email')}
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                    ${errors.email ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`
                    w-full pl-10 pr-10 py-2.5 rounded-lg bg-navy-950 border text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm
                    ${errors.password ? 'border-red-500/80 ring-1 ring-red-500/30' : 'border-navy-800'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Business Name (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  {...register('businessName')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm"
                />
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Business Address (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="123 Main St, City, Country"
                  {...register('businessAddress')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-navy-950 border border-navy-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-gold focus:border-amber-gold transition text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-amber-gold hover:bg-amber-500 disabled:bg-amber-gold/50 text-navy-950 font-bold text-sm rounded-lg shadow-lg hover:shadow-amber-gold/5 transition-all flex items-center justify-center gap-2 group cursor-pointer mt-6"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Redirect */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-gold font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
