"use client";

import { useState, useEffect, useCallback } from "react";
import { getLocalSedekah, getSedekahStreak, createSedekah } from "@/features/sedekah/service";
import { useAuth } from "@/hooks/use-auth";
import type { LocalSedekah } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HeartHandshake, Plus, Flame, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SedekahPage() {
  const { userId } = useAuth();
  const [records, setRecords] = useState<LocalSedekah[]>([]);
  const [streak, setStreak] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const loadData = useCallback(async () => {
    if (!userId) return;
    const [sedekahData, currentStreak] = await Promise.all([
      getLocalSedekah(userId),
      getSedekahStreak(userId),
    ]);
    setRecords(sedekahData);
    setStreak(currentStreak);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSedekah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;

    await createSedekah(userId, {
      amount: parseFloat(amount),
      recipient: recipient || undefined,
      date: new Date().toISOString().split("T")[0],
    });

    toast.success("Sedekah recorded! May Allah reward your generosity.");
    
    // Reset
    setAmount("");
    setRecipient("");
    setIsDialogOpen(false);
    
    loadData();
  };

  const totalThisMonth = records.reduce((sum, r) => sum + r.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Sedekah</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <HeartHandshake className="w-4 h-4" /> Build your giving momentum.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-brand-emerald/20 transition-all hover:-translate-y-0.5 bg-brand-emerald hover:bg-brand-emerald/90 text-white" size="lg">
              <Plus className="w-5 h-5 mr-2" /> Give Sedekah
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl premium-glass-panel">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl flex items-center gap-2">
                 <HeartHandshake className="w-6 h-6 text-brand-emerald" /> New Record
              </DialogTitle>
              <DialogDescription>
                Even half a date is charity. Record your giving.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSedekah} className="space-y-5 mt-4">
              
              {/* Preset Amounts */}
               <div className="flex gap-2">
                  {[5, 10, 50].map((preset) => (
                     <Button 
                       key={preset} 
                       type="button"
                       variant="outline" 
                       onClick={() => setAmount(preset.toString())}
                       className={`flex-1 rounded-xl h-10 ${amount === preset.toString() ? 'border-brand-emerald bg-brand-emerald/10 text-brand-emerald font-bold' : ''}`}
                     >
                       RM {preset}
                     </Button>
                  ))}
               </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Custom Amount (RM)</Label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">RM</div>
                   <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      required 
                      className="pl-12 h-14 text-lg font-bold rounded-xl bg-background/50 focus-visible:ring-brand-emerald/50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                   />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient / Cause (Optional)</Label>
                <Input 
                   id="recipient" 
                   placeholder="e.g. Mosque Donation Box, Orphanage" 
                   className="h-12 rounded-xl bg-background/50 focus-visible:ring-brand-emerald/50"
                   value={recipient}
                   onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-base font-semibold shadow-lg shadow-brand-emerald/20 bg-brand-emerald hover:bg-brand-emerald/90 text-white">
                Record Giving
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Card */}
        <Card className="border-brand-emerald/20 bg-gradient-to-br from-brand-emerald/10 via-background to-background relative overflow-hidden shadow-md">
           <CardContent className="p-8 flex items-center justify-between">
              <div>
                 <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                   <Flame className="w-4 h-4 text-brand-emerald" /> Current Streak
                 </p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-heading font-black tracking-tighter text-foreground">{streak}</span>
                    <span className="text-muted-foreground font-medium">days</span>
                 </div>
              </div>
              <div className="w-20 h-20 bg-brand-emerald/10 rounded-full flex items-center justify-center">
                 <Sparkles className="w-10 h-10 text-brand-emerald" />
              </div>
           </CardContent>
        </Card>

        {/* Total Card */}
        <Card className="border-border/50 bg-card relative overflow-hidden shadow-sm">
           <CardContent className="p-8 flex flex-col justify-center h-full">
               <p className="text-sm font-medium text-muted-foreground mb-2">Total Given This Month</p>
               <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-heading font-black tracking-tight text-brand-emerald">
                     {formatCurrency(totalThisMonth)}
                  </span>
               </div>
               <p className="text-xs text-muted-foreground mt-2">{records.length} records • Keep up the momentum!</p>
           </CardContent>
        </Card>
      </div>

      {/* History List */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Giving History</h3>
        
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="premium-glass-panel rounded-2xl p-12 text-center border-dashed border-2">
               <div className="w-16 h-16 bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="w-8 h-8" />
               </div>
               <h4 className="text-lg font-semibold mb-2">No sedekah recorded yet</h4>
               <p className="text-muted-foreground text-sm max-w-sm mx-auto">Track your daily giving to build your streak and increase your Barakah score.</p>
            </div>
          ) : (
            records.map((rec, i) => (
              <div key={rec.id || i} className="premium-glass-panel rounded-xl p-5 flex items-center justify-between hover:bg-brand-emerald/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-emerald group-hover:text-white transition-colors">
                     <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {rec.recipient || "General Sedekah"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Date(rec.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-emerald">
                    {formatCurrency(rec.amount)}
                  </p>
                  {!rec.synced && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
