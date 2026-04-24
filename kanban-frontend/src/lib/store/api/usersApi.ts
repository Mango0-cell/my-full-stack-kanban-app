import { baseApi } from './baseApi';
import { User, ApiResponse, UserSearchResult } from '@/lib/types/api';

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
    searchUsers: builder.query<ApiResponse<UserSearchResult[]>, string>({
      query: (email) => ({ url: '/users/search', params: { email } }),
    }),
    getUserById: builder.query<ApiResponse<User>, number>({
      query: (userId) => ({ url: `/users/${userId}` }),
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSearchUsersQuery,
  useGetUserByIdQuery,
} = usersApi;
