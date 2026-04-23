'use client';

import { use, useEffect, useState } from 'react';
import { useGetMeQuery } from '@/lib/store/api/authApi';
import { useListMessagesQuery, useSendMessageMutation } from '@/lib/store/api/chatApi';
import { connectRealtime } from '@/lib/realtime/socket';
import {
  appendChatCache,
  msUntilChatCacheReset,
  readChatCache,
  writeChatCache,
} from '@/lib/realtime/chatCache';
import type { DirectMessage } from '@/lib/types/api';

interface Props {
  params: Promise<{ conversationId: string }>;
}

function formatCountdown(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId: conversationIdParam } = use(params);
  const conversationId = Number(conversationIdParam);
  const { data: meData } = useGetMeQuery();
  const me = meData?.data;

  const { data, refetch } = useListMessagesQuery(conversationId, {
    skip: !Number.isInteger(conversationId),
  });
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const [draft, setDraft] = useState('');
  const [liveMessages, setLiveMessages] = useState<DirectMessage[]>([]);
  const [resetCountdown, setResetCountdown] = useState(0);
  const cachedMessages = me?.user_id ? readChatCache(me.user_id, conversationId) : [];

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

  useEffect(() => {
    if (!me?.user_id || !conversationId || !data?.data) return;
    writeChatCache(me.user_id, conversationId, data.data);
  }, [conversationId, me?.user_id, data?.data]);

  const messages =
    (data?.data?.length ?? 0) > 0
      ? (data?.data ?? [])
      : liveMessages.length > 0
        ? liveMessages
        : cachedMessages;

  async function handleSend() {
    if (!draft.trim()) return;
    await sendMessage({ conversation_id: conversationId, content: draft.trim() }).unwrap();
    setDraft('');
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Conversation
        </h1>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          cache reset in {formatCountdown(resetCountdown)}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto rounded-xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {messages.map((m) => {
          const mine = me?.user_id === m.sender_user_id;
          return (
            <div key={m.message_id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[75%] px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: mine ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-3)',
                  color: mine ? 'var(--color-brand-200)' : 'var(--color-text-primary)',
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? handleSend() : null)}
          placeholder="Write a message..."
          className="flex-1 h-10 rounded-lg px-3 text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-surface-3)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !draft.trim()}
          className="h-10 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-brand-500)', color: '#fff' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
