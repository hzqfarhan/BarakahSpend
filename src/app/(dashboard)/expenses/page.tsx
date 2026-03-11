"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getLocalExpenses, 
  createExpense, 
  EXPENSE_CATEGORIES, 
  type ExpenseCategory, 
  type CreateExpenseInput 
} from "@/features/expenses/service";
import { isRamadanActive } from "@/features/ramadan/service";
import { useAuth } from "@/hooks/use-auth";
import type { LocalExpense } from "@/lib/db";
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
import { Wallet, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

function Ico({ src, size = 40, alt = "" }: { src: string; size?: number; alt?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="inline-block object-contain"
    />
  );
}

export default function ExpensesPage() {
  const { userId } = useAuth();
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("makanan_halal");
  const [description, setDescription] = useState("");

  const loadExpenses = useCallback(async () => {
    if (!userId) return;
    const exp = await getLocalExpenses(userId);
    setExpenses(exp);
  }, [userId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;

    const input: CreateExpenseInput = {
      amount: parseFloat(amount),
      category,
      description: description || undefined,
      date: new Date().toISOString().split("T")[0],
      is_ramadan: isRamadanActive(),
    };

    await createExpense(userId, input);
    toast.success("Expense added successfully");
    
    // Reset Form
    setAmount("");
    setDescription("");
    setCategory("makanan_halal");
    setIsDialogOpen(false);
    
    loadExpenses();
  };

  const totalFormat = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR'
  });

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Expenses</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Track your monthly outflows clearly.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5" size="lg">
              <Plus className="w-5 h-5 mr-2" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl premium-glass-panel">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl">New Expense</DialogTitle>
              <DialogDescription>
                Record your spending to keep your Barakah Score accurate.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RM)</Label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">RM</div>
                   <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      required 
                      className="pl-12 h-14 text-lg font-bold rounded-xl bg-background/50"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                   />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Input 
                   id="desc" 
                   placeholder="e.g. Nasi Lemak" 
                   className="h-12 rounded-xl bg-background/50"
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl mt-6 text-base font-semibold shadow-lg shadow-primary/20">
                Save Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {EXPENSE_CATEGORIES.map(cat => {
          const catTotal = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
          
          return (
            <Card key={cat.value} className={`border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-colors ${catTotal === 0 ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${catTotal > 0 ? 'bg-primary/10' : 'bg-secondary'}`}>
                    <Ico src={cat.icon} size={28} alt={cat.label} />
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{cat.label}</span>
                </div>
                <div className="mt-4">
                   <p className={`text-xl font-heading font-black tracking-tight ${catTotal > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {totalFormat.format(catTotal)}
                   </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Transactions List */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
           <Receipt className="w-5 h-5 text-muted-foreground" /> Transaction History
        </h3>
        
        <div className="space-y-2">
          {expenses.length === 0 ? (
            <div className="premium-glass-panel rounded-2xl p-12 text-center border-dashed border-2">
               <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8" />
               </div>
               <h4 className="text-lg font-semibold mb-2">No expenses recorded yet</h4>
               <p className="text-muted-foreground text-sm max-w-sm mx-auto">Start tracking your spending to view your detailed transaction history and improve your Barakah Score.</p>
            </div>
          ) : (
            expenses.map((exp, i) => {
              const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
              return (
                <div key={exp.id || i} className="premium-glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                       <Ico src={cat?.icon || "/icons/savings.png"} size={24} alt={cat?.label || ""} />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {exp.description || cat?.label}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(exp.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {cat?.label && exp.description && ` • ${cat.label}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-foreground">
                      -{totalFormat.format(exp.amount)}
                    </p>
                    {!exp.synced && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded-full">
                        Pending Sync
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
