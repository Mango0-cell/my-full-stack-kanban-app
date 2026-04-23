'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, User as UserIcon, Shield, Bell, Eye } from 'lucide-react';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetUserByIdQuery,
} from '@/lib/store/api/usersApi';

const profileSchema = z.object({
  display_name: z.string().min(2, 'At least 2 characters'),
  bio: z.string().max(500).optional(),
  job_title: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Required'),
  new_password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

function InputField({
  label, id, type = 'text', placeholder, error, register,
}: {
  label: string; id: string; type?: string; placeholder?: string;
  error?: string;
  register: ReturnType<typeof useForm<ProfileForm | PasswordForm>>['register'] extends (...args: infer A) => infer R ? (...args: A) => R : never;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-widest block mb-2"
             style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
        style={{
          backgroundColor: 'var(--color-surface-4)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--color-text-primary)',
        }}
      />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const isExternalProfileView = selectedUserId !== null;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = new URLSearchParams(window.location.search).get('userId');
    const parsed = value ? Number(value) : NaN;
    setSelectedUserId(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }, []);

  const { data, isLoading } = useGetProfileQuery();
  const { data: externalProfileData, isLoading: isExternalProfileLoading } = useGetUserByIdQuery(selectedUserId ?? 0, {
    skip: !selectedUserId,
  });
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();
  const user = isExternalProfileView ? externalProfileData?.data : data?.data;

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) {
      resetProfile({
        display_name: user.display_name,
        bio: user.bio ?? '',
        job_title: user.job_title ?? '',
        location: user.location ?? '',
        website_url: user.website_url ?? '',
      });
    }
  }, [user, resetProfile]);

  async function onProfileSubmit(formData: ProfileForm) {
    try {
      await updateProfile(formData).unwrap();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  }

  async function onPasswordSubmit(formData: PasswordForm) {
    try {
      await changePassword({ current_password: formData.current_password, new_password: formData.new_password }).unwrap();
      toast.success('Password changed');
      resetPassword();
    } catch {
      toast.error('Failed to change password');
    }
  }

  const initials = user?.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  if (isExternalProfileView) {
    return (
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
          User Profile
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Viewing selected teammate profile.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
                Public information
              </h3>
              {isExternalProfileLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 rounded-md animate-pulse" style={{ backgroundColor: 'var(--color-surface-4)' }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Name:</span> {user?.display_name ?? '—'}
                  </p>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Email:</span> {user?.email ?? '—'}
                  </p>
                  <p style={{ color: 'var(--color-text-primary)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Bio:</span> {user?.bio || 'No bio available'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="p-6 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4"
                style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: 'var(--color-brand-400)' }}
              >
                {initials}
              </div>
              <h4 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {isExternalProfileLoading ? '...' : user?.display_name ?? 'User'}
              </h4>
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {isExternalProfileLoading ? '...' : user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      {/* Header */}
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Profile
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Manage your personal information and security.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column — forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile details card */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="h-5 w-5" style={{ color: 'var(--color-brand-400)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Personal Info</h3>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 rounded-md animate-pulse" style={{ backgroundColor: 'var(--color-surface-4)' }} />
                ))}
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="display_name" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Display Name
                  </label>
                  <input
                    id="display_name"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                    }}
                    {...regProfile('display_name')}
                  />
                  {profileErrors.display_name && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{profileErrors.display_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bio" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Bio
                  </label>
                  <input
                    id="bio"
                    placeholder="Tell us about yourself"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                    }}
                    {...regProfile('bio')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job_title" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                           style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Job Title
                    </label>
                    <input
                      id="job_title"
                      placeholder="Software Engineer"
                      className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                      style={{
                        backgroundColor: 'var(--color-surface-4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--color-text-primary)',
                      }}
                      {...regProfile('job_title')}
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                           style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Location
                    </label>
                    <input
                      id="location"
                      placeholder="City, Country"
                      className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                      style={{
                        backgroundColor: 'var(--color-surface-4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--color-text-primary)',
                      }}
                      {...regProfile('location')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="website_url" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                         style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Website
                  </label>
                  <input
                    id="website_url"
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--color-surface-4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--color-text-primary)',
                    }}
                    {...regProfile('website_url')}
                  />
                  {profileErrors.website_url && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{profileErrors.website_url.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-brand-500)',
                    color: '#ffffff',
                    boxShadow: '0 0 15px rgba(99,102,241,0.2)',
                  }}
                >
                  {updatingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />}
                  Save Changes
                </button>
              </form>
            )}
          </div>

          {/* Password card */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5" style={{ color: 'var(--color-brand-400)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Security</h3>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <div>
                <label htmlFor="current_password" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                       style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Current Password
                </label>
                <input
                  id="current_password"
                  type="password"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-surface-4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--color-text-primary)',
                  }}
                  {...regPassword('current_password')}
                />
                {passwordErrors.current_password && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{passwordErrors.current_password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="new_password" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                       style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  New Password
                </label>
                <input
                  id="new_password"
                  type="password"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-surface-4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--color-text-primary)',
                  }}
                  {...regPassword('new_password')}
                />
                {passwordErrors.new_password && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{passwordErrors.new_password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm_password" className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                       style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--color-surface-4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--color-text-primary)',
                  }}
                  {...regPassword('confirm_password')}
                />
                {passwordErrors.confirm_password && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{passwordErrors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {changingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />}
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Right column — user card + prefs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Avatar card */}
          <div className="p-6 rounded-xl text-center" style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-4"
              style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: 'var(--color-brand-400)' }}
            >
              {initials}
            </div>
            <h4 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {isLoading ? '...' : user?.display_name ?? 'User'}
            </h4>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {isLoading ? '...' : user?.email}
            </p>
            {user?.job_title && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{user.job_title}</p>
            )}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest"
                    style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: 'var(--color-brand-400)' }}>
                Pro Member
              </span>
            </div>
          </div>

          {/* Preferences card */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h5 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Preferences</h5>
            <div className="space-y-4">
              {[
                { icon: Bell, label: 'Email Notifications', desc: 'Receive updates via email' },
                { icon: Eye, label: 'Activity Status', desc: 'Show when you are online' },
              ].map((pref) => {
                const Icon = pref.icon;
                return (
                  <div key={pref.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{pref.label}</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{pref.desc}</p>
                      </div>
                    </div>
                    <div
                      className="w-9 h-5 rounded-full relative cursor-pointer"
                      style={{ backgroundColor: 'var(--color-brand-500)' }}
                    >
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
