'use client';

import { useEffect } from 'react';

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full liquid-glass p-8 text-center space-y-6 animate-fade-up">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Something went wrong!</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    {error.message || 'An unexpected error occurred. Please try again or refresh the page.'}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full liquid-btn liquid-btn-primary py-3"
                    >
                        Try again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full liquid-btn liquid-btn-glass py-3 text-slate-500"
                    >
                        Refresh Page
                    </button>
                </div>
                {error.digest && (
                    <p className="text-[10px] text-slate-300 font-mono">Error ID: {error.digest}</p>
                )}
            </div>
        </div>
    );
}
