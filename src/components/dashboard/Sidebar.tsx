'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    IconHome, IconExpenses, IconSedekah, IconZakat,
    IconRamadan, IconChat, IconSignOut, IconCollapse,
} from '@/components/icons';

export type NavTab = 'home' | 'expenses' | 'sedekah' | 'zakat' | 'ramadan';

const NAV_ITEMS: { key: NavTab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
    { key: 'home', label: 'Home', Icon: IconHome },
    { key: 'expenses', label: 'Expenses', Icon: IconExpenses },
    { key: 'sedekah', label: 'Sedekah', Icon: IconSedekah },
    { key: 'zakat', label: 'Zakat', Icon: IconZakat },
    { key: 'ramadan', label: 'Ramadan', Icon: IconRamadan },
];

interface SidebarProps {
    activeTab: NavTab;
    onTabChange: (tab: NavTab) => void;
    userName: string | null;
    userEmail: string | null;
    userAvatar: string | null;
    isOnline: boolean;
    pendingCount: number;
    hasPending: boolean;
    onSignOut: () => void;
}

export function Sidebar({
    activeTab, onTabChange, userName, userEmail, userAvatar,
    isOnline, pendingCount, hasPending, onSignOut,
}: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved === 'true') setCollapsed(true);
    }, []);

    const toggle = () => {
        setCollapsed(prev => {
            localStorage.setItem('sidebar-collapsed', String(!prev));
            return !prev;
        });
    };

    return (
        <aside
            className={`hidden md:flex flex-col h-screen sticky top-0 z-40 transition-all duration-300 liquid-sidebar ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}
        >
            {/* Logo / Brand */}
            <div className="p-4 flex items-center gap-3">
                <Image src="/logo.png" alt="BarakahSpend" width={36} height={36} className="rounded-xl shrink-0" />
                {!collapsed && (
                    <span className="text-lg font-bold gradient-text whitespace-nowrap">BarakahSpend</span>
                )}
            </div>

            {/* User Profile */}
            <div className={`px-4 py-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                {userAvatar ? (
                    <Image
                        src={userAvatar}
                        alt={userName || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full shrink-0 ring-2 ring-indigo-200/50"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-indigo-300/30">
                        {userName?.[0] || userEmail?.[0] || '?'}
                    </div>
                )}
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{userName || 'User'}</p>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-red-400 sync-pulse'}`} />
                            <span className="text-xs text-slate-400">{isOnline ? 'Online' : 'Offline'}</span>
                            {hasPending && (
                                <span className="liquid-badge bg-amber-50/80 text-amber-600 text-[10px] py-0 px-1.5 border-amber-200/40 ml-1">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-slate-200/40 mx-4 my-1" />

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'ml-2'}`}>
                    {collapsed ? 'Menu' : 'Main Menu'}
                </p>
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.key}
                        onClick={() => onTabChange(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 group ${activeTab === item.key
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300/40 scale-[1.02]'
                            : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'
                            } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                    >
                        <item.Icon size={activeTab === item.key ? 22 : 20} className="shrink-0 transition-transform" />
                        {!collapsed && (
                            <span className={`text-sm tracking-wide ${activeTab === item.key ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 space-y-1.5">
                <div className="h-px bg-slate-200/40 mx-1 mb-2" />
                <button
                    onClick={onSignOut}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? 'Sign Out' : undefined}
                >
                    <IconSignOut size={20} className="shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
                </button>
                <button
                    onClick={toggle}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-all ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    <IconCollapse size={20} className={`shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
                    {!collapsed && <span className="text-sm font-medium">Collapse</span>}
                </button>
            </div>
        </aside>
    );
}

/* =================== BOTTOM NAV (Mobile) =================== */
export function BottomNav({ activeTab, onTabChange }: { activeTab: NavTab; onTabChange: (tab: NavTab) => void }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-3xl border-t border-slate-200/50 px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
            <div className="flex justify-between items-center py-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-1">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.key}
                        onClick={() => onTabChange(item.key)}
                        className={`flex flex-col items-center gap-1 w-14 py-2 rounded-2xl transition-all duration-300 ${activeTab === item.key
                            ? 'text-indigo-600 relative'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {activeTab === item.key && (
                            <span className="absolute -top-3 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_4px_12px_rgba(99,102,241,0.5)]" />
                        )}
                        <div className={`p-2 rounded-xl transition-colors ${activeTab === item.key ? 'bg-indigo-50/80 shadow-inner' : ''}`}>
                            <item.Icon size={22} className={activeTab === item.key ? 'scale-110 drop-shadow-sm' : ''} />
                        </div>
                        <span className={`text-[10px] tracking-wide ${activeTab === item.key ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
