import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    // Diagnostic logs (will show in browser console)
    if (typeof window !== 'undefined') {
        console.log('[Supabase Client] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
        console.log('[Supabase Client] KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const errorMsg = 'Missing Supabase environment variables! Check .env.local';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}
