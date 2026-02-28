import { db, type LocalExpense } from '@/lib/db';
import { queueMutation } from '@/services/offline-queue';
import { createClient } from '@/services/supabase/client';

// ================================================
// Expense Categories
// ================================================

export const EXPENSE_CATEGORIES = [
    { value: 'makanan_halal', label: 'Makanan Halal', icon: '🍽️', color: '#22c55e' },
    { value: 'nafkah_keluarga', label: 'Nafkah Keluarga', icon: '👨‍👩‍👧‍👦', color: '#3b82f6' },
    { value: 'sedekah', label: 'Sedekah', icon: '🤲', color: '#a855f7' },
    { value: 'wakaf', label: 'Wakaf', icon: '🕌', color: '#ec4899' },
    { value: 'hutang', label: 'Hutang', icon: '📋', color: '#ef4444' },
    { value: 'simpanan', label: 'Simpanan', icon: '💰', color: '#eab308' },
    { value: 'hiburan', label: 'Hiburan', icon: '🎮', color: '#6366f1' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

// ================================================
// Expense Service (Offline-First)
// ================================================

export interface CreateExpenseInput {
    amount: number;
    category: ExpenseCategory;
    description?: string;
    date: string;
    is_ramadan?: boolean;
    ramadan_meal?: 'sahur' | 'iftar';
}

/**
 * Create expense — saves locally first, then queues for sync.
 */
export async function createExpense(
    userId: string,
    input: CreateExpenseInput
): Promise<string> {
    const offlineId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const localExpense: LocalExpense = {
        user_id: userId,
        amount: input.amount,
        category: input.category,
        description: input.description,
        date: input.date,
        is_ramadan: input.is_ramadan,
        ramadan_meal: input.ramadan_meal,
        offline_id: offlineId,
        synced: false,
        created_at: now,
        updated_at: now,
    };

    // Save to IndexedDB
    await db.expenses.add(localExpense);

    // Queue for sync
    await queueMutation({
        tableName: 'expenses',
        operation: 'create',
        data: {
            user_id: userId,
            amount: input.amount,
            category: input.category,
            description: input.description || null,
            date: input.date,
            is_ramadan: input.is_ramadan || false,
            ramadan_meal: input.ramadan_meal || null,
            offline_id: offlineId,
        },
    });

    return offlineId;
}

/**
 * Update expense locally and queue sync.
 */
export async function updateExpense(
    localId: number,
    input: Partial<CreateExpenseInput>
): Promise<void> {
    const expense = await db.expenses.get(localId);
    if (!expense) throw new Error('Expense not found');

    const updates: Partial<LocalExpense> = {
        ...input,
        updated_at: new Date().toISOString(),
        synced: false,
    };

    await db.expenses.update(localId, updates);

    if (expense.server_id) {
        await queueMutation({
            tableName: 'expenses',
            operation: 'update',
            data: { id: expense.server_id, ...input },
        });
    }
}

/**
 * Delete expense locally and queue sync.
 */
export async function deleteExpense(localId: number): Promise<void> {
    const expense = await db.expenses.get(localId);
    if (!expense) throw new Error('Expense not found');

    await db.expenses.delete(localId);

    if (expense.server_id) {
        await queueMutation({
            tableName: 'expenses',
            operation: 'delete',
            data: { id: expense.server_id },
        });
    }
}

/**
 * Get all expenses for a user from local DB.
 */
export async function getLocalExpenses(userId: string): Promise<LocalExpense[]> {
    return db.expenses.where('user_id').equals(userId).reverse().sortBy('date');
}

/**
 * Sync server expenses to local DB.
 */
export async function syncExpensesFromServer(userId: string): Promise<void> {
    if (!navigator.onLine) return;

    const supabase = createClient();
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error || !data) return;

    // Server data overrides local conflicts
    for (const serverExpense of data) {
        const existing = await db.expenses
            .where('offline_id')
            .equals(serverExpense.offline_id || '')
            .first();

        if (existing) {
            await db.expenses.update(existing.id!, {
                server_id: serverExpense.id,
                synced: true,
                amount: serverExpense.amount,
                category: serverExpense.category,
                description: serverExpense.description,
                date: serverExpense.date,
            });
        } else {
            await db.expenses.add({
                server_id: serverExpense.id,
                user_id: serverExpense.user_id,
                amount: serverExpense.amount,
                category: serverExpense.category,
                description: serverExpense.description,
                date: serverExpense.date,
                is_ramadan: serverExpense.is_ramadan,
                ramadan_meal: serverExpense.ramadan_meal,
                offline_id: serverExpense.offline_id || serverExpense.id,
                synced: true,
                created_at: serverExpense.created_at,
                updated_at: serverExpense.updated_at,
            });
        }
    }
}

/**
 * Get monthly expenses total by category.
 */
export async function getExpensesByCategory(
    userId: string,
    month: number,
    year: number
): Promise<Record<string, number>> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const expenses = await db.expenses
        .where('user_id')
        .equals(userId)
        .filter((e) => e.date >= startDate && e.date < endDate)
        .toArray();

    const byCategory: Record<string, number> = {};
    for (const exp of expenses) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    }
    return byCategory;
}
