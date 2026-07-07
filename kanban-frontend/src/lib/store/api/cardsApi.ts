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
    moveCard: builder.mutation<ApiResponse<Card>, { cardId: number; columnId: number; position: number; projectId: number }>({
      query: ({ cardId, columnId, position }) => ({
        url: `/cards/${cardId}/move`,
        method: 'PUT',
        body: { column_id: columnId, position },
      }),
      // Optimistically patch the cached listCards so the board keeps the new
      // order the instant the drag ends. Without this, clearing localCards
      // falls back to stale cache until the refetch lands — invisible locally
      // but a visible "blink" under production network latency.
      async onQueryStarted({ cardId, columnId, position, projectId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cardsApi.util.updateQueryData('listCards', projectId, (draft) => {
            const cards = draft.data;
            const card = cards.find((c) => c.card_id === cardId);
            if (!card) return;
            const prevColumnId = card.column_id;
            card.column_id = columnId;

            // Reindex the target column with the card inserted at `position`.
            const target = cards
              .filter((c) => c.column_id === columnId && c.card_id !== cardId)
              .sort((a, b) => a.position - b.position);
            const clamped = Math.max(0, Math.min(position, target.length));
            target.splice(clamped, 0, card);
            target.forEach((c, i) => { c.position = i; });

            // Reindex the source column when the card moved across columns.
            if (prevColumnId !== columnId) {
              cards
                .filter((c) => c.column_id === prevColumnId)
                .sort((a, b) => a.position - b.position)
                .forEach((c, i) => { c.position = i; });
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
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
