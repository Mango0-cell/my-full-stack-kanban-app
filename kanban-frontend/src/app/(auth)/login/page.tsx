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
import { useLoginMutation } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/hooks/redux';
import { clearCredentials, setCredentials } from '@/lib/store/slices/authSlice';
import { baseApi } from '@/lib/store/api/baseApi';
import { disconnectRealtime } from '@/lib/realtime/socket';
import { clearClientSessionState } from '@/lib/utils/sessionState';

const loginSchema = z.object({
  email: z.string().email('Invalid email address').regex(/@gmail\.com$/i, 'Only Gmail addresses are allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    try {
      disconnectRealtime();
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      clearClientSessionState();
      const result = await login(data).unwrap();
      Cookies.set('kanban_token', result.data.token, { expires: 7 });
      dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
      toast.success('Welcome back!');
      router.replace('/board');
    } catch (err: unknown) {
      const message =
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message ?? 'Login failed';
      toast.error(message);
    }
  }

  return (
    <div
      className="kf-glass-panel w-full max-w-[440px] p-10 rounded-xl relative overflow-hidden backdrop-blur-xl"
      style={{ borderRadius: '0.5rem', backgroundColor: 'rgba(8,9,10,0.75)' }}
    >
      {/* Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <span
          className="kf-mono-label block mb-3 pl-3"
          style={{
            color: 'var(--kf-primary)',
            borderLeft: '2px solid var(--kf-primary)',
          }}
        >
          Auth Module 01
        </span>
        <h2
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'var(--kf-on-surface)' }}
        >
          Welcome back
        </h2>
        <p
          className="text-sm mt-3 leading-relaxed"
          style={{ color: 'var(--kf-on-surface-variant)', opacity: 0.8 }}
        >
          Identify to access your production workspace.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email field */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label
              htmlFor="email"
              className="kf-mono-label"
              style={{ color: 'rgba(199,196,215,0.7)' }}
            >
              Identity // Email
            </label>
            <span style={{ color: 'rgba(199,196,215,0.4)', fontSize: '0.75rem' }}>@</span>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="email"
              type="email"
              placeholder="engineer@kanban.io"
              className="w-full bg-transparent border-none text-sm py-4 px-0 outline-none"
              style={{
                color: 'var(--kf-on-surface)',
                caretColor: 'var(--kf-secondary)',
              }}
              {...register('email')}
            />
          </div>
          <div style={{ minHeight: '1.25rem' }} className="px-1">
            {errors.email && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline px-1">
            <label
              htmlFor="password"
              className="kf-mono-label"
              style={{ color: 'rgba(199,196,215,0.7)' }}
            >
              Security // Key
            </label>
            <Link
              href="#"
              className="kf-mono-label"
              style={{
                color: 'var(--kf-primary)',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              FORGOT?
            </Link>
          </div>
          <div className="kf-auth-field flex items-center rounded-lg px-4">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="w-full bg-transparent border-none text-sm py-4 px-0 outline-none"
              style={{
                color: 'var(--kf-on-surface)',
                caretColor: 'var(--kf-secondary)',
              }}
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
          <div style={{ minHeight: '1.25rem' }} className="px-1">
            {errors.password && (
              <p className="kf-mono-label" style={{ color: 'var(--kf-error)', fontSize: '0.6rem' }}>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="kf-btn kf-inner-glow w-full py-4 rounded-lg text-sm font-bold tracking-tighter flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--kf-secondary)',
            color: 'var(--kf-on-secondary-container)',
            letterSpacing: '-0.02em',
          }}
          aria-label="Sign in"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>SIGN IN</span>
              <ArrowRight
                size={16}
                style={{ transition: 'transform 0.2s' }}
                className="group-hover:translate-x-1"
              />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative py-3 flex items-center">
          <div className="flex-grow" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          <span
            className="kf-mono-label flex-shrink mx-6"
            style={{ fontSize: '0.55rem', color: 'rgba(144,143,160,0.5)' }}
          >
            External Federation
          </span>
          <div className="flex-grow" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        </div>

        {/* GitHub button */}
        <button
          type="button"
          className="kf-btn w-full py-4 rounded-lg text-sm font-medium flex items-center justify-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--kf-on-surface)',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          Continue with GitHub
        </button>
      </form>

      {/* Footer */}
      <footer style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p className="text-xs" style={{ color: 'rgba(199,196,215,0.6)' }}>
          New to the environment?{' '}
          <Link
            href="/register"
            className="font-bold underline underline-offset-4"
            style={{
              color: 'var(--kf-secondary)',
              textDecorationColor: 'rgba(78,222,163,0.3)',
              marginLeft: '0.5rem',
            }}
          >
            Create Account
          </Link>
        </p>
      </footer>
    </div>
  );
}
