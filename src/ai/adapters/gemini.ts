import type { AIAdapter, AIAdvisorRequest, AIAdvisorResponse } from '../types';

// ================================================
// Google Gemini AI Adapter
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

export class GeminiAdapter implements AIAdapter {
    name = 'gemini';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateAdvice(request: AIAdvisorRequest): Promise<AIAdvisorResponse> {
        const prompt = this.buildPrompt(request);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini');
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
