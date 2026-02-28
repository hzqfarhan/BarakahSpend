'use client';

import { QueryClient } from '@tanstack/react-query';

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                gcTime: 1000 * 60 * 60 * 24, // 24 hours for offline persistence
                retry: 2,
                refetchOnWindowFocus: false,
                networkMode: 'offlineFirst',
            },
            mutations: {
                networkMode: 'offlineFirst',
            },
        },
    });
}

export function getQueryClient() {
    if (typeof window === 'undefined') {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}
