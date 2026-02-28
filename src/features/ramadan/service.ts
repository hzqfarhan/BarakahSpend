import { db } from '@/lib/db';
import { EXPENSE_CATEGORIES } from '@/features/expenses/service';

// ================================================
// Ramadan Smart Mode Service
// ================================================
// - Auto-detect Ramadan period
// - Sahur/Iftar spending tracking
// - Sedekah streak during Ramadan
// ================================================

// Ramadan 2025/1446H: ~March 1 - March 30
// Ramadan 2026/1447H: ~February 18 - March 19
// These dates shift ~11 days earlier each year
const RAMADAN_DATES: Record<number, { start: string; end: string }> = {
    2025: { start: '2025-03-01', end: '2025-03-30' },
    2026: { start: '2026-02-18', end: '2026-03-19' },
    2027: { start: '2027-02-08', end: '2027-03-09' },
};

/**
 * Check if current date is within Ramadan.
 */
export function isRamadanActive(date?: Date): boolean {
    const now = date || new Date();
    const year = now.getFullYear();
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) return false;

    const today = now.toISOString().split('T')[0];
    return today >= ramadan.start && today <= ramadan.end;
}

/**
 * Get Ramadan dates for a given year.
 */
export function getRamadanDates(year: number) {
    return RAMADAN_DATES[year] || null;
}

/**
 * Get Ramadan day number (1-30).
 */
export function getRamadanDay(date?: Date): number {
    const now = date || new Date();
    const year = now.getFullYear();
    const ramadan = RAMADAN_DATES[year];

    if (!ramadan) return 0;

    const start = new Date(ramadan.start);
    const diff = Math.floor(
        (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, Math.min(30, diff + 1));
}

export interface RamadanStats {
    isActive: boolean;
    day: number;
    sahurTotal: number;
    iftarTotal: number;
    sedekahStreak: number;
    totalExpenses: number;
    dailyAverage: number;
}

/**
 * Get Ramadan spending statistics.
 */
export async function getRamadanStats(userId: string): Promise<RamadanStats> {
    const now = new Date();
    const year = now.getFullYear();
    const ramadan = RAMADAN_DATES[year];
    const isActive = isRamadanActive();
    const day = getRamadanDay();

    if (!ramadan || !isActive) {
        return {
            isActive: false,
            day: 0,
            sahurTotal: 0,
            iftarTotal: 0,
            sedekahStreak: 0,
            totalExpenses: 0,
            dailyAverage: 0,
        };
    }

    // Get Ramadan expenses
    const expenses = await db.expenses
        .where('user_id')
        .equals(userId)
        .filter((e) => e.date >= ramadan.start && e.date <= ramadan.end)
        .toArray();

    const sahurTotal = expenses
        .filter((e) => e.ramadan_meal === 'sahur')
        .reduce((sum, e) => sum + e.amount, 0);

    const iftarTotal = expenses
        .filter((e) => e.ramadan_meal === 'iftar')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get sedekah streak during Ramadan
    const sedekahRecords = await db.sedekah
        .where('user_id')
        .equals(userId)
        .filter((s) => s.date >= ramadan.start && s.date <= ramadan.end)
        .toArray();

    const sedekahDays = new Set(sedekahRecords.map((s) => s.date));
    let streak = 0;
    const today = now.toISOString().split('T')[0];

    for (let d = new Date(today); d >= new Date(ramadan.start); d.setDate(d.getDate() - 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (sedekahDays.has(dateStr)) {
            streak++;
        } else {
            break;
        }
    }

    return {
        isActive,
        day,
        sahurTotal,
        iftarTotal,
        sedekahStreak: streak,
        totalExpenses,
        dailyAverage: day > 0 ? totalExpenses / day : 0,
    };
}
