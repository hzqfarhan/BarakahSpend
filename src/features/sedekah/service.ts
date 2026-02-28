import { db, type LocalSedekah } from '@/lib/db';
import { queueMutation } from '@/services/offline-queue';
import { createClient } from '@/services/supabase/client';

// ================================================
// Sedekah Service (Offline-First)
// ================================================

export interface CreateSedekahInput {
    amount: number;
    recipient?: string;
    description?: string;
    date: string;
}

/**
 * Create sedekah record — saves locally first, then queues for sync.
 */
export async function createSedekah(
    userId: string,
    input: CreateSedekahInput
): Promise<string> {
    const offlineId = `sed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const localSedekah: LocalSedekah = {
        user_id: userId,
        amount: input.amount,
        recipient: input.recipient,
        description: input.description,
        date: input.date,
        offline_id: offlineId,
        synced: false,
        created_at: now,
    };

    await db.sedekah.add(localSedekah);

    await queueMutation({
        tableName: 'sedekah_records',
        operation: 'create',
        data: {
            user_id: userId,
            amount: input.amount,
            recipient: input.recipient || null,
            description: input.description || null,
            date: input.date,
            offline_id: offlineId,
        },
    });

    return offlineId;
}

/**
 * Get all sedekah records for a user from local DB.
 */
export async function getLocalSedekah(userId: string): Promise<LocalSedekah[]> {
    return db.sedekah.where('user_id').equals(userId).reverse().sortBy('date');
}

/**
 * Delete sedekah record locally and queue sync.
 */
export async function deleteSedekah(localId: number): Promise<void> {
    const record = await db.sedekah.get(localId);
    if (!record) throw new Error('Sedekah record not found');

    await db.sedekah.delete(localId);

    if (record.server_id) {
        await queueMutation({
            tableName: 'sedekah_records',
            operation: 'delete',
            data: { id: record.server_id },
        });
    }
}

/**
 * Get total sedekah for current month.
 */
export async function getMonthlyTotalSedekah(userId: string): Promise<number> {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endMonth = now.getMonth() + 2;
    const endDate = `${now.getFullYear()}-${String(endMonth).padStart(2, '0')}-01`;

    const records = await db.sedekah
        .where('user_id')
        .equals(userId)
        .filter((r) => r.date >= startDate && r.date < endDate)
        .toArray();

    return records.reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Sync server sedekah to local DB.
 */
export async function syncSedekahFromServer(userId: string): Promise<void> {
    if (!navigator.onLine) return;

    const supabase = createClient();
    const { data, error } = await supabase
        .from('sedekah_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error || !data) return;

    for (const serverRecord of data) {
        const existing = await db.sedekah
            .where('offline_id')
            .equals(serverRecord.offline_id || '')
            .first();

        if (existing) {
            await db.sedekah.update(existing.id!, {
                server_id: serverRecord.id,
                synced: true,
                amount: serverRecord.amount,
                recipient: serverRecord.recipient,
                description: serverRecord.description,
                date: serverRecord.date,
            });
        } else {
            await db.sedekah.add({
                server_id: serverRecord.id,
                user_id: serverRecord.user_id,
                amount: serverRecord.amount,
                recipient: serverRecord.recipient,
                description: serverRecord.description,
                date: serverRecord.date,
                offline_id: serverRecord.offline_id || serverRecord.id,
                synced: true,
                created_at: serverRecord.created_at,
            });
        }
    }
}

/**
 * Calculate sedekah streak (consecutive days).
 */
export async function getSedekahStreak(userId: string): Promise<number> {
    const records = await db.sedekah
        .where('user_id')
        .equals(userId)
        .reverse()
        .sortBy('date');

    if (records.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = new Date(records[0].date);
    lastDate.setHours(0, 0, 0, 0);

    // Check if the most recent sedekah is today or yesterday
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;

    for (let i = 1; i < records.length; i++) {
        const curr = new Date(records[i - 1].date);
        const prev = new Date(records[i].date);
        const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diff === 1) {
            streak++;
        } else if (diff > 1) {
            break;
        }
    }

    return streak;
}
