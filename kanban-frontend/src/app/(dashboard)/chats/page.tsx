'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useListConversationsQuery } from '@/lib/store/api/chatApi';
import { PixelDino } from '@/components/shared/PixelDino';

export default function ChatsPage() {
  const router = useRouter();
  const { data, isLoading } = useListConversationsQuery();
  const conversations = data?.data ?? [];

  if (isLoading) {
    return <div className="p-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading chats...</div>;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="flex flex-col items-center text-center max-w-xs">
          <PixelDino size={220} />
          <h3 className="text-xl md:text-2xl font-semibold mt-1 mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Nothing yet here
          </h3>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Start a conversation from the users menu in the header.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        Conversations
      </h1>
      <div className="space-y-3">
        {conversations.map((c) => (
          <button
            key={c.conversation_id}
            onClick={() => router.push(`/chats/${c.conversation_id}`)}
            className="w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {c.other_user_display_name || c.other_user_email}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {c.last_message_content ?? 'No messages yet'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
