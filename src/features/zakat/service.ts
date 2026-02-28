import { db, type LocalZakat } from '@/lib/db';
import { queueMutation } from '@/services/offline-queue';

// ================================================
// Zakat Calculator Service (Enhanced)
// ================================================
// - Savings zakat (2.5%)
// - Gold zakat
// - EPF estimation
// - Business zakat
// - Configurable nisab
// - Works fully offline
// ================================================

// Malaysian Nisab threshold (approximately)
// Based on 85 grams of gold at ~RM350/gram = RM29,750
// This can be overridden per calculation
const DEFAULT_NISAB_RM = 29750;

// EPF withdrawal estimation
// Members can withdraw ~30% of Account 2 for specific purposes
const EPF_ZAKAT_RATE = 0.025;

export type ZakatType = 'savings' | 'gold' | 'epf' | 'business' | 'total';

export interface ZakatInput {
    totalSavings: number;
    goldValue?: number;
    goldWeightGrams?: number;      // Alternative: input grams, we convert
    epfBalance?: number;           // EPF (KWSP) balance
    businessAssets?: number;       // Net business assets
    businessLiabilities?: number;  // Business liabilities to deduct
    customNisab?: number;          // Override nisab threshold
}

export interface ZakatBreakdown {
    type: ZakatType;
    label: string;
    wealthAmount: number;
    zakatAmount: number;
    isEligible: boolean;
}

export interface ZakatResult {
    totalWealth: number;
    nisabThreshold: number;
    isNisabEligible: boolean;
    zakatAmount: number;
    year: number;
    breakdown: ZakatBreakdown[];
    explanation: string;
}

// Current gold price per gram in RM (approximate)
// Should ideally be fetched from an API, cached locally
const GOLD_PRICE_PER_GRAM_RM = 350;

/**
 * Calculate Zakat with full breakdown.
 */
export function calculateZakat(input: ZakatInput): ZakatResult {
    const nisab = input.customNisab || DEFAULT_NISAB_RM;
    const year = new Date().getFullYear();
    const breakdown: ZakatBreakdown[] = [];

    // 1) Savings Zakat
    const savingsWealth = input.totalSavings;
    breakdown.push({
        type: 'savings',
        label: 'Simpanan (Savings)',
        wealthAmount: savingsWealth,
        zakatAmount: 0, // calculated after nisab check
        isEligible: false,
    });

    // 2) Gold Zakat
    const goldWealth = input.goldValue || (input.goldWeightGrams || 0) * GOLD_PRICE_PER_GRAM_RM;
    if (goldWealth > 0) {
        breakdown.push({
            type: 'gold',
            label: 'Emas (Gold)',
            wealthAmount: goldWealth,
            zakatAmount: 0,
            isEligible: false,
        });
    }

    // 3) EPF Zakat
    const epfWealth = input.epfBalance || 0;
    if (epfWealth > 0) {
        breakdown.push({
            type: 'epf',
            label: 'KWSP/EPF',
            wealthAmount: epfWealth,
            zakatAmount: 0,
            isEligible: false,
        });
    }

    // 4) Business Zakat
    const businessNet = Math.max(0, (input.businessAssets || 0) - (input.businessLiabilities || 0));
    if (businessNet > 0) {
        breakdown.push({
            type: 'business',
            label: 'Perniagaan (Business)',
            wealthAmount: businessNet,
            zakatAmount: 0,
            isEligible: false,
        });
    }

    // Total wealth
    const totalWealth = savingsWealth + goldWealth + epfWealth + businessNet;
    const isNisabEligible = totalWealth >= nisab;

    // Calculate individual zakat if eligible
    if (isNisabEligible) {
        for (const item of breakdown) {
            item.isEligible = true;
            item.zakatAmount = item.wealthAmount * EPF_ZAKAT_RATE;
        }
    }

    const zakatAmount = isNisabEligible ? totalWealth * 0.025 : 0;

    // Build explanation
    const explanation = buildExplanation(input, totalWealth, nisab, isNisabEligible, zakatAmount, breakdown);

    // Add total row
    breakdown.push({
        type: 'total',
        label: 'Jumlah Zakat',
        wealthAmount: totalWealth,
        zakatAmount,
        isEligible: isNisabEligible,
    });

    return {
        totalWealth,
        nisabThreshold: nisab,
        isNisabEligible,
        zakatAmount,
        year,
        breakdown,
        explanation,
    };
}

/**
 * Build a human-readable explanation of the calculation.
 */
function buildExplanation(
    input: ZakatInput,
    totalWealth: number,
    nisab: number,
    isEligible: boolean,
    zakatAmount: number,
    breakdown: ZakatBreakdown[]
): string {
    const lines: string[] = [];

    lines.push(`Jumlah harta anda: RM${totalWealth.toFixed(2)}`);
    lines.push(`Nisab semasa: RM${nisab.toFixed(2)} (85g emas)`);

    if (!isEligible) {
        lines.push(`\nHarta anda belum mencapai nisab. Anda tidak wajib membayar zakat tahun ini, InsyaAllah.`);
        lines.push(`Anda masih digalakkan bersedekah mengikut kemampuan.`);
    } else {
        lines.push(`\nAlhamdulillah, harta anda melebihi nisab.`);
        for (const item of breakdown) {
            if (item.type !== 'total' && item.wealthAmount > 0) {
                lines.push(`- ${item.label}: RM${item.wealthAmount.toFixed(2)} × 2.5% = RM${item.zakatAmount.toFixed(2)}`);
            }
        }
        lines.push(`\nJumlah zakat: RM${zakatAmount.toFixed(2)}`);
        if (input.epfBalance) {
            lines.push(`\nNota EPF: Sesetengah ulama berpendapat zakat KWSP hanya perlu dibayar selepas pengeluaran. Sila rujuk ustaz tempatan.`);
        }
    }

    return lines.join('\n');
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
            epf_balance: input.epfBalance || 0,
            business_assets: input.businessAssets || 0,
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

/**
 * Get configurable nisab value (could fetch from API in future).
 */
export function getNisabThreshold(): number {
    return DEFAULT_NISAB_RM;
}
