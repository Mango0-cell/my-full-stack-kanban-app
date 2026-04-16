import { baseApi } from './baseApi';
import { Card, ApiResponse } from '@/lib/types/api';

export const cardsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCards: builder.query<ApiResponse<Card[]>, number>({
      query: (projectId) => `/projects/${projectId}/cards`,
      providesTags: (_result, _error, projectId) => [{ type: 'Card', id: `proj-${projectId}` }],
    }),
    listColumnCards: builder.query<ApiResponse<Card[]>, number>({
      query: (columnId) => `/columns/${columnId}/cards`,
      providesTags: (_result, _error, columnId) => [{ type: 'Card', id: `col-${columnId}` }],
    }),
    getCard: builder.query<ApiResponse<Card>, number>({
      query: (cardId) => `/cards/${cardId}`,
      providesTags: (_result, _error, cardId) => [{ type: 'Card', id: cardId }],
    }),
    createCard: builder.mutation<ApiResponse<Card>, { columnId: number; projectId: number; title: string; description?: string; priority?: string; due_date?: string; assigned_user_id?: number }>({
      query: ({ columnId, projectId: _p, ...body }) => ({ url: `/columns/${columnId}/cards`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Card', id: `proj-${projectId}` }],
    }),
    updateCard: builder.mutation<ApiResponse<Card>, { cardId: number; projectId: number; title?: string; description?: string; priority?: string; due_date?: string; assigned_user_id?: number | null }>({
      query: ({ cardId, projectId: _p, ...body }) => ({ url: `/cards/${cardId}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { cardId, projectId }) => [
        { type: 'Card', id: cardId },
        { type: 'Card', id: `proj-${projectId}` },
      ],
    }),
    deleteCard: builder.mutation<ApiResponse<null>, { cardId: number; projectId: number }>({
      query: ({ cardId }) => ({ url: `/cards/${cardId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Card', id: `proj-${projectId}` }],
    }),
    moveCard: builder.mutation<ApiResponse<Card>, { cardId: number; columnId: number; position: number }>({
      query: ({ cardId, columnId, position }) => ({
        url: `/cards/${cardId}/move`,
        method: 'PUT',
        body: { column_id: columnId, position },
      }),
      // Invalidation handled optimistically in BoardDnD; let RTK refetch on settle
      invalidatesTags: () => [{ type: 'Card' as const }],
    }),
  }),
});

export const {
  useListCardsQuery,
  useListColumnCardsQuery,
  useGetCardQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useMoveCardMutation,
} = cardsApi;
