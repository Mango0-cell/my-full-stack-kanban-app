'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useRegisterMutation } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/hooks/redux';
import { clearCredentials, setCredentials } from '@/lib/store/slices/authSlice';
import { baseApi } from '@/lib/store/api/baseApi';
import { disconnectRealtime } from '@/lib/realtime/socket';
import { clearClientSessionState } from '@/lib/utils/sessionState';

const registerSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').regex(/@gmail\.com$/i, 'Only Gmail addresses are allowed'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register_, { isLoading }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    try {
      disconnectRealtime();
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      clearClientSessionState();
      const result = await register_({
        email: data.email,
        password: data.password,
        display_name: data.display_name,
      }).unwrap();
      Cookies.set('kanban_token', result.data.token, { expires: 7 });
      dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
      toast.success('Account created!');
      router.replace('/board');
    } catch (err: unknown) {
      const message =
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? 'Registration failed';
      toast.error(message);
    }
  }

  return (
    <div
      className="kf-glass-panel w-full max-w-[440px] p-8 rounded-xl relative overflow-hidden backdrop-blur-xl"
      style={{ borderRadius: '0.5rem', backgroundColor: 'rgba(8,9,10,0.75)' }}
    >
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <span
          className="kf-mono-label block mb-3 pl-3"
          style={{ color: 'var(--kf-secondary)', borderLeft: '2px solid var(--kf-secondary)' }}
        >
          Auth Module 02
        </span>
        <h2 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--kf-on-surface)' }}>
          Create account
        </h2>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--kf-on-surface-variant)', opacity: 0.8 }}>
          Register to access your production workspace.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Display name */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label htmlFor="display_name" className="kf-mono-label" style={{ color: 'rgba(199,196,215,0.7)' }}>
              Identity // Name
            </label>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="display_name"
              type="text"
              placeholder="Alice Smith"
              className="w-full bg-transparent border-none text-sm py-3.5 px-0 outline-none"
              style={{ color: 'var(--kf-on-surface)', caretColor: 'var(--kf-secondary)' }}
              {...register('display_name')}
            />
          </div>
          <div style={{ minHeight: '1rem' }} className="px-1">
            {errors.display_name && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.display_name.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label htmlFor="email" className="kf-mono-label" style={{ color: 'rgba(199,196,215,0.7)' }}>
              Identity // Email
            </label>
            <span style={{ color: 'rgba(199,196,215,0.4)', fontSize: '0.75rem' }}>@</span>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="email"
              type="email"
              placeholder="engineer@kanban.io"
              className="w-full bg-transparent border-none text-sm py-3.5 px-0 outline-none"
              style={{ color: 'var(--kf-on-surface)', caretColor: 'var(--kf-secondary)' }}
              {...register('email')}
            />
          </div>
          <div style={{ minHeight: '1rem' }} className="px-1">
            {errors.email && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label htmlFor="password" className="kf-mono-label" style={{ color: 'rgba(199,196,215,0.7)' }}>
              Security // Key
            </label>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="w-full bg-transparent border-none text-sm py-3.5 px-0 outline-none"
              style={{ color: 'var(--kf-on-surface)', caretColor: 'var(--kf-secondary)' }}
              {...register('password')}
            />
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((v) => !v)}
              className="ml-2 flex-shrink-0"
              style={{ color: 'rgba(199,196,215,0.4)', transition: 'color 0.2s' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ minHeight: '1rem' }} className="px-1">
            {errors.password && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label htmlFor="confirm_password" className="kf-mono-label" style={{ color: 'rgba(199,196,215,0.7)' }}>
              Security // Confirm
            </label>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="w-full bg-transparent border-none text-sm py-3.5 px-0 outline-none"
              style={{ color: 'var(--kf-on-surface)', caretColor: 'var(--kf-secondary)' }}
              {...register('confirm_password')}
            />
            <button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => setShowConfirm((v) => !v)}
              className="ml-2 flex-shrink-0"
              style={{ color: 'rgba(199,196,215,0.4)', transition: 'color 0.2s' }}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ minHeight: '1rem' }} className="px-1">
            {errors.confirm_password && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.confirm_password.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="kf-btn kf-inner-glow w-full py-4 rounded-lg text-sm font-bold tracking-tighter flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--kf-secondary)',
            color: 'var(--kf-on-secondary-container)',
            letterSpacing: '-0.02em',
          }}
          aria-label="Create account"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>CREATE ACCOUNT</span>
              <ArrowRight size={16} className="group-hover:translate-x-1" style={{ transition: 'transform 0.2s' }} />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p className="text-xs" style={{ color: 'rgba(199,196,215,0.6)' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold underline underline-offset-4"
            style={{
              color: 'var(--kf-primary)',
              textDecorationColor: 'rgba(192,193,255,0.3)',
              marginLeft: '0.5rem',
            }}
          >
            Sign In
          </Link>
        </p>
      </footer>
    </div>
  );
}
