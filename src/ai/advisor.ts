import type { AIAdapter, AIAdvisorRequest, AIAdvisorResponse } from './types';
import { GeminiAdapter } from './adapters/gemini';
import { OpenAIAdapter } from './adapters/openai';

// ================================================
// AI Advisor Factory
// ================================================
// Creates the appropriate AI adapter based on env config.
// Provider is NOT hardcoded — selected via AI_PROVIDER env.
// ================================================

let adapterInstance: AIAdapter | null = null;

function createAdapter(): AIAdapter {
    const provider = process.env.AI_PROVIDER || 'gemini';

    switch (provider) {
        case 'gemini': {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
            return new GeminiAdapter(apiKey);
        }
        case 'openai': {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
            return new OpenAIAdapter(apiKey);
        }
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

export function getAIAdapter(): AIAdapter {
    if (!adapterInstance) {
        adapterInstance = createAdapter();
    }
    return adapterInstance;
}

export async function getFinancialAdvice(
    request: AIAdvisorRequest
): Promise<AIAdvisorResponse> {
    const adapter = getAIAdapter();
    return adapter.generateAdvice(request);
}

// Fallback advice when AI is unavailable (offline)
export function getOfflineAdvice(barakahScore: number): AIAdvisorResponse {
    if (barakahScore >= 80) {
        return {
            advice:
                'MasyaAllah, your financial discipline is excellent! Keep maintaining your generous spirit and wise spending habits.',
            suggestions: [
                'Consider increasing your Wakaf contributions',
                'Look into halal investment opportunities',
                'Share your financial wisdom with your community',
            ],
            tone: 'celebratory',
        };
    } else if (barakahScore >= 50) {
        return {
            advice:
                'Alhamdulillah, you are on a good path. There are opportunities to improve your financial barakah through more intentional spending.',
            suggestions: [
                'Try allocating 10% of income to Sedekah',
                'Review entertainment spending this month',
                'Set up automatic savings transfers',
            ],
            tone: 'encouraging',
        };
    } else {
        return {
            advice:
                'Remember, every ringgit spent with intention carries barakah. Let us review your spending together and find areas for improvement, InsyaAllah.',
            suggestions: [
                'Prioritize Nafkah Keluarga over Hiburan',
                'Consider reducing discretionary spending by 20%',
                'Start a small daily Sedekah habit, even RM1',
            ],
            tone: 'cautionary',
        };
    }
}
