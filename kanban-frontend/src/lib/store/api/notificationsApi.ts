import { baseApi } from './baseApi';
import { ApiResponse, NotificationItem } from '@/lib/types/api';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNotifications: build.query<ApiResponse<NotificationItem[]>, 5 | 10>({
      query: (limit = 5) => ({ url: '/notifications', params: { limit } }),
      providesTags: ['Notification'],
    }),
    markNotificationRead: build.mutation<ApiResponse<NotificationItem>, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} = notificationsApi;
