import { baseApi } from './baseApi';
import { User, ApiResponse } from '@/lib/types/api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: (body) => ({ url: '/users/profile', method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<ApiResponse<null>, { current_password: string; new_password: string }>({
      query: (body) => ({ url: '/users/password', method: 'PUT', body }),
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } = usersApi;
