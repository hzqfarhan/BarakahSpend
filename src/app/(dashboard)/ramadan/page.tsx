"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePrayerTimes } from "@/hooks/use-prayer-times";
import { getRamadanStats, isRamadanActive, type RamadanStats } from "@/features/ramadan/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoonStar, Clock, Flame, Utensils, HeartHandshake } from "lucide-react";

export default function RamadanPage() {
  const { userId } = useAuth();
  const prayer = usePrayerTimes();
  
  const [stats, setStats] = useState<RamadanStats | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    const ramadanData = await getRamadanStats(userId);
    setStats(ramadanData);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(val);
  };

  const isRamadan = isRamadanActive();

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-2 text-primary flex items-center gap-3">
             <MoonStar className="w-8 h-8" /> Ramadan Mode
          </h1>
          <p className="text-muted-foreground text-sm">
            Navigate the holy month with absolute clarity and intention.
          </p>
        </div>
        
        {isRamadan && stats && (
           <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Ramadan Active • Day {stats.day} of 30
           </div>
        )}
      </div>

      {!isRamadan ? (
        <Card className="bg-card border-border/50 border-dashed border-2 p-12 overflow-hidden relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
           <CardContent className="flex flex-col items-center justify-center text-center relative z-10 p-0">
             <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                <MoonStar className="w-12 h-12 text-muted-foreground opacity-50" />
             </div>
             <h2 className="text-2xl font-heading font-bold mb-3 text-foreground">Ramadan is approaching</h2>
             <p className="max-w-md mx-auto text-muted-foreground leading-relaxed">
                Ramadan Mode will automatically unlock and activate strictly during the holy month. It will track your Sahur and Iftar spending, analyze your giving momentum, and provide tailored fasting timelines.
             </p>
           </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
           
           {/* Primary Pulse Card */}
           <Card className="border-border/50 shadow-lg relative overflow-hidden bg-card">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">Holy Month Progress</p>
                    <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                       <span className="text-7xl font-heading font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-brand-emerald to-primary">{stats?.day}</span>
                       <span className="text-xl font-bold text-muted-foreground">/ 30</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden mt-6 mb-2">
                       <div 
                         className="h-full bg-gradient-to-r from-primary to-brand-emerald rounded-full transition-all duration-1000 relative"
                         style={{ width: `${((stats?.day || 0) / 30) * 100}%` }}
                       >
                           <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30" />
                       </div>
                    </div>
                 </div>

                 {prayer.iftarTime && (
                    <div className="premium-glass-panel p-6 rounded-3xl w-full md:w-auto min-w-[280px] shrink-0 border border-primary/20">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 bg-brand-amber/20 text-brand-amber flex items-center justify-center rounded-2xl">
                             <Clock className="w-7 h-7" />
                          </div>
                          <div>
                             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Time to break fast</p>
                             <p className="text-2xl font-heading font-black text-foreground">{prayer.iftarTime}</p>
                          </div>
                       </div>
                       
                       {prayer.times?.Fajr && (
                          <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-sm">
                                <Utensils className="w-4 h-4 text-brand-emerald" />
                                <span className="font-medium text-muted-foreground">Sahur ends</span>
                             </div>
                             <span className="font-bold text-foreground">{prayer.times.Fajr}</span>
                          </div>
                       )}
                    </div>
                 )}
              </CardContent>
           </Card>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <Card className="border-border/50 bg-card hover:border-brand-emerald/30 transition-colors shadow-sm">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                       <Flame className="w-4 h-4 text-brand-emerald" /> Sedekah Streak
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="flex items-baseline gap-2 mb-1">
                       <span className="text-4xl font-heading font-black text-brand-emerald">{stats?.sedekahStreak}</span>
                       <span className="text-sm font-semibold text-muted-foreground">days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Consecutive days giving in Ramadan.</p>
                 </CardContent>
              </Card>

              <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors shadow-sm">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                       <Utensils className="w-4 h-4 text-primary" /> Total Sahur
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-3xl font-heading font-black text-foreground mb-1">
                       {formatCurrency(stats?.sahurTotal || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Cumulative sahur spending.</p>
                 </CardContent>
              </Card>

              <Card className="border-border/50 bg-card hover:border-brand-amber/30 transition-colors shadow-sm">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                       <Clock className="w-4 h-4 text-brand-amber" /> Total Iftar
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-3xl font-heading font-black text-foreground mb-1">
                       {formatCurrency(stats?.iftarTotal || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Cumulative iftar spending.</p>
                 </CardContent>
              </Card>

           </div>

           {/* Quick Action */}
           <div className="premium-glass-panel p-6 md:p-8 rounded-3xl border border-border/50 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                 <HeartHandshake className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-2 text-foreground">Complete Your Daily Sedekah</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                 Sustain your Ramadan giving rhythm. Even the smallest acts of charity are deeply rewarding.
              </p>
              <Button onClick={() => window.location.href='/sedekah'} className="h-12 rounded-xl px-8 font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform" size="lg">
                 Record Sedekah Now
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
