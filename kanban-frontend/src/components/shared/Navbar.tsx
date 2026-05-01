'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Bell,
  LogOut,
  Mail,
  MessageCircle,
  Search,
  User,
  Users,
} from 'lucide-react';
import { MobileSidebarTrigger } from './MobileSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useAppDispatch } from '@/lib/hooks/redux';
import { clearCredentials } from '@/lib/store/slices/authSlice';
import { baseApi } from '@/lib/store/api/baseApi';
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} from '@/lib/store/api/notificationsApi';
import toast from 'react-hot-toast';
import {
  useSearchUsersQuery,
} from '@/lib/store/api/usersApi';
import { useAcceptInviteMutation, useDeclineInviteMutation } from '@/lib/store/api/inviteApi';
import { useFindOrCreateConversationMutation } from '@/lib/store/api/chatApi';
import { connectRealtime, destroyRealtime } from '@/lib/realtime/socket';
import { clearClientSessionState } from '@/lib/utils/sessionState';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery();
  const user = data?.data;

  const [notifLimit, setNotifLimit] = useState<5 | 10>(5);
  const { data: notifData, refetch: refetchNotifs } = useListNotificationsQuery(notifLimit);
  const [markRead] = useMarkNotificationReadMutation();

  const [userSearch, setUserSearch] = useState('');
  const { data: usersData } = useSearchUsersQuery(userSearch.trim(), {
    skip: userSearch.trim().length < 2,
  });
  const [findOrCreate, { isLoading: isCreatingConvo }] = useFindOrCreateConversationMutation();
  const [acceptInvite] = useAcceptInviteMutation();
  const [declineInvite] = useDeclineInviteMutation();

  useEffect(() => {
    const token = Cookies.get('kanban_token');
    if (!token) return;
    const socket = connectRealtime();
    const onNotification = () => refetchNotifs();
    const onChatMessage = () => {
      // Don't refetch notifications when user is actively in a chat conversation —
      // the backend already suppresses notification creation for active viewers
      if (pathname.startsWith('/chats/')) return;
      refetchNotifs();
    };
    socket.on('notification.received', onNotification);
    socket.on('chat.message.received', onChatMessage);
    return () => {
      socket.off('notification.received', onNotification);
      socket.off('chat.message.received', onChatMessage);
    };
  }, [refetchNotifs, pathname]);

  function handleLogout() {
    Cookies.remove('kanban_token');
    destroyRealtime();
    clearClientSessionState();
    dispatch(clearCredentials());
    dispatch(baseApi.util.resetApiState());
    router.push('/login');
  }

  async function handleSendMessage(targetUserId: number) {
    try {
      const response = await findOrCreate({ recipient_user_id: targetUserId }).unwrap();
      router.push(`/chats/${response.data.conversation_id}`);
    } catch {
      router.push('/chats');
    }
  }

  const initials = user?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const notifications = notifData?.data ?? [];
  const foundUsers = usersData?.data ?? [];

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 z-20"
      style={{
        backgroundColor: 'var(--color-surface-0)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-4 md:gap-8">
        <MobileSidebarTrigger />
        <Link href="/board" style={{ textDecoration: 'none' }}>
          <span className="text-sm md:text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Kanban Flow
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden sm:flex p-1.5 rounded-md transition-colors duration-200 relative cursor-pointer hover:bg-[var(--color-surface-3)]" style={{ color: 'var(--color-text-secondary)' }}>
              <Users className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 z-50 p-2" style={{ backgroundColor: '#0d1017', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ backgroundColor: 'var(--color-surface-3)' }}>
              <Search className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by email"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="mt-2 max-h-60 overflow-y-auto">
              {foundUsers.length === 0 ? (
                <p className="text-xs px-2 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  Type at least 2 characters.
                </p>
              ) : (
                foundUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between px-2 py-2 rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{u.display_name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-3)]"
                        title="Send message"
                        onClick={() => handleSendMessage(u.user_id)}
                        disabled={isCreatingConvo}
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--color-surface-3)]"
                        title="View profile"
                        onClick={() => router.push(`/profile?userId=${u.user_id}`)}
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        <User className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex p-1.5 rounded-md transition-colors duration-200 relative cursor-pointer hover:bg-[var(--color-surface-3)]" style={{ color: 'var(--color-text-secondary)' }}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1 rounded-full bg-indigo-500 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 z-50 p-2" style={{ backgroundColor: '#0d1017', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Notifications</span>
              {notifLimit === 5 ? (
                <button
                  className="text-xs cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-brand-400)' }}
                  onClick={() => setNotifLimit(10)}
                >
                  see more...
                </button>
              ) : (
                <button
                  className="text-xs cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onClick={() => setNotifLimit(5)}
                >
                  show less
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs px-2 py-2" style={{ color: 'var(--color-text-muted)' }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => {
                  const isInvitation = n.type === 'invitation_received' && !n.is_read;
                  const isChatMessage = n.type === 'chat_message';
                  const entityId = n.entity_id;

                  return (
                    <div
                      key={n.notification_id}
                      className={`px-2 py-2.5 rounded-md ${n.is_read ? 'opacity-60' : ''}`}
                      style={{ backgroundColor: n.is_read ? 'transparent' : 'rgba(99,102,241,0.05)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`flex-1 min-w-0 ${isChatMessage ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (isChatMessage && n.metadata?.conversation_id) {
                              markRead(n.notification_id);
                              router.push(`/chats/${n.metadata.conversation_id}`);
                            } else if (!isInvitation) {
                              markRead(n.notification_id);
                            }
                          }}
                        >
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{n.body}</p>
                        </div>
                        {!n.is_read && !isInvitation && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--color-brand-500)' }} />
                        )}
                      </div>
                      {isInvitation && entityId && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={async () => {
                              try {
                                await acceptInvite(entityId).unwrap();
                                markRead(n.notification_id);
                                toast.success('Invitation accepted!');
                                refetchNotifs();
                              } catch (err: unknown) {
                                const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to accept';
                                toast.error(msg);
                              }
                            }}
                            className="px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors hover:opacity-90"
                            style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await declineInvite(entityId).unwrap();
                                markRead(n.notification_id);
                                toast.success('Invitation declined');
                                refetchNotifs();
                              } catch (err: unknown) {
                                const msg = (err as { data?: { message?: string } })?.data?.message || 'Failed to decline';
                                toast.error(msg);
                              }
                            }}
                            className="px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--color-surface-3)]"
                            style={{ color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className="hidden sm:flex p-1.5 rounded-md transition-colors duration-200 cursor-pointer hover:bg-[var(--color-surface-3)]"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => router.push('/chats')}
          title="Messages"
        >
          <MessageCircle className="h-4 w-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-3)] transition-colors duration-150 cursor-pointer">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                style={{
                  backgroundColor: 'rgba(99,102,241,0.2)',
                  color: 'var(--color-brand-400)',
                }}
              >
                {initials}
              </div>
              <span className="text-sm hidden sm:inline" style={{ color: 'var(--color-text-secondary)' }}>
                {user?.display_name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50" style={{ backgroundColor: '#0d1017', border: '1px solid rgba(255,255,255,0.08)' }}>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
