'use client';

import { useState, useEffect } from 'react';

/**
 * Privacy-first notice banner.
 * Shown once on first login to inform users about data handling.
 */
export function PrivacyNotice() {
    const [dismissed, setDismissed] = useState(true); // default hidden

    useEffect(() => {
        const seen = localStorage.getItem('barakahspend_privacy_seen');
        if (!seen) setDismissed(false);
    }, []);

    if (dismissed) return null;

    const handleDismiss = () => {
        localStorage.setItem('barakahspend_privacy_seen', '1');
        setDismissed(true);
    };

    return (
        <div className="liquid-glass-strong p-4 mb-4 animate-fade-up" style={{ borderRadius: '1rem' }}>
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 mb-1">Privasi Data Anda</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        BarakahSpend menyimpan data anda secara selamat di peranti anda (offline) dan di pelayan kami (Supabase).
                        Kami tidak berkongsi data kewangan anda dengan pihak ketiga.
                        Data anda disulitkan semasa pemindahan.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Your financial data is stored securely on your device and our servers.
                        We never share your data with third parties.
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-slate-600 text-sm shrink-0"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}

/**
 * Offline data indicator banner.
 * Shows when user has pending sync items.
 */
export function OfflineDataBanner({ pendingCount }: { pendingCount: number }) {
    if (pendingCount === 0) return null;

    return (
        <div
            className="liquid-glass-subtle px-4 py-2 flex items-center gap-2 mb-3 animate-fade-up"
            style={{ borderRadius: '0.75rem' }}
        >
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs text-slate-600">
                <span className="font-medium text-amber-600">{pendingCount}</span> perubahan belum disync.
                Data disimpan secara offline dan akan auto-sync apabila internet tersambung.
            </p>
        </div>
    );
}
