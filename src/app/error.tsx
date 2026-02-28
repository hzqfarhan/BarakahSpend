'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a1a]">
            <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
                <div className="text-6xl text-red-500">⚠️</div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Something went wrong!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    {error.message || 'An unexpected error occurred. Please try again or refresh the page.'}
                </p>
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => reset()}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                    >
                        Try again
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => window.location.reload()}
                        className="w-full text-slate-400 hover:text-white"
                    >
                        Refresh Page
                    </Button>
                </div>
                {error.digest && (
                    <p className="text-[10px] text-slate-600 font-mono">Error ID: {error.digest}</p>
                )}
            </div>
        </div>
    );
}
