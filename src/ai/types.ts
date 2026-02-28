// ================================================
// AI Advisor Types
// ================================================

export interface AIAdvisorRequest {
    context: {
        totalExpenses: number;
        totalSedekah: number;
        totalSavings: number;
        totalDebt: number;
        barakahScore: number;
        topCategories: { category: string; amount: number }[];
        isRamadan?: boolean;
    };
    locale: 'ms' | 'en';
}

export interface AIAdvisorResponse {
    advice: string;
    suggestions: string[];
    tone: 'encouraging' | 'cautionary' | 'celebratory';
}

export interface AIAdapter {
    name: string;
    generateAdvice(request: AIAdvisorRequest): Promise<AIAdvisorResponse>;
}
