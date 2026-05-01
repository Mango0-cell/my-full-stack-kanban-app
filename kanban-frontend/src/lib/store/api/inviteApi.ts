import { baseApi } from './baseApi';
import { ApiResponse, Invitation } from '@/lib/types/api';

interface CreateInvitationPayload {
  project_id: number;
  email: string;
  role_name: 'admin' | 'editor' | 'viewer' | 'member';
  message?: string;
}

export const inviteApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendInvite: build.mutation<ApiResponse<Invitation>, CreateInvitationPayload>({
      query: (body) => ({
        url: '/invitations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Invitation', 'Notification', 'Member'],
    }),
    listInvites: build.query<ApiResponse<Invitation[]>, void>({
      query: () => '/invitations',
      providesTags: ['Invitation'],
    }),
    listSentInvites: build.query<ApiResponse<Invitation[]>, void>({
      query: () => '/invitations/sent',
      providesTags: ['Invitation'],
    }),
    acceptInvite: build.mutation<ApiResponse<Invitation>, number>({
      query: (id) => ({ url: `/invitations/${id}/accept`, method: 'POST' }),
      invalidatesTags: ['Invitation', 'Project', 'Member', 'Notification'],
    }),
    acceptByToken: build.mutation<ApiResponse<Invitation>, string>({
      query: (token) => ({
        url: '/invitations/accept-by-token',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['Invitation', 'Project', 'Member', 'Notification'],
    }),
    cancelInvitation: build.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/invitations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invitation', 'Member'],
    }),
    updateInvitationRole: build.mutation<ApiResponse<Invitation>, { id: number; role_name: string }>({
      query: ({ id, ...body }) => ({ url: `/invitations/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Invitation', 'Member'],
    }),
    declineInvite: build.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/invitations/${id}/decline`, method: 'POST' }),
      invalidatesTags: ['Invitation', 'Notification', 'Member'],
    }),
  }),
});

export const {
  useSendInviteMutation,
  useListInvitesQuery,
  useListSentInvitesQuery,
  useAcceptInviteMutation,
  useAcceptByTokenMutation,
  useCancelInvitationMutation,
  useUpdateInvitationRoleMutation,
  useDeclineInviteMutation,
} = inviteApi;
