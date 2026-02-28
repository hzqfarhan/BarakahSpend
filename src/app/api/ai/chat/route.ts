import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are "BarakahBot", a friendly and knowledgeable Islamic financial advisor for Malaysian Muslims.

LANGUAGE RULES (CRITICAL):
- Detect what language the user writes in
- If the user writes in Bahasa Melayu, reply FULLY in Bahasa Melayu
- If the user writes in English, reply in English
- You can mix Islamic/Arabic terms naturally in both languages (sedekah, zakat, barakah, insyaAllah, Alhamdulillah)
- Default to Bahasa Melayu if the language is ambiguous

Your personality:
- Warm, respectful, and encouraging
- Always motivational, never judgmental
- Reference Islamic principles of money management

Your capabilities:
- Answer questions about Islamic finance, zakat calculation, halal investing
- Give budgeting advice tailored to Malaysian lifestyle
- Explain concepts like nisab, haul, wakaf, hibah
- Suggest ways to increase barakah in finances

Rules:
- Keep responses concise (max 3-4 sentences unless the user asks for detail)
- Use Ringgit Malaysia (RM) as currency
- If asked about haram products, politely explain halal alternatives
- Never give fatwa — recommend consulting local ustaz/ulama for religious rulings
- Do NOT use emoji in your responses. Use text expressions instead.`;

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            );
        }

        // Build Gemini-compatible contents from chat messages
        const contents = messages.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 800,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Chat API] Gemini error:', errorText);
            return NextResponse.json(
                { error: 'Failed to get response from AI' },
                { status: 500 }
            );
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return NextResponse.json(
                { error: 'Empty response from AI' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: text });
    } catch (error) {
        console.error('[Chat API]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
