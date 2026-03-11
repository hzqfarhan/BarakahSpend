"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { calculateZakat, saveZakatRecord, getZakatHistory, type ZakatResult } from "@/features/zakat/service";
import type { LocalZakat } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, CheckCircle2, History, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function ZakatPage() {
  const { userId } = useAuth();
  
  // Form State
  const [savings, setSavings] = useState("");
  const [goldValue, setGoldValue] = useState("");
  
  // Results & History State
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [history, setHistory] = useState<LocalZakat[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const records = await getZakatHistory(userId);
    setHistory(records);
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleCalculate = () => {
    if (!savings && !goldValue) {
      toast.error("Please enter at least your savings amount.", {
         icon: <AlertCircle className="w-4 h-4" />
      });
      return;
    }

    const calculatedResult = calculateZakat({
      totalSavings: parseFloat(savings) || 0,
      goldValue: goldValue ? parseFloat(goldValue) : undefined,
    });
    
    setResult(calculatedResult);
  };

  const handleSaveRecord = async () => {
    if (!userId || !result) return;
    setIsSubmitting(true);
    
    await saveZakatRecord(userId, result, {
      totalSavings: parseFloat(savings) || 0,
      goldValue: goldValue ? parseFloat(goldValue) : undefined,
    });
    
    toast.success("Zakat record saved. May your wealth be purified.");
    await loadHistory();
    setIsSubmitting(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Area */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Zakat Calculator</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Calculate and track your obligatory alms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Calculator Form */}
        <div className="space-y-6">
           <Card className="bg-card border-border/50 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
               <CardHeader>
                  <CardTitle className="text-lg font-heading">Wealth Assessment</CardTitle>
               </CardHeader>
               <CardContent className="space-y-5">
                  <div className="space-y-2">
                     <Label htmlFor="savings" className="font-semibold text-foreground">Total Savings (RM)</Label>
                     <p className="text-xs text-muted-foreground mb-1">Total cash, bank balances, and easily accessible funds held for a lunar year (haul).</p>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">RM</div>
                        <Input 
                           id="savings" 
                           type="number" 
                           step="0.01" 
                           placeholder="0.00" 
                           className="pl-12 h-14 text-lg font-bold rounded-xl bg-background/50 focus-visible:ring-brand-amber/50"
                           value={savings}
                           onChange={(e) => setSavings(e.target.value)}
                        />
                     </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                     <Label htmlFor="gold" className="font-semibold text-foreground">Gold Content Value (RM) <span className="text-muted-foreground font-normal opacity-70">— Optional</span></Label>
                     <p className="text-xs text-muted-foreground mb-1">Market value of gold owned that exceeds the uruf (customary weight).</p>
                     <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">RM</div>
                        <Input 
                           id="gold" 
                           type="number" 
                           step="0.01" 
                           placeholder="0.00" 
                           className="pl-12 h-14 text-lg font-bold rounded-xl bg-background/50 focus-visible:ring-brand-amber/50"
                           value={goldValue}
                           onChange={(e) => setGoldValue(e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
               <CardFooter>
                 <Button 
                   onClick={handleCalculate} 
                   className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-brand-amber/20 bg-brand-amber hover:bg-brand-amber/90 text-white"
                 >
                   Calculate Assessment
                 </Button>
               </CardFooter>
           </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
           {result ? (
              <Card className={`border shadow-lg relative overflow-hidden transition-all duration-500 flex flex-col h-full ${result.isNisabEligible ? 'bg-gradient-to-br from-brand-amber/10 via-background to-background border-brand-amber/30' : 'bg-card border-border/50'}`}>
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-brand-amber" /> Assessment Results
                    </CardTitle>
                 </CardHeader>
                 
                 <CardContent className="flex-1 flex flex-col justify-center pb-8 pt-4">
                    <div className="text-center mb-8">
                       <p className="text-sm font-semibold text-muted-foreground mb-2">Total Obligatory Zakat (2.5%)</p>
                       <div className="text-6xl md:text-7xl font-heading font-black tracking-tighter text-brand-amber mb-4">
                          {formatCurrency(result.zakatAmount)}
                       </div>
                       <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${result.isNisabEligible ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' : 'bg-background border border-border text-muted-foreground'}`}>
                          {result.isNisabEligible ? (
                             <><CheckCircle2 className="w-4 h-4" /> Nisab Reached</>
                          ) : (
                             <><AlertCircle className="w-4 h-4" /> Below Nisab Threshold</>
                          )}
                       </div>
                    </div>

                    <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 space-y-3">
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Assessable Wealth</span>
                          <span className="font-bold text-foreground">{formatCurrency(result.totalWealth)}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current Nisab (Threshold)</span>
                          <span className="font-semibold text-foreground">{formatCurrency(result.nisabThreshold)}</span>
                       </div>
                    </div>
                 </CardContent>

                 {result.isNisabEligible && (
                    <CardFooter className="pt-0">
                       <Button 
                          onClick={handleSaveRecord}
                          disabled={isSubmitting}
                          variant="outline"
                          className="w-full h-12 rounded-xl text-brand-amber border-brand-amber/50 hover:bg-brand-amber hover:text-white transition-colors"
                       >
                          {isSubmitting ? "Saving..." : "Record Payment for This Year"}
                       </Button>
                    </CardFooter>
                 )}
              </Card>
           ) : (
              <div className="h-full premium-glass-panel rounded-3xl border-dashed border-2 flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[400px]">
                 <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-6">
                    <Calculator className="w-8 h-8 opacity-50" />
                 </div>
                 <h3 className="text-lg font-semibold text-foreground mb-2">Awaiting Values</h3>
                 <p className="text-sm max-w-xs mx-auto">Enter your savings and gold values to calculate your Zakat obligation against current Nisab rates.</p>
              </div>
           )}
        </div>
      </div>

      {/* History Section */}
      <div className="pt-8 border-t border-border/50">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
           <History className="w-5 h-5 text-muted-foreground" /> Recorded Payments
        </h3>
        
        {history.length === 0 ? (
           <p className="text-sm text-muted-foreground">No previous zakat records found. Track your yearly obligations here.</p>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((record, i) => (
                 <Card key={record.id || i} className="bg-card border-border/50 hover:border-brand-amber/30 transition-colors shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                       <div>
                          <p className="text-sm font-bold text-foreground flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-brand-amber" /> Year {record.year}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                             Savings: {formatCurrency(record.total_savings)}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-brand-amber tracking-tight">
                             {formatCurrency(record.zakat_amount)}
                          </p>
                          {!record.synced && (
                             <span className="text-[10px] uppercase font-bold text-muted-foreground">Pending Sync</span>
                          )}
                       </div>
                    </CardContent>
                 </Card>
              ))}
           </div>
        )}
      </div>

    </div>
  );
}
