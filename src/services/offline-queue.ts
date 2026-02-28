import { db, type OfflineQueueItem } from '@/lib/db';

// ================================================
// Offline Queue Service
// ================================================
// Manages a queue of mutations (create/update/delete)
// that occurred while offline. Each mutation gets a
// unique mutation_id to prevent duplicate submissions.
// ================================================

function generateMutationId(): string {
    return `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export type MutationOperation = 'create' | 'update' | 'delete';

export interface QueueMutationPayload {
    tableName: string;
    operation: MutationOperation;
    data: Record<string, unknown>;
}

/**
 * Add a mutation to the offline queue.
 * Returns the mutation_id for deduplication tracking.
 */
export async function queueMutation(payload: QueueMutationPayload): Promise<string> {
    const mutationId = generateMutationId();

    await db.offlineQueue.add({
        mutation_id: mutationId,
        table_name: payload.tableName,
        operation: payload.operation,
        data: JSON.stringify(payload.data),
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
    });

    return mutationId;
}

/**
 * Get all pending mutations in queue order.
 */
export async function getPendingMutations(): Promise<OfflineQueueItem[]> {
    return db.offlineQueue
        .where('status')
        .anyOf(['pending', 'failed'])
        .sortBy('created_at');
}

/**
 * Update the status of a queued mutation.
 */
export async function updateMutationStatus(
    id: number,
    status: OfflineQueueItem['status'],
    error?: string
): Promise<void> {
    const update: Partial<OfflineQueueItem> = { status };
    if (error) update.error = error;
    if (status === 'failed') {
        const item = await db.offlineQueue.get(id);
        if (item) {
            update.retry_count = (item.retry_count || 0) + 1;
        }
    }
    await db.offlineQueue.update(id, update);
}

/**
 * Remove synced mutations from the queue.
 */
export async function clearSyncedMutations(): Promise<void> {
    await db.offlineQueue.where('status').equals('synced').delete();
}

/**
 * Get the count of pending mutations.
 */
export async function getPendingCount(): Promise<number> {
    return db.offlineQueue.where('status').anyOf(['pending', 'failed']).count();
}

/**
 * Check if a mutation_id already exists (deduplication).
 */
export async function mutationExists(mutationId: string): Promise<boolean> {
    const count = await db.offlineQueue.where('mutation_id').equals(mutationId).count();
    return count > 0;
}
