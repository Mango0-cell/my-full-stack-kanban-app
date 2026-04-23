import { baseApi } from './baseApi';
import { User, ApiResponse, UserFollow, UserSearchResult } from '@/lib/types/api';

function normalizeUserResponse(payload: unknown): ApiResponse<User> {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    'message' in payload &&
    'error' in payload
  ) {
    return payload as ApiResponse<User>;
  }

  return {
    data: payload as User,
    message: 'OK',
    error: null,
  };
}

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
    followUser: builder.mutation<ApiResponse<UserFollow>, { followed_user_id: number; label?: string }>({
      query: (body) => ({ url: '/users/follow', method: 'POST', body }),
    }),
    getUserById: builder.query<ApiResponse<User>, number>({
      async queryFn(userId, _api, _extraOptions, fetchWithBQ) {
        const paths = [`/users/${userId}`, `/users/profile/${userId}`, `/users/profile?user_id=${userId}`];

        for (const path of paths) {
          const result = await fetchWithBQ(path);
          if (!result.error) {
            return { data: normalizeUserResponse(result.data) };
          }
        }

        return {
          error: {
            status: 404,
            data: { message: 'User not found' },
          },
        };
      },
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSearchUsersQuery,
  useFollowUserMutation,
  useGetUserByIdQuery,
} = usersApi;
