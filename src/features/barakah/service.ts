import { db } from '@/lib/db';

// ================================================
// Barakah Score Engine (Enhanced)
// ================================================
// Calculates a 0-100 score based on:
// - Savings Ratio (30% weight)
// - Sedekah Generosity (25% weight)
// - Debt Risk (15% weight)
// - Zakat Completion (20% weight)
// - Sedekah Streak Bonus (10% weight)
// ================================================

export interface BarakahScoreInput {
    totalIncome: number;
    totalExpenses: number;
    totalSedekah: number;
    totalSavings: number;
    totalDebt: number;
    zakatPaid?: boolean;       // Has user paid zakat this year?
    sedekahStreak?: number;    // Consecutive days of sedekah
}

export interface BarakahScoreResult {
    score: number; // 0-100
    savingsRatio: number;
    sedekahScore: number;
    debtScore: number;
    zakatScore: number;
    streakBonus: number;
    feedback: string;
    tier: 'excellent' | 'good' | 'fair' | 'needs_improvement';
}

/**
 * Calculate the Barakah Score.
 */
export function calculateBarakahScore(input: BarakahScoreInput): BarakahScoreResult {
    // Savings Ratio (30% weight)
    const savingsAmount = Math.max(0, input.totalIncome - input.totalExpenses);
    const savingsRatio =
        input.totalIncome > 0 ? Math.min(100, (savingsAmount / input.totalIncome) * 100 * 5) : 0;

    // Sedekah Generosity (25% weight)
    const sedekahRatio =
        input.totalIncome > 0 ? Math.min(100, (input.totalSedekah / input.totalIncome) * 100 * 10) : 0;

    // Debt Risk (15% weight)
    const debtRatio =
        input.totalSavings > 0
            ? Math.max(0, 100 - (input.totalDebt / input.totalSavings) * 100)
            : input.totalDebt > 0
                ? 0
                : 100;

    // Zakat Completion (20% weight)
    const zakatScore = input.zakatPaid ? 100 : 0;

    // Sedekah Streak Bonus (10% weight)
    // 7+ day streak = full score, scales linearly
    const streak = input.sedekahStreak || 0;
    const streakBonus = Math.min(100, (streak / 7) * 100);

    // Weighted score
    const score = Math.round(
        savingsRatio * 0.30 +
        sedekahRatio * 0.25 +
        debtRatio * 0.15 +
        zakatScore * 0.20 +
        streakBonus * 0.10
    );
    const clampedScore = Math.min(100, Math.max(0, score));

    const { tier, feedback } = getBarakahFeedback(clampedScore, input.zakatPaid ?? false, streak);

    return {
        score: clampedScore,
        savingsRatio: Math.round(savingsRatio),
        sedekahScore: Math.round(sedekahRatio),
        debtScore: Math.round(debtRatio),
        zakatScore: Math.round(zakatScore),
        streakBonus: Math.round(streakBonus),
        feedback,
        tier,
    };
}

function getBarakahFeedback(
    score: number,
    zakatPaid: boolean,
    streak: number
): {
    tier: BarakahScoreResult['tier'];
    feedback: string;
} {
    let feedback: string;

    if (score >= 80) {
        feedback = 'MasyaAllah! Your financial discipline is exemplary. You balance saving, giving, and living beautifully. May Allah increase your barakah.';
    } else if (score >= 60) {
        feedback = 'Alhamdulillah, you are on a blessed path. Small improvements in saving or sedekah can elevate your barakah further. Keep going!';
    } else if (score >= 40) {
        feedback = 'You have a solid foundation, InsyaAllah. Consider reviewing your spending and increasing sadaqah — even small amounts carry great reward.';
    } else {
        feedback = 'Every journey starts with a single step. Focus on reducing unnecessary spending and building a savings habit. Allah rewards sincere effort.';
    }

    // Add specific tips
    if (!zakatPaid) {
        feedback += '\n\nTip: Complete your zakat this year to boost your Barakah Score by 20 points!';
    }
    if (streak >= 7) {
        feedback += `\n\nAmazing! You have a ${streak}-day sedekah streak. Consistency is beloved by Allah.`;
    } else if (streak > 0) {
        feedback += `\n\nYou have a ${streak}-day sedekah streak. Keep it going — 7 days unlocks full streak bonus!`;
    }

    const tier: BarakahScoreResult['tier'] =
        score >= 80 ? 'excellent' :
            score >= 60 ? 'good' :
                score >= 40 ? 'fair' : 'needs_improvement';

    return { tier, feedback };
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

    // Check zakat completion
    const zakatRecords = await db.zakat
        .where('user_id')
        .equals(userId)
        .filter((z) => z.year === now.getFullYear())
        .toArray();
    const zakatPaid = zakatRecords.length > 0;

    // Get sedekah streak
    const allSedekah = await db.sedekah
        .where('user_id')
        .equals(userId)
        .reverse()
        .sortBy('date');

    let streak = 0;
    if (allSedekah.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = new Date(allSedekah[0].date);
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            streak = 1;
            for (let i = 1; i < allSedekah.length; i++) {
                const curr = new Date(allSedekah[i - 1].date);
                const prev = new Date(allSedekah[i].date);
                const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                if (diff === 1) streak++;
                else if (diff > 1) break;
            }
        }
    }

    return calculateBarakahScore({
        totalIncome: monthlyIncome,
        totalExpenses,
        totalSedekah,
        totalSavings,
        totalDebt,
        zakatPaid,
        sedekahStreak: streak,
    });
}
