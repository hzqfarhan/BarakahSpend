import { NextResponse } from 'next/server';
import { getFinancialAdvice } from '@/ai/advisor';
import type { AIAdvisorRequest } from '@/ai/types';

export async function POST(request: Request) {
    try {
        const body: AIAdvisorRequest = await request.json();

        const advice = await getFinancialAdvice(body);

        return NextResponse.json(advice);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AI Advisor API]', message);
        return NextResponse.json(
            { error: 'Failed to generate advice', message },
            { status: 500 }
        );
    }
}
