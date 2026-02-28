import { createClient } from '@/services/supabase/client';

// ================================================
// Community Challenges Service
// ================================================

export interface Challenge {
    id: string;
    title: string;
    description?: string;
    type: string;
    start_date: string;
    end_date: string;
    created_by: string;
    participants: ChallengeParticipant[];
    leaderboard: LeaderboardEntry[];
    is_active: boolean;
}

export interface ChallengeParticipant {
    user_id: string;
    user_name: string;
    joined_at: string;
}

export interface LeaderboardEntry {
    user_id: string;
    user_name: string;
    score: number;
    rank?: number;
}

export const CHALLENGE_TEMPLATES = [
    {
        type: 'ramadan_sedekah',
        title: 'Ramadan Sedekah Challenge',
        description: 'Give sedekah every day during Ramadan. Even RM1 counts!',
        icon: '🌙',
    },
    {
        type: 'no_waste',
        title: 'No Waste Spending Challenge',
        description: 'Reduce unnecessary spending for 30 days.',
        icon: '♻️',
    },
    {
        type: 'savings_goal',
        title: 'Savings Goal Challenge',
        description: 'Save a target amount within the challenge period.',
        icon: '💰',
    },
    {
        type: 'halal_shopping',
        title: 'Halal-Conscious Shopping',
        description: 'Track and prioritize halal purchases for 2 weeks.',
        icon: '🛒',
    },
];

/**
 * Create a new community challenge.
 */
export async function createChallenge(
    title: string,
    description: string,
    type: string,
    startDate: string,
    endDate: string,
    userId: string,
    userName: string
): Promise<Challenge | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('community_challenges')
        .insert({
            title,
            description,
            type,
            start_date: startDate,
            end_date: endDate,
            created_by: userId,
            participants: [{ user_id: userId, user_name: userName, joined_at: new Date().toISOString() }],
            leaderboard: [{ user_id: userId, user_name: userName, score: 0 }],
        })
        .select()
        .single();

    if (error) return null;
    return data as unknown as Challenge;
}

/**
 * Get active challenges.
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
    const supabase = createClient();

    const { data } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

    return (data || []) as unknown as Challenge[];
}

/**
 * Join a challenge.
 */
export async function joinChallenge(
    challengeId: string,
    userId: string,
    userName: string
): Promise<boolean> {
    const supabase = createClient();

    const { data: challenge } = await supabase
        .from('community_challenges')
        .select('participants, leaderboard')
        .eq('id', challengeId)
        .single();

    if (!challenge) return false;

    const participants = (challenge.participants as ChallengeParticipant[]) || [];
    const leaderboard = (challenge.leaderboard as LeaderboardEntry[]) || [];

    // Check if already joined
    if (participants.some((p) => p.user_id === userId)) return true;

    participants.push({
        user_id: userId,
        user_name: userName,
        joined_at: new Date().toISOString(),
    });

    leaderboard.push({
        user_id: userId,
        user_name: userName,
        score: 0,
    });

    const { error } = await supabase
        .from('community_challenges')
        .update({ participants, leaderboard })
        .eq('id', challengeId);

    return !error;
}

/**
 * Update score on leaderboard.
 */
export async function updateChallengeScore(
    challengeId: string,
    userId: string,
    score: number
): Promise<boolean> {
    const supabase = createClient();

    const { data: challenge } = await supabase
        .from('community_challenges')
        .select('leaderboard')
        .eq('id', challengeId)
        .single();

    if (!challenge) return false;

    const leaderboard = (challenge.leaderboard as LeaderboardEntry[]) || [];
    const entry = leaderboard.find((e) => e.user_id === userId);
    if (entry) {
        entry.score = score;
    }

    // Sort by score descending and assign ranks
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((e, i) => {
        e.rank = i + 1;
    });

    const { error } = await supabase
        .from('community_challenges')
        .update({ leaderboard })
        .eq('id', challengeId);

    return !error;
}
