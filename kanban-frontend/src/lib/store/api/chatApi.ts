import { baseApi } from './baseApi';
import { ApiResponse, Conversation, DirectMessage } from '@/lib/types/api';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listConversations: build.query<ApiResponse<Conversation[]>, void>({
      query: () => '/chat/conversations',
      providesTags: ['Chat'],
    }),
    listMessages: build.query<ApiResponse<DirectMessage[]>, number>({
      query: (conversationId) => `/chat/conversations/${conversationId}/messages`,
      providesTags: (_r, _e, conversationId) => [{ type: 'Chat', id: conversationId }],
    }),
    sendMessage: build.mutation<
      ApiResponse<DirectMessage>,
      { content: string; recipient_user_id?: number; conversation_id?: number }
    >({
      query: (body) => ({ url: '/chat/messages', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        'Chat',
        ...(arg.conversation_id ? [{ type: 'Chat' as const, id: arg.conversation_id }] : []),
      ],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useListMessagesQuery,
  useSendMessageMutation,
} = chatApi;
