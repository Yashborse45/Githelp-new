import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized caching settings
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Keep data in cache for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Retry failed requests 3 times
            retry: 3,
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect unless data is stale
            refetchOnReconnect: 'always',
        },
        mutations: {
            // Retry failed mutations once
            retry: 1,
        },
    },
});

// Query keys factory for consistent caching
export const queryKeys = {
    // Projects
    projects: ['projects'] as const,
    project: (id: string) => ['projects', id] as const,
    projectAnalytics: (id: string) => ['projects', id, 'analytics'] as const,

    // Q&A
    qaHistory: (projectId: string) => ['qa', 'history', projectId] as const,
    qaQuestion: (projectId: string, question: string) => ['qa', 'question', projectId, question] as const,

    // User
    user: ['user'] as const,
    userProjects: ['user', 'projects'] as const,

    // Dashboard
    dashboard: ['dashboard'] as const,
    dashboardStats: ['dashboard', 'stats'] as const,
} as const;

// Cache utilities
export const cacheUtils = {
    // Invalidate all project-related queries
    invalidateProjects: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },

    // Invalidate specific project
    invalidateProject: (projectId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },

    // Invalidate Q&A history for a project
    invalidateQAHistory: (projectId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.qaHistory(projectId) });
    },

    // Prefetch project data
    prefetchProject: async (projectId: string) => {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.project(projectId),
            queryFn: () => fetch(`/api/projects/${projectId}`).then(res => res.json()),
        });
    },

    // Get cached data without refetching
    getCachedProjects: () => {
        return queryClient.getQueryData(queryKeys.projects);
    },

    // Set cache data manually
    setCachedProjects: (data: any) => {
        queryClient.setQueryData(queryKeys.projects, data);
    },
};