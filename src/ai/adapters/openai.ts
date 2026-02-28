import type { AIAdapter, AIAdvisorRequest, AIAdvisorResponse } from '../types';

// ================================================
// OpenAI AI Adapter
// ================================================

const SYSTEM_PROMPT = `You are a respectful Islamic financial advisor for Malaysian Muslims. 
Your advice must:
- Be motivational and kind in tone
- Reference Islamic principles of spending wisely
- Suggest charitable alternatives when spending is high
- Use Ringgit Malaysia (RM) as currency
- Be concise (2-3 sentences max for advice)
- Provide 2-3 actionable suggestions

Respond ONLY in valid JSON format:
{
  "advice": "string",
  "suggestions": ["string", "string"],
  "tone": "encouraging" | "cautionary" | "celebratory"
}`;

export class OpenAIAdapter implements AIAdapter {
    name = 'openai';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateAdvice(request: AIAdvisorRequest): Promise<AIAdvisorResponse> {
        const prompt = this.buildPrompt(request);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('No response from OpenAI');
        }

        return JSON.parse(text) as AIAdvisorResponse;
    }

    private buildPrompt(request: AIAdvisorRequest): string {
        const { context } = request;
        return `Analyze this Muslim user's financial data and provide Islamic financial advice:

Total Monthly Expenses: RM${context.totalExpenses.toFixed(2)}
Total Sedekah Given: RM${context.totalSedekah.toFixed(2)}
Total Savings: RM${context.totalSavings.toFixed(2)}
Total Debt: RM${context.totalDebt.toFixed(2)}
Barakah Score: ${context.barakahScore}%
Top Spending Categories: ${context.topCategories.map((c) => `${c.category}: RM${c.amount.toFixed(2)}`).join(', ')}
${context.isRamadan ? 'It is currently Ramadan.' : ''}

Language: ${request.locale === 'ms' ? 'Bahasa Malaysia' : 'English'}`;
    }
}
