'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncStatus } from '@/hooks/use-sync-status';
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
    const { userId, userName, userEmail, signOut, loading: authLoading, isAuthenticated } = useAuth();
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
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    // Sedekah form
    const [sedekahAmount, setSedekahAmount] = useState('');
    const [sedekahRecipient, setSedekahRecipient] = useState('');
    const [showSedekahForm, setShowSedekahForm] = useState(false);

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

        const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);
        const totalSedekah = sed.reduce((s, e) => s + e.amount, 0);
        const savings = exp.filter(e => e.category === 'simpanan').reduce((s, e) => s + e.amount, 0);
        const debt = exp.filter(e => e.category === 'hutang').reduce((s, e) => s + e.amount, 0);

        const score = calculateBarakahScore({
            totalIncome: 5000,
            totalExpenses,
            totalSedekah,
            totalSavings: savings,
            totalDebt: debt,
        });
        setBarakahScore(score);

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
        setShowExpenseForm(false);
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
        setShowSedekahForm(false);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl animate-pulse">🕌</div>
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }

    // =========================================
    // INLINE MODAL (replaces Dialog component)
    // =========================================
    const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
        if (!open) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-sm liquid-glass p-6 animate-fade-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    // =========================================
    // BARAKAH SCORE TIER COLORS
    // =========================================
    const tierColors = {
        excellent: { bg: 'bg-emerald-100/60', text: 'text-emerald-700', border: 'border-emerald-200/50' },
        good: { bg: 'bg-sky-100/60', text: 'text-sky-700', border: 'border-sky-200/50' },
        fair: { bg: 'bg-amber-100/60', text: 'text-amber-700', border: 'border-amber-200/50' },
        needs_improvement: { bg: 'bg-red-100/60', text: 'text-red-700', border: 'border-red-200/50' },
    };
    const tc = tierColors[barakahScore?.tier || 'fair'];

    return (
        <div className="min-h-screen pb-safe">
            {/* ============ STATUS BAR ============ */}
            <div className="sticky top-0 z-50 px-4 py-3 liquid-glass-strong rounded-none border-x-0 border-t-0" style={{ borderRadius: '0 0 1.25rem 1.25rem' }}>
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-300/30">
                            {userName?.[0] || userEmail?.[0] || '?'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{userName || 'User'}</p>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400 sync-pulse'}`} />
                                <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
                                {hasPending && (
                                    <span className="liquid-badge bg-amber-50/80 text-amber-600 text-[10px] py-0.5 px-2 border-amber-200/40">
                                        {pendingCount} pending
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={signOut} className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-slate-100/60">
                        Sign Out
                    </button>
                </div>
            </div>

            {/* ============ MAIN CONTENT ============ */}
            <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

                {/* ============================== HOME TAB ============================== */}
                {activeTab === 'home' && (
                    <>
                        {/* Barakah Score */}
                        <div className="liquid-glass overflow-hidden liquid-gradient-indigo p-6 text-center animate-fade-up">
                            <p className="text-sm text-slate-500 mb-2">Your Barakah Score</p>
                            <div className="text-6xl font-extrabold gradient-text mb-2">
                                {barakahScore?.score || 0}%
                            </div>
                            <div className="w-full h-2 bg-slate-200/40 rounded-full overflow-hidden mb-3">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                    style={{ width: `${barakahScore?.score || 0}%` }}
                                />
                            </div>
                            <span className={`liquid-badge ${tc.bg} ${tc.text} ${tc.border}`}>
                                {barakahScore?.tier?.replace('_', ' ') || 'calculating...'}
                            </span>
                            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                                {barakahScore?.feedback || 'Add expenses and sedekah to see your score.'}
                            </p>
                        </div>

                        {/* AI Advice */}
                        {advice && (
                            <div className="liquid-glass p-5 animate-fade-up stagger-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">🤖</span>
                                    <h3 className="text-sm font-bold text-slate-700">AI Financial Advice</h3>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{advice.advice}</p>
                                <div className="space-y-1.5">
                                    {advice.suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                                            <span className="text-indigo-400 mt-0.5">•</span>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3 animate-fade-up stagger-2">
                            <button
                                onClick={() => setShowExpenseForm(true)}
                                className="liquid-glass liquid-gradient-indigo p-5 text-center hover:scale-[1.03] transition-transform active:scale-[0.98]"
                            >
                                <span className="text-2xl block mb-1">💸</span>
                                <span className="text-xs font-medium text-slate-600">Add Expense</span>
                            </button>
                            <button
                                onClick={() => setShowSedekahForm(true)}
                                className="liquid-glass liquid-gradient-emerald p-5 text-center hover:scale-[1.03] transition-transform active:scale-[0.98]"
                            >
                                <span className="text-2xl block mb-1">🤲</span>
                                <span className="text-xs font-medium text-slate-600">Give Sedekah</span>
                            </button>
                        </div>

                        {/* Sedekah Streak */}
                        <div className="liquid-glass liquid-gradient-emerald p-5 flex items-center justify-between animate-fade-up stagger-3">
                            <div>
                                <p className="text-sm text-slate-500">Sedekah Streak</p>
                                <p className="text-2xl font-bold text-emerald-600">{sedekahStreak} days 🔥</p>
                            </div>
                            <div className="text-4xl">🤲</div>
                        </div>

                        {/* Recent Expenses */}
                        <div className="liquid-glass p-5 animate-fade-up stagger-4">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Expenses</h3>
                            <div className="space-y-1">
                                {expenses.slice(0, 5).map((exp, i) => {
                                    const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                    return (
                                        <div key={exp.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{cat?.icon || '💰'}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{cat?.label || exp.category}</p>
                                                    <p className="text-xs text-slate-400">{exp.description || exp.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-800">RM {exp.amount.toFixed(2)}</p>
                                                {!exp.synced && (
                                                    <span className="liquid-badge bg-amber-50/80 text-amber-600 text-[10px] py-0 px-1.5 border-amber-200/40">
                                                        pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {expenses.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">No expenses yet. Add your first expense!</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ============================== EXPENSES TAB ============================== */}
                {activeTab === 'expenses' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
                            <button onClick={() => setShowExpenseForm(true)} className="liquid-btn liquid-btn-primary text-sm px-4 py-2">+ Add</button>
                        </div>

                        {/* Category Breakdown */}
                        <div className="grid grid-cols-2 gap-3">
                            {EXPENSE_CATEGORIES.map(cat => {
                                const total = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
                                return (
                                    <div key={cat.value} className="liquid-glass liquid-gradient-indigo p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span>{cat.icon}</span>
                                            <span className="text-xs text-slate-500">{cat.label}</span>
                                        </div>
                                        <p className="text-lg font-bold text-slate-800">RM {total.toFixed(2)}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* All Expenses */}
                        <div className="liquid-glass p-5">
                            <div className="space-y-1">
                                {expenses.map((exp, i) => {
                                    const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                    return (
                                        <div key={exp.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span>{cat?.icon}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{exp.description || cat?.label}</p>
                                                    <p className="text-xs text-slate-400">{exp.date}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800">-RM {exp.amount.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ============================== SEDEKAH TAB ============================== */}
                {activeTab === 'sedekah' && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Sedekah</h2>
                            <button onClick={() => setShowSedekahForm(true)} className="liquid-btn liquid-btn-emerald text-sm px-4 py-2">+ Give</button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="liquid-glass liquid-gradient-emerald p-4 text-center">
                                <p className="text-xs text-slate-500">Streak</p>
                                <p className="text-3xl font-bold text-emerald-600">{sedekahStreak} 🔥</p>
                                <p className="text-xs text-slate-400">consecutive days</p>
                            </div>
                            <div className="liquid-glass liquid-gradient-teal p-4 text-center">
                                <p className="text-xs text-slate-500">This Month</p>
                                <p className="text-3xl font-bold text-teal-600">
                                    RM {sedekahRecords.reduce((s, r) => s + r.amount, 0).toFixed(0)}
                                </p>
                                <p className="text-xs text-slate-400">{sedekahRecords.length} records</p>
                            </div>
                        </div>

                        <div className="liquid-glass p-5">
                            <div className="space-y-1">
                                {sedekahRecords.map((rec, i) => (
                                    <div key={rec.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">{rec.recipient || 'Sedekah'}</p>
                                            <p className="text-xs text-slate-400">{rec.date}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-emerald-600">RM {rec.amount.toFixed(2)}</p>
                                    </div>
                                ))}
                                {sedekahRecords.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">No sedekah records yet. Start giving! 🤲</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ============================== ZAKAT TAB ============================== */}
                {activeTab === 'zakat' && (
                    <>
                        <h2 className="text-xl font-bold text-slate-800">Zakat Calculator</h2>

                        <div className="liquid-glass p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600">Total Savings (RM)</label>
                                <input type="number" step="0.01" placeholder="e.g. 50000" value={zakatSavings} onChange={e => setZakatSavings(e.target.value)} className="w-full h-12 liquid-input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-600">Gold Value (RM) — optional</label>
                                <input type="number" step="0.01" placeholder="e.g. 10000" value={zakatGold} onChange={e => setZakatGold(e.target.value)} className="w-full h-12 liquid-input" />
                            </div>
                            <button onClick={handleCalculateZakat} className="w-full liquid-btn liquid-btn-amber h-12 text-base">
                                Calculate Zakat
                            </button>
                        </div>

                        {zakatResult && (
                            <div className="liquid-glass liquid-gradient-amber p-6 space-y-4 animate-fade-up">
                                <div className="text-center">
                                    <p className="text-sm text-slate-500">Zakat Amount (2.5%)</p>
                                    <p className="text-4xl font-extrabold text-amber-600">
                                        RM {zakatResult.zakatAmount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="h-px bg-slate-200/60" />
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-400">Total Wealth</p>
                                        <p className="font-semibold text-slate-700">RM {zakatResult.totalWealth.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Nisab Threshold</p>
                                        <p className="font-semibold text-slate-700">RM {zakatResult.nisabThreshold.toFixed(2)}</p>
                                    </div>
                                </div>
                                <span className={`liquid-badge ${zakatResult.isNisabEligible ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50' : 'bg-red-50/80 text-red-700 border-red-200/50'}`}>
                                    {zakatResult.isNisabEligible ? '✅ Nisab Eligible — Zakat is obligatory' : '❌ Below Nisab — Zakat is not obligatory'}
                                </span>
                            </div>
                        )}

                        {zakatHistory.length > 0 && (
                            <div className="liquid-glass p-5">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Zakat History</h3>
                                <div className="space-y-1">
                                    {zakatHistory.map((z, i) => (
                                        <div key={z.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{z.year}</p>
                                                <p className="text-xs text-slate-400">Savings: RM {z.total_savings.toFixed(2)}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-amber-600">RM {z.zakat_amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ============================== RAMADAN TAB ============================== */}
                {activeTab === 'ramadan' && (
                    <>
                        <h2 className="text-xl font-bold text-slate-800">🌙 Ramadan Mode</h2>

                        {ramadanStats?.isActive ? (
                            <>
                                <div className="liquid-glass liquid-gradient-indigo p-6 text-center overflow-hidden animate-fade-up">
                                    <p className="text-sm text-slate-500 mb-1">Ramadan Day</p>
                                    <p className="text-5xl font-extrabold text-slate-800 mb-2">{ramadanStats.day}</p>
                                    <p className="text-sm text-indigo-500">of 30</p>
                                    <div className="w-full h-2 bg-slate-200/40 rounded-full overflow-hidden mt-3">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                                            style={{ width: `${(ramadanStats.day / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="liquid-glass liquid-gradient-sky p-4 text-center">
                                        <p className="text-xs text-slate-500">☀️ Sahur Total</p>
                                        <p className="text-xl font-bold text-sky-600">RM {ramadanStats.sahurTotal.toFixed(2)}</p>
                                    </div>
                                    <div className="liquid-glass liquid-gradient-coral p-4 text-center">
                                        <p className="text-xs text-slate-500">🌅 Iftar Total</p>
                                        <p className="text-xl font-bold text-orange-600">RM {ramadanStats.iftarTotal.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="liquid-glass liquid-gradient-emerald p-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">Ramadan Sedekah Streak</p>
                                        <p className="text-2xl font-bold text-emerald-600">{ramadanStats.sedekahStreak} days 🔥</p>
                                    </div>
                                    <p className="text-sm text-slate-400">Avg: RM {ramadanStats.dailyAverage.toFixed(2)}/day</p>
                                </div>
                            </>
                        ) : (
                            <div className="liquid-glass p-8 text-center space-y-4">
                                <div className="text-5xl">🌙</div>
                                <h3 className="text-lg font-semibold text-slate-700">Ramadan Mode Inactive</h3>
                                <p className="text-sm text-slate-400">
                                    Ramadan mode will automatically activate during the holy month. Your sahur, iftar spending, and sedekah streaks will be tracked here.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ============ BOTTOM NAVIGATION ============ */}
            <div className="fixed bottom-0 left-0 right-0 z-50 liquid-glass-strong" style={{ borderRadius: '1.25rem 1.25rem 0 0' }}>
                <div className="max-w-lg mx-auto flex justify-around items-center py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${activeTab === item.key
                                    ? 'text-indigo-600 bg-indigo-50/60 scale-105'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ============ MODALS ============ */}
            <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Add Expense">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Amount (RM)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full h-12 liquid-input" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Category</label>
                        <select
                            value={expenseCategory}
                            onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                            className="w-full h-12 liquid-input appearance-none cursor-pointer"
                        >
                            {EXPENSE_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Description (optional)</label>
                        <input placeholder="e.g. Nasi Lemak" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="w-full h-12 liquid-input" />
                    </div>
                    <button onClick={handleAddExpense} className="w-full liquid-btn liquid-btn-primary h-12 text-base">Save Expense</button>
                </div>
            </Modal>

            <Modal open={showSedekahForm} onClose={() => setShowSedekahForm(false)} title="Record Sedekah">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Amount (RM)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={sedekahAmount} onChange={e => setSedekahAmount(e.target.value)} className="w-full h-12 liquid-input" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Recipient (optional)</label>
                        <input placeholder="e.g. Masjid Al-Falah" value={sedekahRecipient} onChange={e => setSedekahRecipient(e.target.value)} className="w-full h-12 liquid-input" />
                    </div>
                    <button onClick={handleAddSedekah} className="w-full liquid-btn liquid-btn-emerald h-12 text-base">Record Sedekah 🤲</button>
                </div>
            </Modal>
        </div>
    );
}
