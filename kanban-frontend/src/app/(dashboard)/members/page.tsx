'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, UserPlus, Send, ShieldAlert, Trash2, Sparkles, Check, Info, FolderKanban, Calendar } from 'lucide-react';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { getRealtimeSocket, connectRealtime } from '@/lib/realtime/socket';
import { useListNotificationsQuery } from '@/lib/store/api/notificationsApi';
import {
  useListMembersQuery,
  useListProjectsQuery,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from '@/lib/store/api/projectsApi';
import { useSearchUsersQuery } from '@/lib/store/api/usersApi';
import { useSendInviteMutation } from '@/lib/store/api/inviteApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const externalInviteSchema = z.object({
  email: z.string().email('Invalid email').regex(/@gmail\.com$/i, 'Only Gmail addresses are allowed'),
  message: z.string().optional(),
});

type ExternalInviteForm = z.infer<typeof externalInviteSchema>;
const PricingSection = dynamic(() => import('@/components/ui/pricing-section'), { ssr: false });

type InviteRole = 'admin' | 'editor' | 'viewer';

export default function MembersPage() {
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const { data: projectsData } = useListProjectsQuery();
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData?.data]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const activeProjectId = selectedProjectId ?? projects[0]?.project_id ?? null;
  const { data: membersData, refetch: refetchMembers } = useListMembersQuery(activeProjectId ?? 0, {
    skip: !activeProjectId,
  });
  const rawMembers = membersData?.data ?? [];

  // Sort: joined first, then pending
  const members = useMemo(
    () => [...rawMembers].sort((a, b) => {
      if (a.membership_status === 'joined' && b.membership_status === 'pending') return -1;
      if (a.membership_status === 'pending' && b.membership_status === 'joined') return 1;
      return 0;
    }),
    [rawMembers],
  );

  const [externalInviteOpen, setExternalInviteOpen] = useState(false);
  const [internalInviteOpen, setInternalInviteOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const { data: usersData } = useSearchUsersQuery(memberSearch.trim(), { skip: memberSearch.trim().length < 2 });
  const foundUsers = usersData?.data ?? [];

  // Role state for invitation dialogs
  const [externalInviteRole, setExternalInviteRole] = useState<InviteRole>('viewer');
  const [internalInviteRole, setInternalInviteRole] = useState<InviteRole>('viewer');

  const { refetch: refetchNotifications } = useListNotificationsQuery(5);
  const [sendInvite, { isLoading: isSendingInvite }] = useSendInviteMutation();
  const [updateMemberRole] = useUpdateMemberRoleMutation();
  const [removeMember] = useRemoveMemberMutation();

  const myMember = useMemo(
    () => members.find((m) => m.user_id === me?.user_id && m.membership_status === 'joined'),
    [members, me?.user_id],
  );
  const myRole = myMember?.role_name;
  const isAdminOrOwner = myRole === 'admin' || myRole === 'owner';

  // Derive sets for the "Add member" dialog
  const memberEmails = useMemo(
    () => new Set(members.filter((m) => m.membership_status === 'joined').map((m) => m.email.toLowerCase())),
    [members],
  );
  const pendingEmails = useMemo(
    () => new Set(members.filter((m) => m.membership_status === 'pending').map((m) => m.email.toLowerCase())),
    [members],
  );

  // Realtime listeners
  useEffect(() => {
    const socket = getRealtimeSocket();
    connectRealtime();
    const onInvitationAccepted = () => {
      refetchMembers();
    };
    const onInvitationReceived = () => {
      refetchNotifications();
      refetchMembers();
    };
    const onInvitationUpdated = () => {
      refetchMembers();
    };
    socket.on('invitation.accepted', onInvitationAccepted);
    socket.on('invitation.received', onInvitationReceived);
    socket.on('invitation.updated', onInvitationUpdated);
    return () => {
      socket.off('invitation.accepted', onInvitationAccepted);
      socket.off('invitation.received', onInvitationReceived);
      socket.off('invitation.updated', onInvitationUpdated);
    };
  }, [refetchMembers, refetchNotifications]);

  const form = useForm<ExternalInviteForm>({
    resolver: zodResolver(externalInviteSchema),
    defaultValues: { email: '', message: '' },
  });

  const activeProject = useMemo(
    () => projects.find((p) => p.project_id === activeProjectId),
    [projects, activeProjectId],
  );

  // Count joined members for the sidebar
  const joinedCount = useMemo(
    () => members.filter((m) => m.membership_status === 'joined').length,
    [members],
  );

  async function onSubmitExternalInvite(values: ExternalInviteForm) {
    if (!activeProjectId) {
      toast.error('Please select a project');
      return;
    }
    const message = values.message?.trim();
    try {
      await sendInvite({
        project_id: activeProjectId,
        email: values.email.trim().toLowerCase(),
        role_name: externalInviteRole,
        ...(message ? { message } : {}),
      }).unwrap();
      toast.success('External invitation sent');
      form.reset();
      setExternalInviteRole('viewer');
      setExternalInviteOpen(false);
      refetchMembers();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } } | undefined;
      toast.error(apiErr?.data?.message || 'Could not send invitation');
    }
  }

  async function handleAddInternalMember(email: string) {
    if (!activeProjectId) {
      toast.error('Please select a project');
      return;
    }
    try {
      await sendInvite({
        project_id: activeProjectId,
        email: email.trim().toLowerCase(),
        role_name: internalInviteRole,
      }).unwrap();
      toast.success('Invitation sent');
      setInternalInviteOpen(false);
      setMemberSearch('');
      setInternalInviteRole('viewer');
      refetchMembers();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } } | undefined;
      toast.error(apiErr?.data?.message || 'Failed to send invitation');
    }
  }

  async function handleRoleChange(userId: number, role_name: 'admin' | 'editor' | 'viewer') {
    if (!activeProjectId) return;
    try {
      await updateMemberRole({ projectId: activeProjectId, userId, role_name }).unwrap();
      toast.success('Role updated');
      refetchMembers();
    } catch {
      toast.error('Unable to update role');
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!activeProjectId) return;
    try {
      await removeMember({ projectId: activeProjectId, userId }).unwrap();
      toast.success('Member removed');
      refetchMembers();
    } catch {
      toast.error('Unable to remove member');
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <h1 className="text-3xl font-semibold tracking-tight mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Team Settings
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        Select a project to manage members.
      </p>

      {/* Project selector tabs */}
      <div className="overflow-x-auto pb-2 mb-6">
        <div className="flex items-center gap-3 min-w-max">
          {projects.map((p) => (
            <button
              key={p.project_id}
              onClick={() => setSelectedProjectId(p.project_id)}
              className="px-4 py-2 rounded-xl text-sm whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors duration-200 hover:opacity-90"
              style={{
                backgroundColor: activeProjectId === p.project_id ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                color: activeProjectId === p.project_id ? 'var(--color-brand-300)' : 'var(--color-text-secondary)',
                border: activeProjectId === p.project_id ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <FolderKanban className="h-4 w-4" />
              {p.project_name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main member list */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {activeProject?.project_name ?? 'Project members'}
            </h2>
            {isAdminOrOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExternalInviteOpen(true)}
                  className="px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-widest cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-4)]"
                  style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-primary)' }}
                >
                  Invite external member
                </button>
                <button
                  onClick={() => setInternalInviteOpen(true)}
                  className="px-3 py-2 rounded-lg text-xs font-medium uppercase tracking-widest cursor-pointer transition-colors duration-200 hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
                >
                  Add member
                </button>
              </div>
            )}
          </div>

          {/* Unified member list (joined + pending) */}
          <div className="space-y-2">
            {members.map((member) => {
              const isJoined = member.membership_status === 'joined';
              const isPending = member.membership_status === 'pending';
              const isOwnerRow = member.role_name === 'owner';
              const isMe = member.user_id === me?.user_id;

              return (
                <div
                  key={isJoined ? `member-${member.user_id}` : `pending-${member.invitation_id ?? member.user_id}`}
                  className="p-3 rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {isJoined ? member.display_name : (member.display_name || 'Pending invitation')}
                      {isMe && isJoined ? ' (You)' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.email}</p>
                      {isJoined ? (
                        <span
                          className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: 'rgba(16,185,129,0.15)',
                            color: 'var(--color-success)',
                            border: '1px solid rgba(16,185,129,0.25)',
                          }}
                        >
                          Joined
                        </span>
                      ) : isPending ? (
                        <span
                          className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: 'rgba(245,158,11,0.12)',
                            color: 'var(--color-warning)',
                            border: '1px solid rgba(245,158,11,0.25)',
                          }}
                        >
                          Pending
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Role display / selector */}
                    {isJoined && isAdminOrOwner ? (
                      <select
                        value={member.role_name}
                        onChange={(e) => handleRoleChange(member.user_id, e.target.value as 'admin' | 'editor' | 'viewer')}
                        disabled={isOwnerRow}
                        className="h-8 rounded-md px-2 text-xs cursor-pointer"
                        style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="admin">admin</option>
                        <option value="editor">editor</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span
                        className="h-8 flex items-center px-2 text-xs rounded-md"
                        style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-secondary)' }}
                      >
                        {member.role_name}
                      </span>
                    )}

                    {/* Remove / Leave button */}
                    {isJoined && isAdminOrOwner && !isOwnerRow ? (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-3)]"
                        style={{ color: '#f87171' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : isJoined && isMe && !isOwnerRow ? (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="p-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-3)] text-xs"
                        style={{ color: '#f87171' }}
                      >
                        Leave
                      </button>
                    ) : isOwnerRow ? (
                      <button
                        disabled
                        className="p-2 rounded-md disabled:opacity-40 cursor-not-allowed"
                        style={{ color: '#f87171' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-6">
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
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer hover:bg-[var(--color-surface-4)]"
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

          <div className="p-6 rounded-xl"
               style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Team Usage</h5>
              <span className="text-[10px] font-medium uppercase tracking-widest"
                    style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {joinedCount} members
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: 'var(--color-surface-4)' }}>
              <div className="w-[30%] h-full rounded-full"
                   style={{ backgroundColor: 'var(--color-brand-500)', boxShadow: '0 0 8px rgba(99,102,241,0.4)' }} />
            </div>
            <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Calendar className="h-3 w-3" />
              Active project: {activeProject?.project_name ?? '---'}
            </p>
          </div>

          <div className="p-4 rounded-xl flex gap-4"
               style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Info className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--color-success)' }} />
            <div className="space-y-1">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>Realtime enabled</span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(16,185,129,0.8)' }}>
                Invitations and messages now appear as live notifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* External invite dialog */}
      <Dialog open={externalInviteOpen} onOpenChange={setExternalInviteOpen}>
        <DialogContent style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Invite external member</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: '#fbbf24' }}>
            <ShieldAlert className="h-4 w-4" />
            Only Gmail available (@gmail.com)
          </div>
          <form onSubmit={form.handleSubmit(onSubmitExternalInvite)} className="space-y-3">
            <input
              {...form.register('email')}
              placeholder="member@gmail.com"
              className="w-full h-10 rounded-md px-3 text-sm outline-none"
              style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-primary)' }}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
            )}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                Role
              </label>
              <select
                value={externalInviteRole}
                onChange={(e) => setExternalInviteRole(e.target.value as InviteRole)}
                className="w-full h-10 rounded-md px-3 text-sm outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-primary)' }}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <textarea
              {...form.register('message')}
              placeholder="Invitation message..."
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-primary)' }}
            />
            <button
              type="submit"
              disabled={isSendingInvite}
              className="h-10 px-4 rounded-md text-sm font-medium disabled:opacity-50 cursor-pointer transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
            >
              {isSendingInvite ? 'Sending...' : 'Send invitation'}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Internal invite dialog */}
      <Dialog open={internalInviteOpen} onOpenChange={setInternalInviteOpen}>
        <DialogContent style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--color-text-primary)' }}>Add member</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
              Role
            </label>
            <select
              value={internalInviteRole}
              onChange={(e) => setInternalInviteRole(e.target.value as InviteRole)}
              className="w-full h-9 rounded-md px-3 text-sm outline-none mb-3 cursor-pointer"
              style={{ backgroundColor: 'var(--color-surface-4)', color: 'var(--color-text-primary)' }}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-2 py-2 rounded-md mb-2" style={{ backgroundColor: 'var(--color-surface-3)' }}>
            <Search className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search user by email"
              className="bg-transparent w-full text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {foundUsers.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between px-2 py-2 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{u.display_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</p>
                </div>
                {memberEmails.has(u.email.toLowerCase()) ? (
                  <span
                    className="px-2 py-1 text-xs rounded-md"
                    style={{ color: 'var(--color-success)', backgroundColor: 'rgba(16,185,129,0.12)' }}
                  >
                    Joined
                  </span>
                ) : pendingEmails.has(u.email.toLowerCase()) ? (
                  <span
                    className="px-2 py-1 text-xs rounded-md"
                    style={{ color: 'var(--color-warning)', backgroundColor: 'rgba(245,158,11,0.12)' }}
                  >
                    Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddInternalMember(u.email)}
                    disabled={isSendingInvite}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs disabled:opacity-50 cursor-pointer transition-colors duration-200 hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {memberSearch.length >= 2 && foundUsers.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No users found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
