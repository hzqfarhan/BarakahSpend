'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    createExpense,
    getLocalExpenses,
    EXPENSE_CATEGORIES,
    type ExpenseCategory,
    type CreateExpenseInput,
} from '@/features/expenses/service';
import { createSedekah, getLocalSedekah, getMonthlyTotalSedekah, getSedekahStreak } from '@/features/sedekah/service';
import { calculateBarakahScore, type BarakahScoreResult } from '@/features/barakah/service';
import { calculateZakat, saveZakatRecord, getZakatHistory, type ZakatResult } from '@/features/zakat/service';
import { getRamadanStats, isRamadanActive, type RamadanStats } from '@/features/ramadan/service';
import { getOfflineAdvice } from '@/ai/advisor';
import type { LocalExpense } from '@/lib/db';
import type { LocalSedekah, LocalZakat } from '@/lib/db';
import { toast } from 'sonner';

// ========================
// Bottom Navigation
// ========================
type NavTab = 'home' | 'expenses' | 'zakat' | 'sedekah' | 'ramadan';

const NAV_ITEMS: { key: NavTab; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'expenses', label: 'Expenses', icon: '💸' },
    { key: 'sedekah', label: 'Sedekah', icon: '🤲' },
    { key: 'zakat', label: 'Zakat', icon: '💰' },
    { key: 'ramadan', label: 'Ramadan', icon: '🌙' },
];

export default function DashboardPage() {
    const { userId, userName, userEmail, userAvatar, signOut, loading: authLoading, isAuthenticated } = useAuth();
    const isOnline = useOnlineStatus();
    const { pendingCount, hasPending } = useSyncStatus();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<NavTab>('home');
    const [expenses, setExpenses] = useState<LocalExpense[]>([]);
    const [sedekahRecords, setSedekahRecords] = useState<LocalSedekah[]>([]);
    const [barakahScore, setBarakahScore] = useState<BarakahScoreResult | null>(null);
    const [ramadanStats, setRamadanStats] = useState<RamadanStats | null>(null);
    const [sedekahStreak, setSedekahStreak] = useState(0);

    // Expense form
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('makanan_halal');
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

    // Sedekah form
    const [sedekahAmount, setSedekahAmount] = useState('');
    const [sedekahRecipient, setSedekahRecipient] = useState('');
    const [sedekahDialogOpen, setSedekahDialogOpen] = useState(false);

    // Zakat
    const [zakatSavings, setZakatSavings] = useState('');
    const [zakatGold, setZakatGold] = useState('');
    const [zakatResult, setZakatResult] = useState<ZakatResult | null>(null);
    const [zakatHistory, setZakatHistory] = useState<LocalZakat[]>([]);

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

        // Calculate Barakah score
        const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);
        const totalSedekah = sed.reduce((s, e) => s + e.amount, 0);
        const savings = exp.filter(e => e.category === 'simpanan').reduce((s, e) => s + e.amount, 0);
        const debt = exp.filter(e => e.category === 'hutang').reduce((s, e) => s + e.amount, 0);

        const score = calculateBarakahScore({
            totalIncome: 5000, // placeholder
            totalExpenses,
            totalSedekah: totalSedekah,
            totalSavings: savings,
            totalDebt: debt,
        });
        setBarakahScore(score);

        // Load zakat history
        const history = await getZakatHistory(userId);
        setZakatHistory(history);
    }, [userId]);

    useEffect(() => {
        setMounted(true);
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        loadData();
    }, [authLoading, isAuthenticated, router, loadData]);

    const handleAddExpense = async () => {
        if (!userId || !expenseAmount) return;
        const input: CreateExpenseInput = {
            amount: parseFloat(expenseAmount),
            category: expenseCategory,
            description: expenseDesc || undefined,
            date: new Date().toISOString().split('T')[0],
            is_ramadan: isRamadanActive(),
        };
        await createExpense(userId, input);
        toast.success('Expense added!', { description: hasPending ? 'Will sync when online' : undefined });
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseDialogOpen(false);
        loadData();
    };

    const handleAddSedekah = async () => {
        if (!userId || !sedekahAmount) return;
        await createSedekah(userId, {
            amount: parseFloat(sedekahAmount),
            recipient: sedekahRecipient || undefined,
            date: new Date().toISOString().split('T')[0],
        });
        toast.success('Sedekah recorded! 🤲', { description: 'May Allah multiply your reward' });
        setSedekahAmount('');
        setSedekahRecipient('');
        setSedekahDialogOpen(false);
        loadData();
    };

    const handleCalculateZakat = async () => {
        if (!zakatSavings) return;
        const result = calculateZakat({
            totalSavings: parseFloat(zakatSavings),
            goldValue: zakatGold ? parseFloat(zakatGold) : undefined,
        });
        setZakatResult(result);
        if (userId) {
            await saveZakatRecord(userId, result, {
                totalSavings: parseFloat(zakatSavings),
                goldValue: zakatGold ? parseFloat(zakatGold) : undefined,
            });
            loadData();
        }
    };

    const advice = barakahScore ? getOfflineAdvice(barakahScore.score) : null;

    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
                <div className="text-center space-y-4">
                    <div className="text-4xl animate-pulse">🕌</div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a103d] to-[#0a0a1a] pb-safe">
            {/* Status Bar */}
            <div className="sticky top-0 z-50 px-4 py-3 glass-card rounded-none border-x-0 border-t-0">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                            {userName?.[0] || userEmail?.[0] || '?'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{userName || 'User'}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400 sync-pulse'}`} />
                                <span className="text-xs text-slate-500">{isOnline ? 'Online' : 'Offline'}</span>
                                {hasPending && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                        {pendingCount} pending
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white text-xs">
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* HOME TAB */}
                {activeTab === 'home' && (
                    <>
                        {/* Barakah Score */}
                        <Card className="glass-card border-purple-500/20 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/5" />
                            <CardContent className="relative pt-6 text-center">
                                <p className="text-sm text-slate-400 mb-2">Your Barakah Score</p>
                                <div className="text-6xl font-bold gradient-text mb-2">
                                    {barakahScore?.score || 0}%
                                </div>
                                <Progress value={barakahScore?.score || 0} className="h-2 mb-3" />
                                <Badge
                                    className={`mb-3 ${barakahScore?.tier === 'excellent'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                        : barakahScore?.tier === 'good'
                                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                            : barakahScore?.tier === 'fair'
                                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                        }`}
                                >
                                    {barakahScore?.tier?.replace('_', ' ') || 'calculating...'}
                                </Badge>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {barakahScore?.feedback || 'Add expenses and sedekah to see your score.'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* AI Advice */}
                        {advice && (
                            <Card className="glass-card border-purple-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <span>🤖</span> AI Financial Advice
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-slate-300 mb-3">{advice.advice}</p>
                                    <div className="space-y-1.5">
                                        {advice.suggestions.map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                                <span className="text-purple-400 mt-0.5">•</span>
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-20 flex-col gap-1 bg-gradient-to-br from-purple-600/20 to-purple-600/10 border border-purple-500/20 text-white hover:from-purple-600/30 hover:to-purple-600/20">
                                        <span className="text-2xl">💸</span>
                                        <span className="text-xs">Add Expense</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-purple-500/20 max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Add Expense</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount (RM)</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={expenseCategory} onValueChange={v => setExpenseCategory(v as ExpenseCategory)}>
                                                <SelectTrigger className="bg-purple-500/5 border-purple-500/20"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {EXPENSE_CATEGORIES.map(c => (
                                                        <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description (optional)</Label>
                                            <Input placeholder="e.g. Nasi Lemak" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <Button onClick={handleAddExpense} className="w-full bg-gradient-to-r from-purple-600 to-purple-500">Save Expense</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={sedekahDialogOpen} onOpenChange={setSedekahDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-20 flex-col gap-1 bg-gradient-to-br from-green-600/20 to-green-600/10 border border-green-500/20 text-white hover:from-green-600/30 hover:to-green-600/20">
                                        <span className="text-2xl">🤲</span>
                                        <span className="text-xs">Give Sedekah</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-purple-500/20 max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Record Sedekah</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount (RM)</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={sedekahAmount} onChange={e => setSedekahAmount(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Recipient (optional)</Label>
                                            <Input placeholder="e.g. Masjid Al-Falah" value={sedekahRecipient} onChange={e => setSedekahRecipient(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <Button onClick={handleAddSedekah} className="w-full bg-gradient-to-r from-green-600 to-green-500">Record Sedekah 🤲</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Sedekah Streak */}
                        <Card className="glass-card border-green-500/20">
                            <CardContent className="pt-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Sedekah Streak</p>
                                    <p className="text-2xl font-bold text-green-400">{sedekahStreak} days 🔥</p>
                                </div>
                                <div className="text-4xl">🤲</div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="glass-card border-purple-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-300">Recent Expenses</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {expenses.slice(0, 5).map((exp, i) => {
                                    const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                    return (
                                        <div key={exp.id || i} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{cat?.icon || '💰'}</span>
                                                <div>
                                                    <p className="text-sm text-white">{cat?.label || exp.category}</p>
                                                    <p className="text-xs text-slate-500">{exp.description || exp.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-white">RM {exp.amount.toFixed(2)}</p>
                                                {!exp.synced && (
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-yellow-400 border-yellow-500/30">
                                                        pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {expenses.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-4">No expenses yet. Add your first expense!</p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* EXPENSES TAB */}
                {activeTab === 'expenses' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Expenses</h2>
                            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-500">+ Add</Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-purple-500/20 max-w-sm">
                                    <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount (RM)</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={expenseCategory} onValueChange={v => setExpenseCategory(v as ExpenseCategory)}>
                                                <SelectTrigger className="bg-purple-500/5 border-purple-500/20"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {EXPENSE_CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Input placeholder="e.g. Lunch" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <Button onClick={handleAddExpense} className="w-full bg-gradient-to-r from-purple-600 to-purple-500">Save</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Category Breakdown */}
                        <div className="grid grid-cols-2 gap-3">
                            {EXPENSE_CATEGORIES.map(cat => {
                                const total = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
                                return (
                                    <Card key={cat.value} className="glass-card border-purple-500/10">
                                        <CardContent className="pt-4 pb-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{cat.icon}</span>
                                                <span className="text-xs text-slate-400">{cat.label}</span>
                                            </div>
                                            <p className="text-lg font-bold text-white">RM {total.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* All Expenses */}
                        <Card className="glass-card border-purple-500/20">
                            <CardContent className="pt-4 space-y-2">
                                {expenses.map((exp, i) => {
                                    const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                    return (
                                        <div key={exp.id || i} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span>{cat?.icon}</span>
                                                <div>
                                                    <p className="text-sm text-white">{exp.description || cat?.label}</p>
                                                    <p className="text-xs text-slate-500">{exp.date}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium" style={{ color: cat?.color }}>-RM {exp.amount.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* SEDEKAH TAB */}
                {activeTab === 'sedekah' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Sedekah</h2>
                            <Dialog open={sedekahDialogOpen} onOpenChange={setSedekahDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-gradient-to-r from-green-600 to-green-500">+ Give</Button>
                                </DialogTrigger>
                                <DialogContent className="glass-card border-purple-500/20 max-w-sm">
                                    <DialogHeader><DialogTitle>Record Sedekah</DialogTitle></DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount (RM)</Label>
                                            <Input type="number" step="0.01" placeholder="0.00" value={sedekahAmount} onChange={e => setSedekahAmount(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Recipient</Label>
                                            <Input placeholder="e.g. Masjid" value={sedekahRecipient} onChange={e => setSedekahRecipient(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                        </div>
                                        <Button onClick={handleAddSedekah} className="w-full bg-gradient-to-r from-green-600 to-green-500">Record 🤲</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="glass-card border-green-500/20">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-xs text-slate-400">Streak</p>
                                    <p className="text-3xl font-bold text-green-400">{sedekahStreak} 🔥</p>
                                    <p className="text-xs text-slate-500">consecutive days</p>
                                </CardContent>
                            </Card>
                            <Card className="glass-card border-green-500/20">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-xs text-slate-400">This Month</p>
                                    <p className="text-3xl font-bold text-green-400">
                                        RM {sedekahRecords.reduce((s, r) => s + r.amount, 0).toFixed(0)}
                                    </p>
                                    <p className="text-xs text-slate-500">{sedekahRecords.length} records</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="glass-card border-purple-500/20">
                            <CardContent className="pt-4 space-y-2">
                                {sedekahRecords.map((rec, i) => (
                                    <div key={rec.id || i} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                                        <div>
                                            <p className="text-sm text-white">{rec.recipient || 'Sedekah'}</p>
                                            <p className="text-xs text-slate-500">{rec.date}</p>
                                        </div>
                                        <p className="text-sm font-medium text-green-400">RM {rec.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                                {sedekahRecords.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-4">No sedekah records yet. Start giving! 🤲</p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* ZAKAT TAB */}
                {activeTab === 'zakat' && (
                    <>
                        <h2 className="text-xl font-bold text-white">Zakat Calculator</h2>

                        <Card className="glass-card border-purple-500/20">
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Total Savings (RM)</Label>
                                    <Input type="number" step="0.01" placeholder="e.g. 50000" value={zakatSavings} onChange={e => setZakatSavings(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gold Value (RM) — optional</Label>
                                    <Input type="number" step="0.01" placeholder="e.g. 10000" value={zakatGold} onChange={e => setZakatGold(e.target.value)} className="bg-purple-500/5 border-purple-500/20" />
                                </div>
                                <Button onClick={handleCalculateZakat} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500">
                                    Calculate Zakat
                                </Button>
                            </CardContent>
                        </Card>

                        {zakatResult && (
                            <Card className="glass-card border-yellow-500/20">
                                <CardContent className="pt-6 space-y-3">
                                    <div className="text-center">
                                        <p className="text-sm text-slate-400">Zakat Amount (2.5%)</p>
                                        <p className="text-4xl font-bold text-yellow-400">
                                            RM {zakatResult.zakatAmount.toFixed(2)}
                                        </p>
                                    </div>
                                    <Separator className="bg-purple-500/20" />
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400">Total Wealth</p>
                                            <p className="text-white font-medium">RM {zakatResult.totalWealth.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400">Nisab Threshold</p>
                                            <p className="text-white font-medium">RM {zakatResult.nisabThreshold.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <Badge className={zakatResult.isNisabEligible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                        {zakatResult.isNisabEligible ? '✅ Nisab Eligible — Zakat is obligatory' : '❌ Below Nisab — Zakat is not obligatory'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        )}

                        {/* History */}
                        {zakatHistory.length > 0 && (
                            <Card className="glass-card border-purple-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm text-slate-300">Zakat History</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {zakatHistory.map((z, i) => (
                                        <div key={z.id || i} className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0">
                                            <div>
                                                <p className="text-sm text-white">{z.year}</p>
                                                <p className="text-xs text-slate-500">Savings: RM {z.total_savings.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm font-medium text-yellow-400">RM {z.zakat_amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* RAMADAN TAB */}
                {activeTab === 'ramadan' && (
                    <>
                        <h2 className="text-xl font-bold text-white">🌙 Ramadan Mode</h2>

                        {ramadanStats?.isActive ? (
                            <>
                                <Card className="glass-card border-purple-500/20 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-yellow-600/5" />
                                    <CardContent className="relative pt-6 text-center">
                                        <p className="text-sm text-slate-400 mb-1">Ramadan Day</p>
                                        <p className="text-5xl font-bold text-white mb-2">{ramadanStats.day}</p>
                                        <p className="text-sm text-purple-300">of 30</p>
                                        <Progress value={(ramadanStats.day / 30) * 100} className="h-2 mt-3" />
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-3">
                                    <Card className="glass-card border-blue-500/20">
                                        <CardContent className="pt-4 text-center">
                                            <p className="text-xs text-slate-400">☀️ Sahur Total</p>
                                            <p className="text-xl font-bold text-blue-400">RM {ramadanStats.sahurTotal.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="glass-card border-orange-500/20">
                                        <CardContent className="pt-4 text-center">
                                            <p className="text-xs text-slate-400">🌅 Iftar Total</p>
                                            <p className="text-xl font-bold text-orange-400">RM {ramadanStats.iftarTotal.toFixed(2)}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="glass-card border-green-500/20">
                                    <CardContent className="pt-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-400">Ramadan Sedekah Streak</p>
                                            <p className="text-2xl font-bold text-green-400">{ramadanStats.sedekahStreak} days 🔥</p>
                                        </div>
                                        <p className="text-sm text-slate-400">Avg: RM {ramadanStats.dailyAverage.toFixed(2)}/day</p>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="glass-card border-purple-500/20">
                                <CardContent className="pt-8 pb-8 text-center space-y-4">
                                    <div className="text-5xl">🌙</div>
                                    <h3 className="text-lg font-semibold text-white">Ramadan Mode Inactive</h3>
                                    <p className="text-sm text-slate-400">
                                        Ramadan mode will automatically activate during the holy month. Your sahur, iftar spending, and sedekah streaks will be tracked here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-b-0">
                <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-[env(safe-area-inset-bottom)]">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${activeTab === item.key
                                ? 'text-purple-400 bg-purple-500/10'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
