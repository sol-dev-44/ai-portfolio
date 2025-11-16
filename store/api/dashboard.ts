import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface DashboardModifyRequest {
  currentCode: string;
  userPrompt: string;
}

export interface DashboardModifyResponse {
  newCode: string;
  prompt: string;
  timestamp: string;
}

// RTK Query API
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    // POST /api/dashboard-modify - Modify dashboard with Claude
    modifyDashboard: builder.mutation<DashboardModifyResponse, DashboardModifyRequest>({
      query: (body) => ({
        url: '/dashboard-modify',
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const { 
  useModifyDashboardMutation,
} = dashboardApi;