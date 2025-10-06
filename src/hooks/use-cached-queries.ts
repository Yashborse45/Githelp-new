import { cacheHelpers, cacheKeys, localCache, sessionCache } from '@/lib/cache';
import { queryKeys } from '@/lib/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Hook for fetching projects with caching
export function useProjects() {
    return useQuery({
        queryKey: queryKeys.projects,
        queryFn: async () => {
            // First check local cache
            const cachedProjects = localCache.get(cacheKeys.recentProjects);

            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const projects = await response.json();

            // Cache the result for 30 minutes
            localCache.set('projects_list', projects, 30);

            return projects;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

// Hook for fetching a specific project with caching
export function useProject(projectId: string) {
    return useQuery({
        queryKey: queryKeys.project(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch project');
            }

            const project = await response.json();

            // Cache project details for 15 minutes
            localCache.set(`project_${projectId}`, project, 15);

            // Add to recent projects
            cacheHelpers.saveRecentProject(projectId, project.name);

            return project;
        },
        enabled: !!projectId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

// Hook for Q&A history with caching
export function useQAHistory(projectId: string) {
    return useQuery({
        queryKey: queryKeys.qaHistory(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/qa/history?projectId=${projectId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Q&A history');
            }

            const history = await response.json();

            // Cache Q&A history for 10 minutes
            sessionCache.set(`qa_history_${projectId}`, history);

            return history;
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
    });
}

// Hook for asking a question with caching
// Note: useAskQuestion is now handled by tRPC directly in qa-component.tsx
// This hook is kept for backward compatibility but should use tRPC's built-in mutation
export function useAskQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, question }: { projectId: string; question: string }) => {
            // This should be replaced with direct tRPC call in components
            // For now, throw a descriptive error
            throw new Error('This hook should not be used directly. Use api.qa.ask.useMutation() from tRPC instead.');
        },
        onSuccess: (data, variables) => {
            // Invalidate and refetch Q&A history
            queryClient.invalidateQueries({
                queryKey: queryKeys.qaHistory(variables.projectId)
            });

            // Cache the question-answer pair
            const cacheKey = `qa_${variables.projectId}_${variables.question}`;
            sessionCache.set(cacheKey, data);
        },
    });
}

// Hook for project analytics with caching
export function useProjectAnalytics(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projectAnalytics(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}/analytics`);
            if (!response.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const analytics = await response.json();

            // Cache analytics for 1 hour
            localCache.set(`analytics_${projectId}`, analytics, 60);

            return analytics;
        },
        enabled: !!projectId,
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
    });
}

// Hook for dashboard stats with caching
export function useDashboardStats() {
    return useQuery({
        queryKey: queryKeys.dashboardStats,
        queryFn: async () => {
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }

            const stats = await response.json();

            // Cache dashboard stats for 10 minutes
            sessionCache.set('dashboard_stats', stats);

            return stats;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}

// Hook for user preferences with local storage
export function useUserPreferences() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['userPreferences'],
        queryFn: () => {
            // Get from local storage
            return cacheHelpers.getUserPreferences() || {
                theme: 'light',
                language: 'en',
                notifications: true,
                autoSave: true,
            };
        },
        staleTime: Infinity, // Never goes stale
        gcTime: Infinity, // Never garbage collected
    });

    const mutation = useMutation({
        mutationFn: async (preferences: any) => {
            // Save to local storage
            cacheHelpers.saveUserPreferences(preferences);
            return preferences;
        },
        onSuccess: (data) => {
            // Update cache
            queryClient.setQueryData(['userPreferences'], data);
        },
    });

    return {
        ...query,
        updatePreferences: mutation.mutate,
        isUpdating: mutation.isPending,
    };
}

// Hook for recent projects
export function useRecentProjects() {
    return useQuery({
        queryKey: ['recentProjects'],
        queryFn: () => {
            return cacheHelpers.getRecentProjects();
        },
        staleTime: Infinity, // Never goes stale since it's from localStorage
        gcTime: Infinity, // Never garbage collected
    });
}

// Hook for form draft management
export function useFormDraft(formId: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['formDraft', formId],
        queryFn: () => {
            return cacheHelpers.getFormDraft(formId);
        },
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const saveDraft = (data: any) => {
        cacheHelpers.saveFormDraft(formId, data);
        queryClient.setQueryData(['formDraft', formId], data);
    };

    return {
        ...query,
        saveDraft,
    };
}

// Custom hook for prefetching data
export function usePrefetch() {
    const queryClient = useQueryClient();

    return {
        prefetchProject: (projectId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.project(projectId),
                queryFn: () => fetch(`/api/projects/${projectId}`).then(res => res.json()),
                staleTime: 10 * 60 * 1000,
            });
        },

        prefetchQAHistory: (projectId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.qaHistory(projectId),
                queryFn: () => fetch(`/api/qa/history?projectId=${projectId}`).then(res => res.json()),
                staleTime: 5 * 60 * 1000,
            });
        },

        prefetchAnalytics: (projectId: string) => {
            queryClient.prefetchQuery({
                queryKey: queryKeys.projectAnalytics(projectId),
                queryFn: () => fetch(`/api/projects/${projectId}/analytics`).then(res => res.json()),
                staleTime: 15 * 60 * 1000,
            });
        },
    };
}