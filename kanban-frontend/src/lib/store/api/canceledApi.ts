import { baseApi } from './baseApi';
import { ApiResponse, CanceledItemsResponse, Card } from '@/lib/types/api';

export const canceledApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCanceledItems: build.query<ApiResponse<CanceledItemsResponse>, number>({
      query: (projectId) => `/projects/${projectId}/canceled`,
      providesTags: (_result, _error, projectId) => [{ type: 'Canceled', id: projectId }],
    }),
    cancelCard: build.mutation<ApiResponse<unknown>, { projectId: number; cardId: number }>({
      query: ({ projectId, cardId }) => ({
        url: `/projects/${projectId}/canceled/cards/${cardId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Canceled', id: projectId },
        { type: 'Card', id: `proj-${projectId}` },
      ],
    }),
    cancelColumn: build.mutation<ApiResponse<unknown>, { projectId: number; columnId: number }>({
      query: ({ projectId, columnId }) => ({
        url: `/projects/${projectId}/canceled/columns/${columnId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Canceled', id: projectId },
        { type: 'Card', id: `proj-${projectId}` },
        { type: 'Column', id: projectId },
      ],
    }),
    unarchiveCanceledCard: build.mutation<
      ApiResponse<Card>,
      { projectId: number; canceledCardId: number; target_column_id: number }
    >({
      query: ({ projectId, canceledCardId, ...body }) => ({
        url: `/projects/${projectId}/canceled/cards/${canceledCardId}/unarchive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Canceled', id: projectId },
        { type: 'Card', id: `proj-${projectId}` },
      ],
    }),
    deleteCanceledCard: build.mutation<ApiResponse<null>, { projectId: number; canceledCardId: number }>({
      query: ({ projectId, canceledCardId }) => ({
        url: `/projects/${projectId}/canceled/cards/${canceledCardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Canceled', id: projectId }],
    }),
    deleteCanceledGroup: build.mutation<ApiResponse<null>, { projectId: number; groupId: number }>({
      query: ({ projectId, groupId }) => ({
        url: `/projects/${projectId}/canceled/groups/${groupId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Canceled', id: projectId }],
    }),
  }),
});

export const {
  useListCanceledItemsQuery,
  useCancelCardMutation,
  useCancelColumnMutation,
  useUnarchiveCanceledCardMutation,
  useDeleteCanceledCardMutation,
  useDeleteCanceledGroupMutation,
} = canceledApi;
