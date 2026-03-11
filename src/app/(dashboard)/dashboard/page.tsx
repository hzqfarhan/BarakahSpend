"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { usePrayerTimes } from "@/hooks/use-prayer-times";
import {
  getLocalExpenses,
} from "@/features/expenses/service";
import { getLocalSedekah, getSedekahStreak } from "@/features/sedekah/service";
import { calculateBarakahScore, type BarakahScoreResult } from "@/features/barakah/service";
import { getZakatHistory } from "@/features/zakat/service";
import { getRamadanStats, type RamadanStats } from "@/features/ramadan/service";
import { getOfflineAdvice } from "@/ai/advisor";
import type { LocalExpense, LocalSedekah } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, MapPin, TrendingUp, AlertCircle, HeartHandshake } from "lucide-react";
import { ChatBot } from "@/components/dashboard/ChatBot";

export default function DashboardPage() {
  const { userId, userName, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const prayer = usePrayerTimes();
  
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [sedekahRecords, setSedekahRecords] = useState<LocalSedekah[]>([]);
  const [barakahScore, setBarakahScore] = useState<BarakahScoreResult | null>(null);
  const [ramadanStats, setRamadanStats] = useState<RamadanStats | null>(null);
  const [sedekahStreak, setSedekahStreak] = useState(0);

  const [showChat, setShowChat] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    const [exp, sed, streak, ramadan] = await Promise.all([
      getLocalExpenses(userId),
      getLocalSedekah(userId),
      getSedekahStreak(userId),
      getRamadanStats(userId),
    ]);
    
    setExpenses(exp);
    setSedekahRecords(sed);
    setSedekahStreak(streak);
    setRamadanStats(ramadan);

    const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);
    const totalSedekah = sed.reduce((s, e) => s + e.amount, 0);
    const savings = exp.filter((e) => e.category === "simpanan").reduce((s, e) => s + e.amount, 0);
    const debt = exp.filter((e) => e.category === "hutang").reduce((s, e) => s + e.amount, 0);

    const score = calculateBarakahScore({
      totalIncome: 5000,
      totalExpenses,
      totalSedekah,
      totalSavings: savings,
      totalDebt: debt,
      zakatPaid: (await getZakatHistory(userId)).some((z) => z.year === new Date().getFullYear()),
      sedekahStreak: streak,
    });
    setBarakahScore(score);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const advice = barakahScore ? getOfflineAdvice(barakahScore.score) : null;

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-secondary rounded-2xl" />
          <div className="h-4 w-32 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">
            Salam, {userName?.split(" ")[0] || "Friend"}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
             <MapPin className="w-4 h-4" /> 
             {prayer.gregorianDate} &bull; {prayer.hijriDate || "Loading Hijri..."}
          </div>
        </div>
        
        {/* Next Prayer Quick Glance */}
        {prayer.nextPrayer && (
          <div className="premium-glass-panel px-5 py-3 rounded-2xl flex items-center gap-4 border border-border/50">
             <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Next Prayer</p>
                <p className="text-sm font-bold text-foreground">
                   {prayer.nextPrayer.name} at {prayer.nextPrayer.time}
                   <span className="text-primary ml-2">({prayer.nextPrayer.countdown})</span>
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Barakah Score Card (Takes up 2 columns on large screens) */}
        <Card className="lg:col-span-2 overflow-hidden border-border/50 shadow-lg relative bg-card">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />  Your Barakah Score
             </CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                 <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    {/* SVG Donut Chart Placeholder */}
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                       <circle 
                         cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                         strokeDasharray={`${(barakahScore?.score || 0) * 2.83} 283`}
                         strokeLinecap="round"
                         className="text-primary transition-all duration-1000 ease-out" 
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-heading font-black tracking-tighter">{barakahScore?.score || 0}</span>
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-4">
                    <div>
                       <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 mb-2">
                          {barakahScore?.tier?.replace("_", " ") || "Calculating"}
                       </div>
                       <p className="text-foreground leading-relaxed">
                          {barakahScore?.feedback || "Start tracking your spending and sedekah to see insights."}
                       </p>
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Sedekah Streak */}
        <Card className="border-border/50 shadow-md bg-gradient-to-br from-brand-emerald/10 via-background to-background relative overflow-hidden">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-brand-emerald" /> Giving Momentum
             </CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col justify-center h-[calc(100%-48px)]">
             <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-heading font-black tracking-tighter text-foreground">{sedekahStreak}</span>
                <span className="text-muted-foreground font-medium">days</span>
             </div>
             <p className="text-sm text-brand-emerald font-medium">Consecutive sedekah records.</p>
           </CardContent>
        </Card>

      </div>

      {/* AI Advisor Context Box */}
      {advice && (
        <div className="premium-glass-panel rounded-2xl p-6 border border-brand-amber/20 bg-brand-amber/5 flex flex-col md:flex-row gap-6 items-start">
           <div className="w-12 h-12 rounded-2xl bg-brand-amber/20 text-brand-amber flex items-center justify-center shrink-0 shadow-inner">
              <AlertCircle className="w-6 h-6" />
           </div>
           <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2">AI Financial Insight</h3>
              <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{advice.advice}</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                 {advice.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-brand-amber shrink-0" /> {s}
                    </li>
                 ))}
              </ul>
           </div>
        </div>
      )}

      {/* Quick Action & Floating Chat (Bottom Right) */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <button
          onClick={() => setShowChat(true)}
          className="group relative w-16 h-16 rounded-[1.5rem] bg-card flex items-center justify-center hover:-translate-y-2 transition-all duration-300 border border-border shadow-2xl p-0 m-0"
        >
          <Image src="/icons/barakahbot.png" alt="BarakahBot" width={48} height={48} className="w-[85%] h-[85%] object-contain group-hover:scale-110 transition-transform duration-500 rounded-xl" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-background rounded-full animate-pulse shadow-sm" />
        </button>
      </div>

      {showChat && (
        <div className="fixed inset-0 z-[70] flex justify-end md:p-6 pb-0">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowChat(false)} />
          <div className="relative w-full md:w-[420px] h-[calc(100vh-80px)] md:h-full bg-card md:rounded-[2rem] rounded-t-[2rem] shadow-2xl flex flex-col animate-fade-up overflow-hidden border border-border" style={typeof window !== "undefined" && window.innerWidth < 768 ? { marginTop: "auto", maxHeight: "90vh" } : {}}>
            <ChatBot
              isActive={true}
              onClose={() => setShowChat(false)}
              userAvatar={""}
              userName={userName}
              financialContext={{
                totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
                totalSedekah: sedekahRecords.reduce((s, e) => s + e.amount, 0),
                totalSavings: expenses.filter(e => e.category === "simpanan").reduce((s, e) => s + e.amount, 0),
                totalDebt: expenses.filter(e => e.category === "hutang").reduce((s, e) => s + e.amount, 0),
                barakahScore: barakahScore?.score ?? 0,
                barakahTier: barakahScore?.tier ?? "needs_improvement",
                sedekahStreak,
                isRamadan: ramadanStats?.isActive ?? false,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
