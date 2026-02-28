import { db } from '@/lib/db';

// ================================================
// Barakah Score Engine
// ================================================
// Calculates a 0-100 score based on:
// - Savings Ratio (40% weight)
// - Sedekah Generosity (35% weight)
// - Debt Risk (25% weight)
// ================================================

export interface BarakahScoreInput {
    totalIncome: number; // Monthly income
    totalExpenses: number; // Monthly expenses
    totalSedekah: number; // Monthly sedekah
    totalSavings: number; // Current savings
    totalDebt: number; // Current debt
}

export interface BarakahScoreResult {
    score: number; // 0-100
    savingsRatio: number;
    sedekahScore: number;
    debtScore: number;
    feedback: string;
    tier: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

/**
 * Calculate the Barakah Score.
 */
export function calculateBarakahScore(input: BarakahScoreInput): BarakahScoreResult {
    // Savings Ratio (40% weight)
    // Ideal: saving 20%+ of income
    const savingsAmount = Math.max(0, input.totalIncome - input.totalExpenses);
    const savingsRatio =
        input.totalIncome > 0 ? Math.min(100, (savingsAmount / input.totalIncome) * 100 * 5) : 0;

    // Sedekah Generosity (35% weight)
    // Ideal: giving 10%+ of income
    const sedekahRatio =
        input.totalIncome > 0 ? Math.min(100, (input.totalSedekah / input.totalIncome) * 100 * 10) : 0;

    // Debt Risk (25% weight)
    // Lower debt relative to savings = better score
    const debtRatio =
        input.totalSavings > 0
            ? Math.max(0, 100 - (input.totalDebt / input.totalSavings) * 100)
            : input.totalDebt > 0
                ? 0
                : 100;

    // Weighted score
    const score = Math.round(savingsRatio * 0.4 + sedekahRatio * 0.35 + debtRatio * 0.25);
    const clampedScore = Math.min(100, Math.max(0, score));

    // Determine tier and feedback
    const { tier, feedback } = getBarakahFeedback(clampedScore);

    return {
        score: clampedScore,
        savingsRatio: Math.round(savingsRatio),
        sedekahScore: Math.round(sedekahRatio),
        debtScore: Math.round(debtRatio),
        feedback,
        tier,
    };
}

function getBarakahFeedback(score: number): {
    tier: BarakahScoreResult['tier'];
    feedback: string;
} {
    if (score >= 80) {
        return {
            tier: 'excellent',
            feedback:
                'MasyaAllah! Your financial discipline is exemplary. You balance saving, giving, and living beautifully. May Allah increase your barakah. 🌟',
        };
    } else if (score >= 60) {
        return {
            tier: 'good',
            feedback:
                'Alhamdulillah, you are on a blessed path. Small improvements in saving or sedekah can elevate your barakah further. Keep going! 💪',
        };
    } else if (score >= 40) {
        return {
            tier: 'fair',
            feedback:
                'You have a solid foundation, InsyaAllah. Consider reviewing your spending and increasing sadaqah — even small amounts carry great reward. 🤲',
        };
    } else {
        return {
            tier: 'needs_improvement',
            feedback:
                'Every journey starts with a single step. Focus on reducing unnecessary spending and building a savings habit. Allah rewards sincere effort. 🌱',
        };
    }
}

/**
 * Calculate Barakah score from local data.
 */
export async function calculateBarakahScoreFromLocal(
    userId: string,
    monthlyIncome: number
): Promise<BarakahScoreResult> {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endMonth = now.getMonth() + 2;
    const endDate = `${now.getFullYear()}-${String(endMonth).padStart(2, '0')}-01`;

    // Get monthly expenses
    const expenses = await db.expenses
        .where('user_id')
        .equals(userId)
        .filter((e) => e.date >= startDate && e.date < endDate)
        .toArray();
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get monthly sedekah
    const sedekah = await db.sedekah
        .where('user_id')
        .equals(userId)
        .filter((s) => s.date >= startDate && s.date < endDate)
        .toArray();
    const totalSedekah = sedekah.reduce((sum, s) => sum + s.amount, 0);

    // Get savings & debt from expense categories
    const totalSavings = expenses
        .filter((e) => e.category === 'simpanan')
        .reduce((sum, e) => sum + e.amount, 0);
    const totalDebt = expenses
        .filter((e) => e.category === 'hutang')
        .reduce((sum, e) => sum + e.amount, 0);

    return calculateBarakahScore({
        totalIncome: monthlyIncome,
        totalExpenses,
        totalSedekah,
        totalSavings,
        totalDebt,
    });
}
