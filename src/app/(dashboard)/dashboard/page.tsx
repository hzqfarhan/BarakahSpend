'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { usePrayerTimes } from '@/hooks/use-prayer-times';
import {
    createExpense,
    getLocalExpenses,
    EXPENSE_CATEGORIES,
    type ExpenseCategory,
    type CreateExpenseInput,
} from '@/features/expenses/service';
import { createSedekah, getLocalSedekah, getSedekahStreak } from '@/features/sedekah/service';
import { calculateBarakahScore, type BarakahScoreResult } from '@/features/barakah/service';
import { calculateZakat, saveZakatRecord, getZakatHistory, type ZakatResult } from '@/features/zakat/service';
import { getRamadanStats, isRamadanActive, type RamadanStats } from '@/features/ramadan/service';
import { getOfflineAdvice } from '@/ai/advisor';
import type { LocalExpense } from '@/lib/db';
import type { LocalSedekah, LocalZakat } from '@/lib/db';
import { toast } from 'sonner';

import { Sidebar, BottomNav, type NavTab } from '@/components/dashboard/Sidebar';
import { ChatBot } from '@/components/dashboard/ChatBot';
import { MusicPlayer } from '@/components/dashboard/MusicPlayer';
import { PrivacyNotice, OfflineDataBanner } from '@/components/dashboard/PrivacyNotice';

// ========================
// Icon helper — renders generated images instead of emoji
// ========================
function Ico({ src, size = 40, alt = '', hover = false }: { src: string; size?: number; alt?: string; hover?: boolean }) {
    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            className={`inline-block object-contain ${hover ? 'transition-transform duration-200 hover:scale-125' : ''}`}
        />
    );
}

// ========================
// Reusable Modal Component
// ========================
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
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
}

export default function DashboardPage() {
    const { userId, userName, userEmail, userAvatar, signOut, loading: authLoading, isAuthenticated } = useAuth();
    const isOnline = useOnlineStatus();
    const { pendingCount, hasPending } = useSyncStatus();
    const prayer = usePrayerTimes();
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
            zakatPaid: (await getZakatHistory(userId)).some(z => z.year === new Date().getFullYear()),
            sedekahStreak: streak,
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
        toast.success('Expense added!');
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
        toast.success('Sedekah recorded!', { description: 'May Allah multiply your reward' });
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
                    <Image src="/logo.png" alt="BarakahSpend" width={56} height={56} className="mx-auto animate-pulse rounded-2xl" />
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        );
    }



    const tierColors = {
        excellent: { bg: 'bg-emerald-100/60', text: 'text-emerald-700', border: 'border-emerald-200/50' },
        good: { bg: 'bg-sky-100/60', text: 'text-sky-700', border: 'border-sky-200/50' },
        fair: { bg: 'bg-amber-100/60', text: 'text-amber-700', border: 'border-amber-200/50' },
        needs_improvement: { bg: 'bg-red-100/60', text: 'text-red-700', border: 'border-red-200/50' },
    };
    const tc = tierColors[barakahScore?.tier || 'fair'];

    return (
        <div className="min-h-screen flex">
            {/* SIDEBAR (Desktop/iPad) */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userName={userName}
                userEmail={userEmail}
                userAvatar={userAvatar}
                isOnline={isOnline}
                pendingCount={pendingCount}
                hasPending={hasPending}
                onSignOut={signOut}
            />

            {/* MAIN AREA */}
            <div className="flex-1 min-h-screen pb-safe md:pb-0">

                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-50 px-4 py-3 liquid-glass-strong" style={{ borderRadius: '0 0 1.25rem 1.25rem' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {userAvatar ? (
                                <Image src={userAvatar} alt={userName || ''} width={48} height={48} className="rounded-full ring-2 ring-indigo-200/50" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-300/30">
                                    {userName?.[0] || userEmail?.[0] || '?'}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{userName || 'User'}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400 sync-pulse'}`} />
                                    <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <MusicPlayer />
                            <Image src="/logo.png" alt="BarakahSpend" width={48} height={48} className="rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-5">

                    {/* ============================== HOME TAB ============================== */}
                    {activeTab === 'home' && (
                        <>
                            {/* Date + Prayer Times Bar */}
                            <div className="liquid-glass p-6 animate-fade-up" style={{ borderRadius: '1.5rem' }}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{prayer.gregorianDate}</p>
                                            {prayer.hijriDate && (
                                                <p className="text-xs text-indigo-500">{prayer.hijriDate}</p>
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <MusicPlayer />
                                        </div>
                                    </div>
                                    {prayer.nextPrayer && (
                                        <div className="flex items-center gap-3">
                                            <Ico src="/icons/mosque.png" size={32} alt="Prayer" hover />
                                            <div>
                                                <p className="text-xs text-slate-400">Next: <span className="font-semibold text-slate-700">{prayer.nextPrayer.name}</span></p>
                                                <p className="text-sm font-bold text-indigo-600">{prayer.nextPrayer.time} <span className="text-xs text-slate-400">({prayer.nextPrayer.countdown})</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {prayer.iftarTime && ramadanStats?.isActive && (
                                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/30">
                                        <Ico src="/icons/iftar.png" size={28} alt="Iftar" hover />
                                        <div>
                                            <p className="text-xs text-slate-400">Buka Puasa</p>
                                            <p className="text-sm font-bold text-amber-600">{prayer.iftarTime}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Responsive grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Barakah Score */}
                                <div className="liquid-glass overflow-hidden liquid-gradient-indigo p-6 text-center animate-fade-up lg:col-span-2">
                                    <p className="text-sm text-slate-500 mb-2">Your Barakah Score</p>
                                    <div className="text-6xl font-extrabold gradient-text mb-2">
                                        {barakahScore?.score || 0}%
                                    </div>
                                    <div className="w-full max-w-md mx-auto h-2 bg-slate-200/40 rounded-full overflow-hidden mb-3">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                                            style={{ width: `${barakahScore?.score || 0}%` }}
                                        />
                                    </div>
                                    <span className={`liquid-badge ${tc.bg} ${tc.text} ${tc.border}`}>
                                        {barakahScore?.tier?.replace('_', ' ') || 'calculating...'}
                                    </span>
                                    <p className="text-sm text-slate-500 mt-3 leading-relaxed max-w-lg mx-auto">
                                        {barakahScore?.feedback || 'Add expenses and sedekah to see your score.'}
                                    </p>
                                </div>

                                {/* AI Advice */}
                                {advice && (
                                    <div className="liquid-glass p-5 animate-fade-up stagger-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Image src="/logo.png" alt="" width={20} height={20} className="rounded-md" />
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

                                {/* Sedekah Streak */}
                                <div className="liquid-glass liquid-gradient-emerald p-6 flex flex-col justify-between animate-fade-up stagger-2" style={{ borderRadius: '1.5rem', minHeight: '140px' }}>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-slate-600">Sedekah Streak</p>
                                        <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center shadow-inner">
                                            <Ico src="/icons/sedekah.png" size={28} alt="Sedekah" hover />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <p className="text-4xl font-black text-emerald-600 tracking-tight">{sedekahStreak}</p>
                                        <span className="text-sm font-semibold text-emerald-700/70 mt-2">days</span>
                                        <Ico src="/icons/fire-streak.png" size={32} alt="streak" hover />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up stagger-3">
                                <button
                                    onClick={() => setShowExpenseForm(true)}
                                    className="liquid-glass liquid-gradient-indigo p-6 text-center hover:scale-[1.03] transition-transform active:scale-[0.98] group flex flex-col items-center justify-center gap-4"
                                    style={{ borderRadius: '1.5rem' }}
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center shadow-inner group-hover:bg-white/60 transition-colors">
                                        <Ico src="/icons/wallet.png" size={56} alt="Expense" hover />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Add Expense</span>
                                </button>
                                <button
                                    onClick={() => setShowSedekahForm(true)}
                                    className="liquid-glass liquid-gradient-emerald p-6 text-center hover:scale-[1.03] transition-transform active:scale-[0.98] group flex flex-col items-center justify-center gap-4"
                                    style={{ borderRadius: '1.5rem' }}
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center shadow-inner group-hover:bg-white/60 transition-colors">
                                        <Ico src="/icons/sedekah.png" size={56} alt="Sedekah" hover />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Give Sedekah</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('zakat')}
                                    className="liquid-glass liquid-gradient-amber p-6 text-center hover:scale-[1.03] transition-transform active:scale-[0.98] group flex flex-col items-center justify-center gap-4"
                                    style={{ borderRadius: '1.5rem' }}
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center shadow-inner group-hover:bg-white/60 transition-colors">
                                        <Ico src="/icons/savings.png" size={56} alt="Zakat" hover />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Calc Zakat</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className="liquid-glass liquid-gradient-sky p-6 text-center hover:scale-[1.03] transition-transform active:scale-[0.98] group flex flex-col items-center justify-center gap-4"
                                    style={{ borderRadius: '1.5rem' }}
                                >
                                    <div className="w-20 h-20 rounded-full bg-white/40 flex items-center justify-center shadow-inner group-hover:bg-white/60 transition-colors overflow-hidden">
                                        <Image src="/icons/barakahbot.png" alt="BarakahBot" width={64} height={64} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">Ask AI</span>
                                </button>
                            </div>

                            {/* Recent Expenses */}
                            <div className="liquid-glass p-6 animate-fade-up stagger-4" style={{ borderRadius: '1.5rem' }}>
                                <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Expenses</h3>
                                <div className="space-y-1">
                                    {expenses.slice(0, 5).map((exp, i) => {
                                        const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                        return (
                                            <div key={exp.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <Ico src={cat?.icon || '/icons/savings.png'} size={24} alt={cat?.label || ''} />
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">{cat?.label || exp.category}</p>
                                                        <p className="text-xs text-slate-400">{exp.description || exp.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-800">RM {exp.amount.toFixed(2)}</p>
                                                    {!exp.synced && (
                                                        <span className="liquid-badge bg-amber-50/80 text-amber-600 text-[10px] py-0 px-1.5 border-amber-200/40">pending</span>
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

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {EXPENSE_CATEGORIES.map(cat => {
                                    const total = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0);
                                    return (
                                        <div key={cat.value} className="liquid-glass liquid-gradient-indigo p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-default" style={{ minHeight: '140px', borderRadius: '1.5rem' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-white/50 flex flex-shrink-0 items-center justify-center shadow-inner">
                                                    <Ico src={cat.icon} size={40} alt={cat.label} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 leading-tight line-clamp-2">{cat.label}</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-800 tracking-tight mt-4">RM {total.toFixed(2)}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="liquid-glass p-5">
                                <div className="space-y-1">
                                    {expenses.map((exp, i) => {
                                        const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                                        return (
                                            <div key={exp.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <Ico src={cat?.icon || '/icons/savings.png'} size={20} alt={cat?.label || ''} />
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="liquid-glass liquid-gradient-emerald p-6 flex flex-col justify-between" style={{ borderRadius: '1.5rem', minHeight: '140px' }}>
                                    <p className="text-sm font-medium text-slate-600">Streak</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-4xl font-black text-emerald-600 tracking-tight">{sedekahStreak}</p>
                                        <Ico src="/icons/fire-streak.png" size={36} alt="streak" hover />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 mt-1">consecutive days</p>
                                </div>
                                <div className="liquid-glass liquid-gradient-teal p-6 flex flex-col justify-between" style={{ borderRadius: '1.5rem', minHeight: '140px' }}>
                                    <p className="text-sm font-medium text-slate-600">This Month</p>
                                    <p className="text-4xl font-black text-teal-600 tracking-tight mt-2">
                                        RM {sedekahRecords.reduce((s, r) => s + r.amount, 0).toFixed(0)}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-1">{sedekahRecords.length} records</p>
                                </div>
                            </div>

                            <div className="liquid-glass p-5">
                                <div className="space-y-1">
                                    {sedekahRecords.map((rec, i) => (
                                        <div key={rec.id || i} className="flex items-center justify-between py-2.5 border-b border-slate-100/60 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <Ico src="/icons/sedekah.png" size={28} alt="Sedekah" hover />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{rec.recipient || 'Sedekah'}</p>
                                                    <p className="text-xs text-slate-400">{rec.date}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600">RM {rec.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                    {sedekahRecords.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-4">No sedekah records yet. Start giving!</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================== ZAKAT TAB ============================== */}
                    {activeTab === 'zakat' && (
                        <>
                            <h2 className="text-xl font-bold text-slate-800">Zakat Calculator</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="liquid-glass p-6 space-y-4" style={{ borderRadius: '1.5rem' }}>
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
                                    <div className="liquid-glass liquid-gradient-amber p-6 space-y-4 animate-fade-up" style={{ borderRadius: '1.5rem' }}>
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
                                            {zakatResult.isNisabEligible ? 'Nisab Eligible — Zakat is obligatory' : 'Below Nisab — Zakat is not obligatory'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {zakatHistory.length > 0 && (
                                <div className="liquid-glass p-6" style={{ borderRadius: '1.5rem' }}>
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
                            <div className="flex items-center gap-2">
                                <Ico src="/icons/crescent-moon.png" size={32} alt="Ramadan" hover />
                                <h2 className="text-xl font-bold text-slate-800">Ramadan Mode</h2>
                            </div>

                            {ramadanStats?.isActive ? (
                                <>
                                    <div className="liquid-glass liquid-gradient-indigo p-6 text-center overflow-hidden animate-fade-up" style={{ borderRadius: '1.5rem' }}>
                                        <p className="text-sm text-slate-500 mb-1">Ramadan Day</p>
                                        <p className="text-5xl font-extrabold text-slate-800 mb-2">{ramadanStats.day}</p>
                                        <p className="text-sm text-indigo-500">of 30</p>
                                        <div className="w-full max-w-md mx-auto h-2 bg-slate-200/40 rounded-full overflow-hidden mt-3">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${(ramadanStats.day / 30) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* Iftar time card */}
                                    {prayer.iftarTime && (
                                        <div className="liquid-glass liquid-gradient-amber p-6 flex flex-col md:flex-row md:items-center justify-between animate-fade-up stagger-1 gap-4" style={{ borderRadius: '1.5rem' }}>
                                            <div className="flex items-center gap-3">
                                                <Ico src="/icons/iftar.png" size={40} alt="Iftar" hover />
                                                <div>
                                                    <p className="text-xs text-slate-500">Buka Puasa</p>
                                                    <p className="text-2xl font-bold text-amber-600">{prayer.iftarTime}</p>
                                                </div>
                                            </div>
                                            {prayer.times?.Fajr && (
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Ico src="/icons/sahur.png" size={32} alt="Sahur" hover />
                                                        <div>
                                                            <p className="text-xs text-slate-500">Imsak</p>
                                                            <p className="text-lg font-bold text-sky-600">{prayer.times.Fajr}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="liquid-glass liquid-gradient-sky p-6 flex flex-col justify-between" style={{ borderRadius: '1.5rem', minHeight: '140px' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center shadow-inner">
                                                    <Ico src="/icons/sahur.png" size={28} alt="Sahur" hover />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">Sahur Total</p>
                                            </div>
                                            <p className="text-3xl font-black text-sky-600 tracking-tight mt-4">RM {ramadanStats.sahurTotal.toFixed(2)}</p>
                                        </div>
                                        <div className="liquid-glass liquid-gradient-coral p-6 flex flex-col justify-between" style={{ borderRadius: '1.5rem', minHeight: '140px' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center shadow-inner">
                                                    <Ico src="/icons/iftar.png" size={28} alt="Iftar" hover />
                                                </div>
                                                <p className="text-sm font-medium text-slate-600">Iftar Total</p>
                                            </div>
                                            <p className="text-3xl font-black text-orange-600 tracking-tight mt-4">RM {ramadanStats.iftarTotal.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="liquid-glass liquid-gradient-emerald p-6 flex items-center justify-between mt-4" style={{ borderRadius: '1.5rem' }}>
                                        <div>
                                            <p className="text-sm text-slate-500">Ramadan Sedekah Streak</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-2xl font-bold text-emerald-600">{ramadanStats.sedekahStreak} days</p>
                                                <Ico src="/icons/fire-streak.png" size={32} alt="streak" hover />
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400">Avg: RM {ramadanStats.dailyAverage.toFixed(2)}/day</p>
                                    </div>
                                </>
                            ) : (
                                <div className="liquid-glass p-8 text-center space-y-4" style={{ borderRadius: '1.5rem' }}>
                                    <Ico src="/icons/crescent-moon.png" size={56} alt="Ramadan" />
                                    <h3 className="text-lg font-semibold text-slate-700">Ramadan Mode Inactive</h3>
                                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                                        Ramadan mode will automatically activate during the holy month. Your sahur, iftar spending, and sedekah streaks will be tracked here.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* ============================== CHAT TAB ============================== */}
                    {activeTab === 'chat' && (
                        <div className="liquid-glass overflow-hidden animate-fade-up" style={{ height: 'calc(100vh - 10rem)' }}>
                            <ChatBot
                                isActive={true}
                                onClose={() => setActiveTab('home')}
                                userAvatar={userAvatar}
                                userName={userName}
                                financialContext={{
                                    totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
                                    totalSedekah: sedekahRecords.reduce((s, e) => s + e.amount, 0),
                                    totalSavings: expenses.filter(e => e.category === 'simpanan').reduce((s, e) => s + e.amount, 0),
                                    totalDebt: expenses.filter(e => e.category === 'hutang').reduce((s, e) => s + e.amount, 0),
                                    barakahScore: barakahScore?.score ?? 0,
                                    barakahTier: barakahScore?.tier ?? 'needs_improvement',
                                    sedekahStreak,
                                    isRamadan: ramadanStats?.isActive ?? false,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM NAV (Mobile) */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* MODALS */}
            <Modal open={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="Add Expense">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Amount (RM)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full h-12 liquid-input" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-600">Category</label>
                        <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)} className="w-full h-12 liquid-input appearance-none cursor-pointer">
                            {EXPENSE_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
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
                    <button onClick={handleAddSedekah} className="w-full liquid-btn liquid-btn-emerald h-12 text-base">Record Sedekah</button>
                </div>
            </Modal>
        </div>
    );
}
