'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { Check, Sparkles, Info, MoreVertical, UserPlus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PricingSection = dynamic(() => import('@/components/ui/pricing-section'), { ssr: false });
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  message: z.string().optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function MembersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState('Admin');
  const { data: meData } = useGetMeQuery();
  const user = meData?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', message: '' },
  });

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const onInviteSubmit = (data: InviteFormData) => {
    toast.success(`Invite sent to ${data.email}`);
    reset();
    setInviteOpen(false);
  };

  const handleRoleChange = (role: string) => {
    setCurrentRole(role);
    toast.success(`Role changed to ${role}`);
  };

  const handleRemoveMember = () => {
    setConfirmRemove(false);
    toast.success('Member removed');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-6" style={{ color: 'var(--color-text-primary)' }}>
          Team Settings
        </h1>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Team Members</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Manage who has access to this project.
              </p>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: 'var(--color-brand-500)',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(99,102,241,0.2)',
              }}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite Member</span>
            </button>
          </div>

          {/* Member: current user */}
          <div className="space-y-1">
            <div
              className="group flex items-center justify-between p-4 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-2)';
              }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: 'var(--color-brand-400)' }}
                  >
                    {initials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                        style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-surface-2)' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {user?.display_name ?? 'User'}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest"
                      style={{
                        backgroundColor: 'rgba(99,102,241,0.1)',
                        color: 'var(--color-brand-400)',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      You
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {user?.email ?? 'user@kanban.app'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}>
                  {currentRole}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button style={{ color: 'var(--color-text-secondary)' }}>
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    style={{ backgroundColor: 'var(--color-surface-0)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger
                        className="text-sm"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Change Role
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent
                        style={{ backgroundColor: 'var(--color-surface-0)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {['Admin', 'Editor', 'Viewer'].map((role) => (
                          <DropdownMenuItem
                            key={role}
                            className="text-sm cursor-pointer"
                            style={{ color: 'var(--color-text-primary)' }}
                            onClick={() => handleRoleChange(role)}
                          >
                            {role}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <DropdownMenuItem
                      className="text-sm cursor-pointer"
                      style={{ color: '#ef4444' }}
                      onClick={() => setConfirmRemove(true)}
                    >
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Plan card */}
          <div className="p-6 rounded-xl relative overflow-hidden"
               style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12"
                 style={{ backgroundColor: 'rgba(99,102,241,0.1)' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest"
                      style={{
                        backgroundColor: 'rgba(99,102,241,0.15)',
                        color: 'var(--color-brand-400)',
                        border: '1px solid rgba(99,102,241,0.3)',
                      }}>
                  Current Plan
                </span>
                <Sparkles className="h-5 w-5" style={{ color: 'var(--color-brand-400)' }} />
              </div>
              <h4 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Pro Plan</h4>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Billed monthly at $24/user
              </p>
              <div className="space-y-3 mb-8">
                {['Unlimited Projects', 'Advanced Analytics', '100GB Storage'].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-primary)' }}>
                    <Check className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
                    {feature}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSubscriptionOpen(true)}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Manage Subscription
              </button>
            </div>
          </div>

          {/* Usage card */}
          <div className="p-6 rounded-xl"
               style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Team Usage</h5>
              <span className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                1 / 10 Members
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: 'var(--color-surface-4)' }}>
              <div className="w-[10%] h-full rounded-full"
                   style={{ backgroundColor: 'var(--color-brand-500)', boxShadow: '0 0 8px rgba(99,102,241,0.4)' }} />
            </div>
            <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              9 seats remaining in your current billing cycle.
            </p>
          </div>

          {/* Info card */}
          <div className="p-4 rounded-xl flex gap-4"
               style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Info className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} />
            <div className="space-y-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>New Feature</span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(16,185,129,0.8)' }}>
                Role-based access control (RBAC) is now active for all Pro users. Configure custom permissions in the advanced tab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Invite Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-5 mt-2">
            <div>
              <label
                className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Recipient Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="colleague@company.com"
                className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="text-[11px] font-medium uppercase tracking-widest block mb-2"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Message
              </label>
              <textarea
                {...register('message')}
                placeholder="Add a personal message..."
                rows={3}
                className="w-full px-3 py-2 rounded-md text-sm outline-none transition-all duration-150 resize-none"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { reset(); setInviteOpen(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-4)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: 'var(--color-brand-500)',
                  color: '#ffffff',
                  boxShadow: '0 0 15px rgba(99,102,241,0.2)',
                }}
              >
                Send Invite
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Remove Member</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to remove this member? They will lose access to all projects.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setConfirmRemove(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-4)',
                color: 'var(--color-text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemoveMember}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
              }}
            >
              Remove
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subscription Modal */}
      <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
        <DialogContent
          className="sm:max-w-5xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{
            backgroundColor: '#000000',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <PricingSection />
        </DialogContent>
      </Dialog>
    </div>
  );
}
