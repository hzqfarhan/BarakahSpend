'use client';

import { useState, useEffect } from 'react';
import { getPendingCount } from '@/services/offline-queue';

/**
 * Hook to track pending sync count.
 */
export function useSyncStatus() {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(async () => {
            const count = await getPendingCount();
            setPendingCount(count);
        }, 5000);

        // Initial check
        getPendingCount().then(setPendingCount);

        return () => clearInterval(interval);
    }, []);

    return { pendingCount, hasPending: pendingCount > 0 };
}
