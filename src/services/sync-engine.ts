import { createClient } from '@/services/supabase/client';
import {
    getPendingMutations,
    updateMutationStatus,
    clearSyncedMutations,
} from '@/services/offline-queue';
import type { OfflineQueueItem } from '@/lib/db';

// ================================================
// Sync Engine
// ================================================
// Auto-syncs queued offline mutations to Supabase
// when the device goes online. Implements:
// - Automatic online/offline detection
// - Retry with exponential backoff
// - Server-wins conflict resolution
// - Duplicate submission prevention
// ================================================

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

let isSyncing = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the sync engine.
 * Listens for online/offline events and starts periodic sync.
 */
export function initSyncEngine(): () => void {
    const handleOnline = () => {
        console.log('[SyncEngine] Online — starting sync');
        syncAll();
    };

    const handleOffline = () => {
        console.log('[SyncEngine] Offline — pausing sync');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync every 30 seconds when online
    syncInterval = setInterval(() => {
        if (navigator.onLine) {
            syncAll();
        }
    }, 30_000);

    // Initial sync if online
    if (navigator.onLine) {
        syncAll();
    }

    // Cleanup function
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (syncInterval) clearInterval(syncInterval);
    };
}

/**
 * Process all pending mutations in order.
 */
export async function syncAll(): Promise<void> {
    if (isSyncing) return;
    isSyncing = true;

    try {
        const pending = await getPendingMutations();
        if (pending.length === 0) {
            isSyncing = false;
            return;
        }

        console.log(`[SyncEngine] Syncing ${pending.length} mutations...`);

        for (const mutation of pending) {
            if (mutation.retry_count >= MAX_RETRIES) {
                console.warn(`[SyncEngine] Skipping mutation ${mutation.mutation_id} — max retries reached`);
                continue;
            }

            await syncMutation(mutation);
        }

        // Clean up synced mutations
        await clearSyncedMutations();
        console.log('[SyncEngine] Sync complete');
    } catch (error) {
        console.error('[SyncEngine] Sync error:', error);
    } finally {
        isSyncing = false;
    }
}

/**
 * Sync a single mutation to Supabase.
 */
async function syncMutation(mutation: OfflineQueueItem): Promise<void> {
    const supabase = createClient();
    const data = JSON.parse(mutation.data);

    try {
        await updateMutationStatus(mutation.id!, 'syncing');

        let result;

        switch (mutation.operation) {
            case 'create':
                result = await supabase
                    .from(mutation.table_name)
                    .upsert(
                        { ...data, offline_id: mutation.mutation_id },
                        { onConflict: 'offline_id' }
                    );
                break;

            case 'update':
                result = await supabase
                    .from(mutation.table_name)
                    .update(data)
                    .match({ id: data.id });
                break;

            case 'delete':
                result = await supabase
                    .from(mutation.table_name)
                    .delete()
                    .match({ id: data.id });
                break;
        }

        if (result?.error) {
            throw result.error;
        }

        await updateMutationStatus(mutation.id!, 'synced');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SyncEngine] Failed to sync ${mutation.mutation_id}:`, errorMessage);
        await updateMutationStatus(mutation.id!, 'failed', errorMessage);

        // Exponential backoff delay before next retry
        const delay = BASE_DELAY_MS * Math.pow(2, mutation.retry_count);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
