import { db, type LocalZakat } from '@/lib/db';
import { queueMutation } from '@/services/offline-queue';

// ================================================
// Zakat Calculator Service
// ================================================
// - 2.5% calculation
// - Nisab eligibility detection
// - Yearly history storage
// ================================================

// Malaysian Nisab threshold (approximately — should be fetched from authority)
// Based on 85 grams of gold at ~RM350/gram = RM29,750
const DEFAULT_NISAB_RM = 29750;

export interface ZakatInput {
    totalSavings: number;
    goldValue?: number;
}

export interface ZakatResult {
    totalWealth: number;
    nisabThreshold: number;
    isNisabEligible: boolean;
    zakatAmount: number;
    year: number;
}

/**
 * Calculate Zakat (2.5% of total wealth if above Nisab).
 */
export function calculateZakat(input: ZakatInput): ZakatResult {
    const totalWealth = input.totalSavings + (input.goldValue || 0);
    const isNisabEligible = totalWealth >= DEFAULT_NISAB_RM;
    const zakatAmount = isNisabEligible ? totalWealth * 0.025 : 0;
    const year = new Date().getFullYear();

    return {
        totalWealth,
        nisabThreshold: DEFAULT_NISAB_RM,
        isNisabEligible,
        zakatAmount,
        year,
    };
}

/**
 * Save Zakat calculation locally and queue for sync.
 */
export async function saveZakatRecord(
    userId: string,
    result: ZakatResult,
    input: ZakatInput
): Promise<string> {
    const offlineId = `zak_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const localZakat: LocalZakat = {
        user_id: userId,
        total_savings: input.totalSavings,
        gold_value: input.goldValue || 0,
        zakat_amount: result.zakatAmount,
        nisab_eligible: result.isNisabEligible,
        year: result.year,
        offline_id: offlineId,
        synced: false,
        calculated_at: new Date().toISOString(),
    };

    await db.zakat.add(localZakat);

    await queueMutation({
        tableName: 'zakat_records',
        operation: 'create',
        data: {
            user_id: userId,
            total_savings: input.totalSavings,
            gold_value: input.goldValue || 0,
            zakat_amount: result.zakatAmount,
            nisab_eligible: result.isNisabEligible,
            year: result.year,
            offline_id: offlineId,
        },
    });

    return offlineId;
}

/**
 * Get Zakat history for a user from local DB.
 */
export async function getZakatHistory(userId: string): Promise<LocalZakat[]> {
    return db.zakat.where('user_id').equals(userId).reverse().sortBy('year');
}

/**
 * Get the most recent Zakat record.
 */
export async function getLatestZakat(userId: string): Promise<LocalZakat | undefined> {
    const records = await db.zakat
        .where('user_id')
        .equals(userId)
        .reverse()
        .sortBy('calculated_at');
    return records[0];
}
