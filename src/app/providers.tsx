'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { useEffect } from 'react';
import { initSyncEngine } from '@/services/sync-engine';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    useEffect(() => {
        const cleanup = initSyncEngine();

        // Register Service Worker
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' || true) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[SW] Registered:', reg.scope))
                    .catch(err => console.error('[SW] Registration failed:', err));
            });
        }

        return cleanup;
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-center" richColors />
        </QueryClientProvider>
    );
}
