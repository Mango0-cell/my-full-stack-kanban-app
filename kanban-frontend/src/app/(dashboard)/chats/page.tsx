'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Clock, CheckCheck, X } from 'lucide-react';
import { useListConversationsQuery, useFindOrCreateConversationMutation } from '@/lib/store/api/chatApi';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useSearchUsersQuery } from '@/lib/store/api/usersApi';
import { PixelDino } from '@/components/shared/PixelDino';
import { getRealtimeSocket, connectRealtime } from '@/lib/realtime/socket';
import toast from 'react-hot-toast';

/* ---------- helpers ---------- */

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCountdown(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${d}D ${h}H ${m}M`;
}

/* ---------- sub-components ---------- */

function MonoLabel({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

function Avatar({
  name,
  online,
  size = 36,
}: {
  name: string;
  online?: boolean;
  size?: number;
}) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const gradients = [
    'from-violet-500 to-indigo-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-cyan-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-rose-500',
    'from-emerald-500 to-teal-500',
  ];

  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white font-semibold`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          letterSpacing: '-0.02em',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className="absolute rounded-full"
          style={{
            right: -1,
            bottom: -1,
            width: Math.max(8, size * 0.28),
            height: Math.max(8, size * 0.28),
            background: online ? 'var(--color-success)' : '#64748b',
            boxShadow: '0 0 0 2px var(--color-surface-1)',
          }}
        />
      )}
    </div>
  );
}

function ConvoRow({
  name,
  lastMessage,
  time,
  unread,
  online,
  selected,
  isMe,
  onClick,
}: {
  name: string;
  lastMessage?: string;
  time: string;
  unread: boolean;
  online?: boolean;
  selected: boolean;
  isMe: boolean;
  onClick: () => void;
}) {
  const preview = lastMessage
    ? isMe
      ? `you: ${lastMessage}`
      : lastMessage
    : 'No messages yet';

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left transition-all duration-150 relative
        ${selected
          ? 'bg-[rgba(99,102,241,0.10)] border border-[rgba(99,102,241,0.35)]'
          : 'bg-transparent border border-transparent hover:bg-[var(--color-surface-2)]'}
        cursor-pointer`}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="absolute left-[-1px] top-2.5 bottom-2.5 w-0.5 rounded-sm bg-[var(--color-brand-500)]" />
      )}

      <Avatar name={name} online={online} size={36} />

      <div className="flex-1 min-w-0">
        {/* Row 1: name + timestamp */}
        <div className="flex items-center gap-1.5">
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {name}
          </span>
          <span className="flex-1" />
          <span
            className="font-mono text-[9.5px] tracking-[0.04em] flex-shrink-0"
            style={{
              color: unread ? 'var(--color-brand-400)' : 'var(--color-text-muted)',
            }}
          >
            {time}
          </span>
        </div>

        {/* Row 2: preview + unread badge */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="flex-1 text-[12px] truncate"
            style={{
              color: unread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: unread ? 500 : 400,
            }}
          >
            {preview}
          </span>
          {unread && (
            <span
              className="flex items-center justify-center font-mono text-[10px] font-semibold text-white rounded-full flex-shrink-0"
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 6px',
                background: 'var(--color-brand-500)',
              }}
            >
              1
            </span>
          )}
          {!unread && lastMessage && isMe && (
            <CheckCheck
              className="flex-shrink-0 opacity-60"
              style={{ color: 'var(--color-brand-400)' }}
              size={12}
            />
          )}
        </div>
      </div>
    </button>
  );
}

/* ---------- New Message Dialog ---------- */

function NewMessageDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [userSearch, setUserSearch] = useState('');
  const { data: usersData } = useSearchUsersQuery(userSearch.trim(), {
    skip: userSearch.trim().length < 2,
  });
  const foundUsers = usersData?.data ?? [];
  const [findOrCreate, { isLoading }] = useFindOrCreateConversationMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUserSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function handleSelectUser(userId: number) {
    try {
      const response = await findOrCreate({ recipient_user_id: userId }).unwrap();
      onClose();
      router.push(`/chats/${response.data.conversation_id}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className="relative w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            New Message
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--color-surface-3)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-4 py-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-surface-3)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input
              ref={inputRef}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by email..."
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto px-2 pb-3">
          {userSearch.trim().length < 2 ? (
            <p className="text-xs px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
              Type at least 2 characters to search.
            </p>
          ) : foundUsers.length === 0 ? (
            <p className="text-xs px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
              No users found.
            </p>
          ) : (
            foundUsers.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleSelectUser(u.user_id)}
                disabled={isLoading}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-3)] disabled:opacity-50"
              >
                <Avatar name={u.display_name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {u.display_name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {u.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

export default function ChatsPage() {
  const router = useRouter();
  const { data, isLoading, refetch: refetchConversations } = useListConversationsQuery();
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;
  const conversations = data?.data ?? [];

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cacheCountdown, setCacheCountdown] = useState(0);
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  // Realtime: refetch conversations when new messages arrive
  useEffect(() => {
    // Get socket instance first, register listeners, THEN connect
    const socket = getRealtimeSocket();
    const onRefresh = () => refetchConversations();
    socket.on('chat.message.received', onRefresh);
    socket.on('chat.message.sent', onRefresh);
    // Connect after listeners are registered (no-op if already connected)
    connectRealtime();
    return () => {
      socket.off('chat.message.received', onRefresh);
      socket.off('chat.message.sent', onRefresh);
    };
  }, [refetchConversations]);

  // Cache countdown timer (use a generic 7-day estimate when no conversation selected)
  useEffect(() => {
    const update = () => {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      setCacheCountdown(sevenDays);
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.other_user_display_name?.toLowerCase().includes(q) ||
        c.other_user_email?.toLowerCase().includes(q) ||
        c.last_message_content?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const unreadCount = 0; // placeholder -- real unread tracking would come from API
  const activeCount = conversations.length;

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col" style={{ background: 'linear-gradient(180deg, var(--color-surface-0), var(--color-surface-1))' }}>
        <div className="p-6">
          <div className="shimmer h-6 w-32 rounded mb-4" />
          <div className="shimmer h-10 w-full rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-16 w-full rounded-[10px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        className="flex h-full w-full flex-col"
        style={{ background: 'linear-gradient(180deg, var(--color-surface-0), var(--color-surface-1))' }}
      >
        {/* Header */}
        <div className="px-[18px] pt-[18px] pb-[14px] border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-baseline justify-between mb-3.5">
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}
              >
                Messages
              </h1>
              <MonoLabel className="mt-0.5 inline-block" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties}>
                0 ACTIVE
              </MonoLabel>
            </div>
            <button
              onClick={() => setNewMessageOpen(true)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 cursor-pointer hover:bg-[var(--color-surface-3)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="New message"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="flex flex-col items-center text-center max-w-xs">
            <PixelDino size={220} />
            <h3
              className="text-xl md:text-2xl font-semibold mt-1 mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Nothing yet here
            </h3>
            <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Start a conversation from the users menu in the header.
            </p>
          </div>
        </div>

        <NewMessageDialog open={newMessageOpen} onClose={() => setNewMessageOpen(false)} />
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: 'linear-gradient(180deg, var(--color-surface-0), var(--color-surface-1))' }}
    >
      {/* -- Header -- */}
      <div className="px-[18px] pt-[18px] pb-[14px] border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-baseline justify-between mb-3.5">
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}
            >
              Messages
            </h1>
            <MonoLabel className="mt-0.5 inline-block" style={{ color: 'var(--color-text-muted)' } as React.CSSProperties}>
              {activeCount} ACTIVE {unreadCount > 0 ? `\u00B7 ${unreadCount} UNREAD` : ''}
            </MonoLabel>
          </div>
          <button
            onClick={() => setNewMessageOpen(true)}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 cursor-pointer hover:bg-[var(--color-surface-3)]"
            style={{ color: 'var(--color-text-secondary)' }}
            title="New message"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${searchFocused ? 'var(--color-brand-500)' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: searchFocused ? '0 0 0 4px rgba(99,102,241,0.1)' : 'none',
          }}
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="last message, people"
            className="flex-1 bg-transparent border-none outline-none text-[13px]"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* -- Conversations scroll region -- */}
      <div className="flex-1 overflow-y-auto pb-3.5 kanban-scroll">
        {/* Section header */}
        <div className="mt-[18px]">
          <div className="flex items-center gap-2 px-3.5 pb-2">
            <MonoLabel className="text-[var(--color-text-muted)]">
              DIRECT MESSAGES
            </MonoLabel>
            <span className="font-mono text-[10px] opacity-60" style={{ color: 'var(--color-text-muted)' }}>
              {'\u00B7'}
            </span>
            <MonoLabel className="text-[var(--color-text-muted)]">
              {String(filteredConversations.length).padStart(2, '0')}
            </MonoLabel>
            <span className="flex-1 h-px bg-[rgba(255,255,255,0.04)]" />
          </div>

          <div className="flex flex-col gap-0.5 px-1.5">
            {filteredConversations.map((c) => {
              const displayName = c.other_user_display_name || c.other_user_email;
              const isMySend = c.last_message_sender_user_id === me?.user_id;

              return (
                <ConvoRow
                  key={c.conversation_id}
                  name={displayName}
                  lastMessage={c.last_message_content ?? undefined}
                  time={timeAgo(c.last_message_created_at || c.updated_at)}
                  unread={false}
                  online={undefined}
                  selected={selectedId === c.conversation_id}
                  isMe={isMySend}
                  onClick={() => {
                    setSelectedId(c.conversation_id);
                    router.push(`/chats/${c.conversation_id}`);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* -- Footer: cache countdown + realtime indicator -- */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 border-t border-[rgba(255,255,255,0.04)]"
        style={{ background: 'var(--color-surface-0)' }}
      >
        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
        <MonoLabel className="text-[var(--color-text-muted)]">
          CACHE RESET IN {formatCountdown(cacheCountdown)}
        </MonoLabel>
        <span className="flex-1" />
        <span
          className="inline-block w-[5px] h-[5px] rounded-full animate-pulse"
          style={{ background: 'var(--color-success)', boxShadow: '0 0 0 3px rgba(16,185,129,0.13)' }}
        />
        <MonoLabel className="text-[var(--color-success)]">
          REALTIME
        </MonoLabel>
      </div>

      <NewMessageDialog open={newMessageOpen} onClose={() => setNewMessageOpen(false)} />
    </div>
  );
}
