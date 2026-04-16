import { baseApi } from './baseApi';
import { Column, ApiResponse } from '@/lib/types/api';

export const columnsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listColumns: builder.query<ApiResponse<Column[]>, number>({
      query: (projectId) => `/projects/${projectId}/columns`,
      providesTags: (_result, _error, projectId) => [{ type: 'Column', id: projectId }],
    }),
    createColumn: builder.mutation<ApiResponse<Column>, { projectId: number; name: string; position?: number }>({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/columns`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Column', id: projectId }],
    }),
    updateColumn: builder.mutation<ApiResponse<Column>, { projectId: number; columnId: number; name?: string; position?: number }>({
      query: ({ projectId, columnId, ...body }) => ({ url: `/projects/${projectId}/columns/${columnId}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Column', id: projectId }],
    }),
    deleteColumn: builder.mutation<ApiResponse<null>, { projectId: number; columnId: number }>({
      query: ({ projectId, columnId }) => ({ url: `/projects/${projectId}/columns/${columnId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Column', id: projectId }],
    }),
  }),
});

export const {
  useListColumnsQuery,
  useCreateColumnMutation,
  useUpdateColumnMutation,
  useDeleteColumnMutation,
} = columnsApi;
