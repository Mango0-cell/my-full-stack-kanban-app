import type { DirectMessage } from '@/lib/types/api';

const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const CACHE_MAX_ITEMS = 40;

interface ChatCachePayload {
  createdAt: number;
  messages: DirectMessage[];
}

function key(userId: number, conversationId: number) {
  return `chat-cache:${userId}:${conversationId}`;
}

export function readChatCache(userId: number, conversationId: number): DirectMessage[] {
  try {
    const raw = localStorage.getItem(key(userId, conversationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatCachePayload;
    if (!parsed?.createdAt || !Array.isArray(parsed.messages)) return [];

    if (Date.now() - parsed.createdAt > CACHE_TTL_MS) {
      localStorage.removeItem(key(userId, conversationId));
      return [];
    }
    return parsed.messages.slice(-CACHE_MAX_ITEMS);
  } catch {
    return [];
  }
}

export function writeChatCache(userId: number, conversationId: number, messages: DirectMessage[]) {
  try {
    const next = messages.slice(-CACHE_MAX_ITEMS);
    const payload: ChatCachePayload = {
      createdAt: Date.now(),
      messages: next,
    };
    localStorage.setItem(key(userId, conversationId), JSON.stringify(payload));
  } catch {
    // noop
  }
}

export function appendChatCache(userId: number, conversationId: number, message: DirectMessage) {
  const current = readChatCache(userId, conversationId);
  const deduped = current.filter((m) => m.message_id !== message.message_id);
  deduped.push(message);
  writeChatCache(userId, conversationId, deduped);
}

export function msUntilChatCacheReset(userId: number, conversationId: number): number {
  try {
    const raw = localStorage.getItem(key(userId, conversationId));
    if (!raw) return CACHE_TTL_MS;
    const parsed = JSON.parse(raw) as ChatCachePayload;
    if (!parsed?.createdAt) return CACHE_TTL_MS;
    const elapsed = Date.now() - parsed.createdAt;
    return Math.max(0, CACHE_TTL_MS - elapsed);
  } catch {
    return CACHE_TTL_MS;
  }
}
