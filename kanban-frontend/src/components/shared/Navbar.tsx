'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import {
  useSearchUsersQuery,
} from '@/lib/store/api/usersApi';
import { useSendMessageMutation } from '@/lib/store/api/chatApi';
import { connectRealtime, destroyRealtime } from '@/lib/realtime/socket';
import { clearClientSessionState } from '@/lib/utils/sessionState';

export function Navbar() {
  const router = useRouter();
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
  const [sendMessage, { isLoading: isMessageSending }] = useSendMessageMutation();

  useEffect(() => {
    const token = Cookies.get('kanban_token');
    if (!token) return;
    const socket = connectRealtime();
    const onNotification = () => refetchNotifs();
    socket.on('notification.received', onNotification);
    socket.on('chat.message.received', onNotification);
    return () => {
      socket.off('notification.received', onNotification);
      socket.off('chat.message.received', onNotification);
    };
  }, [refetchNotifs]);

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
      const response = await sendMessage({
        recipient_user_id: targetUserId,
        content: 'Hi! 👋',
      }).unwrap();
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
                        disabled={isMessageSending}
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
            <button className="hidden sm:flex p-1.5 rounded-md transition-colors duration-200 relative cursor-pointer hover:bg-[var(--color-surface-3)]" style={{ color: 'var(--color-text-secondary)' }}>
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
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.notification_id}
                    onClick={() => markRead(n.notification_id)}
                    className="cursor-pointer py-2"
                  >
                    <div className="w-full">
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{n.body}</p>
                    </div>
                  </DropdownMenuItem>
                ))
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
