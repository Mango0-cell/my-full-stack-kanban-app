import { baseApi } from './baseApi';
import { Project, ProjectMember, ApiResponse } from '@/lib/types/api';

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjects: builder.query<ApiResponse<Project[]>, void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    getProject: builder.query<ApiResponse<Project>, number>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<ApiResponse<Project>, { project_name: string; description?: string }>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<ApiResponse<Project>, { id: number; project_name?: string; description?: string }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),
    deleteProject: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),
    listMembers: builder.query<ApiResponse<ProjectMember[]>, number>({
      query: (projectId) => `/projects/${projectId}/members`,
      providesTags: (_result, _error, projectId) => [{ type: 'Member', id: projectId }],
    }),
    addMember: builder.mutation<ApiResponse<ProjectMember>, { projectId: number; user_email: string; role_name: string }>({
      query: ({ projectId, ...body }) => ({ url: `/projects/${projectId}/members`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Member', id: projectId }],
    }),
    updateMemberRole: builder.mutation<ApiResponse<ProjectMember>, { projectId: number; userId: number; role_name: string }>({
      query: ({ projectId, userId, ...body }) => ({ url: `/projects/${projectId}/members/${userId}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Member', id: projectId }],
    }),
    removeMember: builder.mutation<ApiResponse<null>, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({ url: `/projects/${projectId}/members/${userId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, { projectId }) => [{ type: 'Member', id: projectId }],
    }),
  }),
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = projectsApi;
