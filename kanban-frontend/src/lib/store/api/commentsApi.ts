import { baseApi } from './baseApi';
import { Comment, ApiResponse } from '@/lib/types/api';

export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listComments: builder.query<ApiResponse<Comment[]>, number>({
      query: (cardId) => `/cards/${cardId}/comments`,
      providesTags: (_result, _error, cardId) => [{ type: 'Comment', id: cardId }],
    }),
    addComment: builder.mutation<ApiResponse<Comment>, { cardId: number; content: string }>({
      query: ({ cardId, content }) => ({ url: `/cards/${cardId}/comments`, method: 'POST', body: { content } }),
      invalidatesTags: (_result, _error, { cardId }) => [{ type: 'Comment', id: cardId }],
    }),
    updateComment: builder.mutation<ApiResponse<Comment>, { commentId: number; cardId: number; content: string }>({
      query: ({ commentId, content }) => ({ url: `/comments/${commentId}`, method: 'PUT', body: { content } }),
      invalidatesTags: (_result, _error, { cardId }) => [{ type: 'Comment', id: cardId }],
    }),
    deleteComment: builder.mutation<ApiResponse<null>, { commentId: number; cardId: number }>({
      query: ({ commentId }) => ({ url: `/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { cardId }) => [{ type: 'Comment', id: cardId }],
    }),
  }),
});

export const {
  useListCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentsApi;
