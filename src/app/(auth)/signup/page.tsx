"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/services/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background relative selection:bg-primary/20 selection:text-primary">
         <div className="w-full max-w-[420px] relative z-10 animate-fade-up text-center premium-glass-panel p-10 rounded-3xl">
            <div className="w-16 h-16 bg-brand-emerald/10 text-brand-emerald rounded-full flex items-center justify-center mx-auto mb-6">
               <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-heading font-extrabold tracking-tight mb-3">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
               We&apos;ve sent a confirmation link to <span className="text-foreground font-semibold">{email}</span>. Please verify your email to get started.
            </p>
            <Button
               onClick={() => router.push("/auth/login")}
               className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
            >
               Go to Sign In
            </Button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-emerald/5 blur-[100px] pointer-events-none" />

      {/* Top Navigation */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
        <Link href="/">
          <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-up">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10 border border-primary/20 overflow-hidden bg-white">
            <Image src="/logo.png" alt="BarakahSpend Logo" width={64} height={64} className="object-cover" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight mb-2 text-foreground">
            Create account
          </h1>
          <p className="text-muted-foreground text-sm">
            Start tracking your financial cadence with BarakahSpend.
          </p>
        </div>

        <div className="premium-glass-panel p-8 md:p-10 rounded-3xl">
          {/* Google OAuth */}
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignup}
            className="w-full h-12 rounded-xl border-border bg-card hover:bg-secondary font-medium mb-6 relative hover:-translate-y-0.5 transition-all shadow-sm"
          >
            <svg className="w-5 h-5 mr-3 absolute left-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-3 tracking-widest font-semibold rounded-full border border-border">or use email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ahmad bin Abu"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl bg-background/50 focus:bg-background transition-colors"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-background/50 focus:bg-background transition-colors"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl bg-background/50 focus:bg-background transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 hover:shadow-primary/30 transition-all mt-6"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-up stagger-1">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
