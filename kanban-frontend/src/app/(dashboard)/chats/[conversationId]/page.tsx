'use client';

import { use, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import {
  useListMessagesQuery,
  useSendMessageMutation,
  useListConversationsQuery,
  useDeleteConversationMutation,
} from '@/lib/store/api/chatApi';
import { getRealtimeSocket, connectRealtime } from '@/lib/realtime/socket';
import {
  appendChatCache,
  msUntilChatCacheReset,
  readChatCache,
  writeChatCache,
} from '@/lib/realtime/chatCache';
import type { DirectMessage } from '@/lib/types/api';
import { Search, MoreVertical, Smile, Paperclip, Send, Clock, CheckCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const EMOJI_LIST = ['😀','😂','😍','🥰','😎','🤔','👍','👋','🎉','🔥','❤️','💯','✅','👀','🚀','💪','🙌','😅','🤝','⭐','💡','📌','🎯','✨','💬'];

interface Props {
  params: Promise<{ conversationId: string }>;
}

/* ── helpers ── */

function formatCountdown(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${d}D ${h}H ${m}M`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateDivider(dateStr: string) {
  const d = new Date(dateStr);
  return d
    .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·');
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/* ── sub-components ── */

function ChatAvatar({
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-[3px] py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-[var(--color-text-secondary)]"
          style={{
            animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── main component ── */

export default function ConversationPage({ params }: Props) {
  const { conversationId: conversationIdParam } = use(params);
  const conversationId = Number(conversationIdParam);
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;

  const { data: convoListData } = useListConversationsQuery();
  const partner = useMemo(() => {
    const convos = convoListData?.data ?? [];
    return convos.find((c) => c.conversation_id === conversationId);
  }, [convoListData, conversationId]);

  const partnerName = partner?.other_user_display_name || partner?.other_user_email || 'User';

  const { data, refetch } = useListMessagesQuery(conversationId, {
    skip: !Number.isInteger(conversationId),
  });
  const router = useRouter();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteConversation] = useDeleteConversationMutation();
  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState<DirectMessage[]>([]);
  const [resetCountdown, setResetCountdown] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const cachedMessages = me?.user_id ? readChatCache(me.user_id, conversationId) : [];

  /* ── socket ── */
  useEffect(() => {
    if (!me?.user_id || !conversationId) return;

    // 1. Get socket instance WITHOUT connecting yet
    const socket = getRealtimeSocket();

    const joinRoom = () => {
      console.log('[socket] joining conversation room', conversationId, 'connected:', socket.connected, 'id:', socket.id);
      socket.emit('room.conversation.join', { conversationId }, (response: { joined?: boolean; error?: string }) => {
        if (response?.error) {
          console.error('[socket] room join failed:', response.error);
        } else {
          console.log('[socket] room joined successfully:', response);
        }
      });
    };

    // 2. Register ALL listeners BEFORE connecting
    const onConnect = () => {
      console.log('[socket] connected, joining room');
      joinRoom();
    };

    const onIncoming = (message: DirectMessage) => {
      if (message.conversation_id !== conversationId) return;
      appendChatCache(me.user_id, conversationId, message);
      setLiveMessages((prev) => {
        const exists = prev.some((m) => m.message_id === message.message_id);
        if (exists) return prev;
        return [...prev, message].slice(-40);
      });
    };

    const onError = (err: Error) => console.error('[socket] connect_error:', err.message);
    const onDisconnect = (reason: string) => console.log('[socket] disconnected:', reason);

    socket.on('connect', onConnect);
    socket.on('chat.message.received', onIncoming);
    socket.on('chat.message.sent', onIncoming);
    socket.on('connect_error', onError);
    socket.on('disconnect', onDisconnect);

    // 3. NOW connect (or if already connected, join room immediately)
    if (socket.connected) {
      joinRoom();
    } else {
      connectRealtime();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('chat.message.received', onIncoming);
      socket.off('chat.message.sent', onIncoming);
      socket.off('connect_error', onError);
      socket.off('disconnect', onDisconnect);
      // Leave conversation room so isUserInRoom returns false
      // and backend resumes creating notifications
      socket.emit('room.conversation.leave', { conversationId });
    };
  }, [conversationId, me?.user_id]);

  /* ── cache countdown ── */
  useEffect(() => {
    if (!me?.user_id || !conversationId) return;
    const update = () => {
      setResetCountdown(msUntilChatCacheReset(me.user_id, conversationId));
    };
    const timeout = setTimeout(update, 0);
    const timer = setInterval(update, 60_000);
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [conversationId, me?.user_id]);

  /* ── search debounce ── */
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.toLowerCase());
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  /* ── write cache ── */
  useEffect(() => {
    if (!me?.user_id || !conversationId || !data?.data) return;
    writeChatCache(me.user_id, conversationId, data.data);
  }, [conversationId, me?.user_id, data?.data]);

  /* ── resolve messages: merge API + live socket messages ── */
  const messages = useMemo(() => {
    const apiMessages = data?.data ?? [];
    if (apiMessages.length === 0 && liveMessages.length === 0) return cachedMessages;
    // Merge: start with API data, append any live messages not already in API data
    const knownIds = new Set(apiMessages.map((m) => m.message_id));
    const newLive = liveMessages.filter((m) => !knownIds.has(m.message_id));
    return [...apiMessages, ...newLive];
  }, [data?.data, liveMessages, cachedMessages]);

  /* ── auto-scroll ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  /* ── send ── */
  async function handleSend() {
    if (!draft.trim()) return;
    await sendMessage({ conversation_id: conversationId, content: draft.trim() }).unwrap();
    setDraft('');
  }

  /* ── group messages with stacking ── */
  const grouped = useMemo(() => {
    type Item =
      | { kind: 'divider'; label: string; key: string }
      | { kind: 'message'; msg: DirectMessage; stacked: boolean; isLast: boolean; key: string };

    const items: Item[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prev = messages[i - 1];
      const next = messages[i + 1];

      // Date divider
      if (!prev || !isSameDay(prev.created_at, msg.created_at)) {
        items.push({
          kind: 'divider',
          label: formatDateDivider(msg.created_at),
          key: `div-${msg.created_at}`,
        });
      }

      const stacked =
        !!prev &&
        prev.sender_user_id === msg.sender_user_id &&
        isSameDay(prev.created_at, msg.created_at);

      const isLast =
        !next ||
        next.sender_user_id !== msg.sender_user_id ||
        !isSameDay(next.created_at, msg.created_at);

      items.push({ kind: 'message', msg, stacked, isLast, key: `msg-${msg.message_id}` });
    }
    return items;
  }, [messages]);

  /* ── find last sent message for read receipt ── */
  const lastSentId = useMemo(() => {
    if (!me) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_user_id === me.user_id) return messages[i].message_id;
    }
    return null;
  }, [messages, me]);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: 'var(--color-surface-1)' }}>
      {/* ═══ Chat Header ═══ */}
      <div
        className="flex items-center gap-3 px-[18px] py-3 border-b border-[rgba(255,255,255,0.05)]"
        style={{ background: 'var(--color-surface-0)' }}
      >
        {/* Back button (mobile) */}
        <Link
          href="/chats"
          className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 cursor-pointer hover:bg-[var(--color-surface-3)] md:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={16} />
        </Link>

        <ChatAvatar name={partnerName} online size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile?userId=${partner?.other_user_id}`}
              className="text-[14px] font-semibold truncate hover:underline cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {partnerName}
            </Link>
            <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-[3px] bg-[rgba(16,185,129,0.15)]">
              <span
                className="inline-block w-[5px] h-[5px] rounded-full"
                style={{ background: '#10b981' }}
              />
              <span className="font-mono text-[9px] tracking-[0.08em] font-semibold text-[#10b981] uppercase">
                ONLINE
              </span>
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) { setSearchQuery(''); setDebouncedSearch(''); } }}
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
            style={{ color: searchOpen ? 'var(--color-brand-400)' : 'var(--color-text-secondary)' }}
            title="Search in conversation"
          >
            <Search size={14} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
              title="More"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-9 w-40 rounded-lg shadow-xl py-1 z-50"
                style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <button
                  onClick={async () => {
                    if (!confirm('Delete this conversation?')) return;
                    try {
                      await deleteConversation(conversationId).unwrap();
                      router.push('/chats');
                      toast.success('Conversation deleted');
                    } catch { toast.error('Failed to delete'); }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-surface-4)] transition-colors"
                  style={{ color: '#f87171' }}
                >
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Search Bar ═══ */}
      {searchOpen && (
        <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.05)]" style={{ background: 'var(--color-surface-0)' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="w-full bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      )}

      {/* ═══ Messages Area ═══ */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-2 kanban-scroll"
      >
        {grouped.map((item) => {
          if (item.kind === 'divider') {
            return (
              <div key={item.key} className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {item.label}
                </span>
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.05)]" />
              </div>
            );
          }

          const { msg, stacked, isLast } = item;
          const mine = me?.user_id === msg.sender_user_id;
          const showMeta = !stacked;
          const senderName = msg.sender_display_name || 'User';

          return (
            <div
              key={item.key}
              className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : 'flex-row'} ${stacked ? 'mt-[3px]' : 'mt-2.5'}`}
            >
              {/* Avatar gutter */}
              <div className="w-8 flex-shrink-0">
                {showMeta && !mine && (
                  <ChatAvatar name={senderName} size={32} />
                )}
              </div>

              {/* Bubble column */}
              <div
                className={`max-w-[72%] flex flex-col ${mine ? 'items-end' : 'items-start'} relative`}
              >
                {/* Meta: sender name + timestamp (theirs) */}
                {showMeta && !mine && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {senderName}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.04em] text-[var(--color-text-muted)]">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* Meta: timestamp (mine) */}
                {showMeta && mine && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[9px] tracking-[0.04em] text-[var(--color-text-muted)]">
                      {formatTime(msg.created_at)}
                    </span>
                    {isLast && msg.message_id === lastSentId && (
                      <CheckCheck size={12} className="text-[var(--color-brand-400)] opacity-70" />
                    )}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`px-3.5 py-2.5 text-[13.5px] leading-[1.55] ${
                    mine
                      ? 'bg-gradient-to-b from-[rgba(99,102,241,0.22)] to-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] rounded-xl rounded-tr-sm'
                      : 'bg-[var(--color-surface-2)] border border-[rgba(255,255,255,0.06)] rounded-xl rounded-tl-sm'
                  }`}
                  style={{
                    color: 'var(--color-text-primary)',
                    boxShadow: mine
                      ? '0 1px 0 rgba(255,255,255,0.08) inset, 0 2px 6px rgba(99,102,241,0.1)'
                      : '0 1px 0 rgba(255,255,255,0.04) inset',
                    ...(debouncedSearch && msg.content.toLowerCase().includes(debouncedSearch) ? {
                      borderColor: 'var(--color-brand-400)',
                      boxShadow: '0 0 0 2px rgba(99,102,241,0.3)',
                    } : {}),
                  }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Composer ═══ */}
      <div
        className="px-[18px] pt-3.5 pb-[18px] border-t border-[rgba(255,255,255,0.05)]"
        style={{ background: 'var(--color-surface-0)' }}
      >
        <div
          className="rounded-xl bg-[var(--color-surface-2)] border border-[rgba(255,255,255,0.08)] px-3 pt-2.5 pb-2"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
        >
          {/* Input */}
          <div className="flex items-center min-h-[40px] px-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-[13.5px] leading-[1.5]"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-0.5 mt-1.5 pt-2 border-t border-[rgba(255,255,255,0.04)]">
            <div className="relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
                style={{ color: showEmoji ? 'var(--color-brand-400)' : 'var(--color-text-secondary)' }}
                title="Emoji"
              >
                <Smile size={14} />
              </button>
              {showEmoji && (
                <div
                  className="absolute bottom-10 left-0 p-2 rounded-lg shadow-xl z-50"
                  style={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}
                >
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setDraft((prev) => prev + emoji); setShowEmoji(false); }}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-lg hover:bg-[var(--color-surface-4)] cursor-pointer transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Attach"
            >
              <Paperclip size={14} />
            </button>

            <span className="flex-1" />

            <span className="font-mono text-[9.5px] tracking-[0.06em] text-[var(--color-text-muted)] uppercase hidden sm:inline">
              ⏎ SEND
            </span>

            <button
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
              className="ml-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-[10px] tracking-[0.1em] uppercase font-semibold text-white disabled:opacity-40 cursor-pointer transition-all duration-150"
              style={{
                background: 'var(--color-brand-500)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(99,102,241,0.4)',
              }}
            >
              <Send size={12} />
              SEND
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Cache Countdown Footer ═══ */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 border-t border-[rgba(255,255,255,0.04)]"
        style={{ background: 'var(--color-surface-0)' }}
      >
        <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          CACHE RESET IN {formatCountdown(resetCountdown)}
        </span>
        <span className="flex-1" />
        <span
          className="inline-block w-[5px] h-[5px] rounded-full animate-pulse"
          style={{
            background: 'var(--color-success)',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.13)',
          }}
        />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-success)]">
          REALTIME
        </span>
      </div>
    </div>
  );
}
