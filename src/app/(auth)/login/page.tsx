'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/services/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push('/dashboard');
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            {/* Background orbs */}
            <div className="absolute top-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-300/12 blur-[100px]" />
            <div className="absolute bottom-[-5%] right-[5%] w-[350px] h-[350px] rounded-full bg-emerald-300/10 blur-[80px]" />

            <div className="relative w-full max-w-md liquid-glass p-8 animate-fade-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <Image src="/logo.png" alt="BarakahSpend" width={48} height={48} className="mx-auto mb-3 rounded-2xl shadow-lg shadow-indigo-200/40" />
                    <h1 className="text-2xl font-bold text-slate-800">
                        <span className="gradient-text">BarakahSpend</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
                </div>

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full liquid-btn liquid-btn-glass h-12 text-sm font-medium mb-5"
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200/60" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white/40 backdrop-blur-sm px-3 text-slate-400 rounded-full">or</span>
                    </div>
                </div>

                {/* Email Login */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-slate-600">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-12 liquid-input"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-slate-600">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-12 liquid-input"
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50/60 border border-red-200/50 rounded-xl backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full liquid-btn liquid-btn-primary h-12 text-base disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
