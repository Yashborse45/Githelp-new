"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    // Create a new QueryClient instance for each render to avoid sharing state between users
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Cache data for 5 minutes by default
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        // Keep data in cache for 10 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes
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
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Only show devtools in development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    );
}