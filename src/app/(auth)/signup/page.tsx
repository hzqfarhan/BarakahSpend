'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/services/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a0a1a] via-[#1a103d] to-[#0a0a1a]">
                <Card className="w-full max-w-md glass-card border-purple-500/20">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="text-5xl">✅</div>
                        <h2 className="text-xl font-semibold text-white">Check your email</h2>
                        <p className="text-slate-400">
                            We&apos;ve sent a confirmation link to <span className="text-purple-300">{email}</span>.
                            Please verify your email to get started.
                        </p>
                        <Button
                            onClick={() => router.push('/login')}
                            className="mt-4 bg-gradient-to-r from-purple-600 to-purple-500"
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a0a1a] via-[#1a103d] to-[#0a0a1a]">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[100px]" />

            <Card className="relative w-full max-w-md glass-card border-purple-500/20">
                <CardHeader className="text-center pb-2">
                    <div className="text-4xl mb-2">🌟</div>
                    <CardTitle className="text-2xl font-bold">
                        Join <span className="gradient-text">BarakahSpend</span>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Start your journey to financial barakah
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Button
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        variant="outline"
                        className="w-full h-12 text-base border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-purple-500/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0f0f23] px-2 text-slate-500">or</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Ahmad bin Abu"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="h-12 bg-purple-500/5 border-purple-500/20 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 bg-purple-500/5 border-purple-500/20 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-12 bg-purple-500/5 border-purple-500/20 focus:border-purple-500/50 text-white placeholder:text-slate-600"
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-600/20"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            Sign In
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
