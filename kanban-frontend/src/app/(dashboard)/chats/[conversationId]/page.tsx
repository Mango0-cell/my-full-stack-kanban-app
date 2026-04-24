'use client';

import { use, useEffect, useRef, useState, useMemo } from 'react';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import {
  useListMessagesQuery,
  useSendMessageMutation,
  useListConversationsQuery,
} from '@/lib/store/api/chatApi';
import { connectRealtime } from '@/lib/realtime/socket';
import {
  appendChatCache,
  msUntilChatCacheReset,
  readChatCache,
  writeChatCache,
} from '@/lib/realtime/chatCache';
import type { DirectMessage } from '@/lib/types/api';
import { Search, MoreVertical, Smile, Paperclip, Send, Clock, CheckCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState<DirectMessage[]>([]);
  const [resetCountdown, setResetCountdown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cachedMessages = me?.user_id ? readChatCache(me.user_id, conversationId) : [];

  /* ── socket ── */
  useEffect(() => {
    if (!me?.user_id || !conversationId) return;
    const socket = connectRealtime();
    socket.emit('room.conversation.join', { conversationId });

    const onIncoming = (message: DirectMessage) => {
      if (message.conversation_id !== conversationId) return;
      appendChatCache(me.user_id, conversationId, message);
      setLiveMessages((prev) => {
        const next = prev.filter((m) => m.message_id !== message.message_id);
        next.push(message);
        return next.slice(-40);
      });
      refetch();
    };

    socket.on('chat.message.received', onIncoming);
    return () => {
      socket.off('chat.message.received', onIncoming);
    };
  }, [conversationId, me?.user_id, refetch]);

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

  /* ── write cache ── */
  useEffect(() => {
    if (!me?.user_id || !conversationId || !data?.data) return;
    writeChatCache(me.user_id, conversationId, data.data);
  }, [conversationId, me?.user_id, data?.data]);

  /* ── resolve messages ── */
  const messages =
    (data?.data?.length ?? 0) > 0
      ? (data?.data ?? [])
      : liveMessages.length > 0
        ? liveMessages
        : cachedMessages;

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
          className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] md:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={16} />
        </Link>

        <ChatAvatar name={partnerName} online size={36} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[14px] font-semibold truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {partnerName}
            </span>
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
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Search in conversation"
          >
            <Search size={14} />
          </button>
          <button
            className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
            style={{ color: 'var(--color-text-secondary)' }}
            title="More"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

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
            <button
              className="flex items-center justify-center w-[30px] h-[30px] rounded-md transition-all duration-150 hover:bg-[var(--color-surface-3)] cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Emoji"
            >
              <Smile size={14} />
            </button>
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
