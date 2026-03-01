'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
    getUserOrganizations,
    createOrganization,
    getOrganizationMembers,
    subscribeToOrgDonations,
    type Organization,
    type OrganizationMember
} from '@/features/organizations/service';
import {
    DONATION_CATEGORIES,
    getLocalOrgDonations,
    getDonationsByCategory,
    generateQRData
} from '@/features/donations/service';

interface MasjidAdminPanelProps {
    userId: string | null;
}

export function MasjidAdminPanel({ userId }: MasjidAdminPanelProps) {
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<OrganizationMember[]>([]);

    // Donation state
    const [totalDonations, setTotalDonations] = useState(0);
    const [byCategory, setByCategory] = useState<Record<string, number>>({});

    // UI state
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgDesc, setNewOrgDesc] = useState('');

    // QR Code state
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    // 1. Initial Load: Fetch orgs
    useEffect(() => {
        if (!userId) return;
        loadOrgs();
    }, [userId]);

    const loadOrgs = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const userOrgs = await getUserOrganizations(userId);
            setOrgs(userOrgs);
            if (userOrgs.length > 0 && !activeOrg) {
                setActiveOrg(userOrgs[0]);
            }
        } catch (error) {
            console.error('Failed to load orgs', error);
            toast.error('Gagal memuat naik data organisasi.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Load Active Org Data (Members + Donations)
    useEffect(() => {
        if (!activeOrg) return;

        const loadOrgData = async () => {
            const mems = await getOrganizationMembers(activeOrg.id);
            setMembers(mems);

            const totals = await getDonationsByCategory(activeOrg.id);
            setByCategory(totals);
            const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
            setTotalDonations(total);
        };

        loadOrgData();

        // Subscribe to real-time donations
        const unsubscribe = subscribeToOrgDonations(activeOrg.id, (newDonation) => {
            console.log('New real-time donation:', newDonation);
            // Reload local totals when we get a real-time blip
            loadOrgData();
        });

        return () => {
            unsubscribe();
        };
    }, [activeOrg]);

    // 3. Generate QR Code when category selected
    useEffect(() => {
        if (!activeOrg || !selectedCategory) {
            setQrDataUrl('');
            return;
        }
        const generateQR = async () => {
            try {
                const qrText = generateQRData(activeOrg.id, selectedCategory, activeOrg.name);
                const url = await QRCode.toDataURL(qrText, {
                    width: 300,
                    margin: 2,
                    color: { dark: '#1e293b', light: '#ffffff' }
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error('Failed to generate QR', err);
            }
        };
        generateQR();
    }, [activeOrg, selectedCategory]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !newOrgName.trim()) return;

        const toastId = toast.loading('Mencipta organisasi...');
        try {
            const org = await createOrganization(newOrgName, newOrgDesc, userId);
            if (org) {
                toast.success('Organisasi berjaya dicipta!', { id: toastId });
                setShowCreateModal(false);
                setNewOrgName('');
                setNewOrgDesc('');
                await loadOrgs();
                setActiveOrg(org);
            } else {
                toast.error('Gagal mencipta organisasi.', { id: toastId });
            }
        } catch (error) {
            toast.error('Ralat ketika mencipta organisasi.', { id: toastId });
        }
    };

    if (loading && orgs.length === 0) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Memuatkan data masjid...</div>;
    }

    return (
        <div className="space-y-5 animate-fade-up">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl p-4 rounded-[1.5rem] border border-white/60 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Masjid Admin
                </h2>
                {orgs.length > 0 && (
                    <select
                        className="bg-white/80 border border-indigo-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        value={activeOrg?.id || ''}
                        onChange={(e) => {
                            const selected = orgs.find(o => o.id === e.target.value);
                            if (selected) setActiveOrg(selected);
                        }}
                    >
                        {orgs.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Create / Join Org */}
            {orgs.length === 0 ? (
                <div className="liquid-glass p-6" style={{ borderRadius: '1.5rem' }}>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Organisasi Anda</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Cipta atau sertai organisasi masjid untuk menjejaki derma dan perbelanjaan secara telus.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="liquid-btn liquid-btn-primary text-sm py-3"
                        >
                            Cipta Organisasi Baru
                        </button>
                        <button
                            onClick={() => toast.info('Fungsi Sertai Organisasi akan datang. Minta kod jemputan dari admin.')}
                            className="liquid-btn liquid-btn-glass text-sm py-3"
                        >
                            Sertai Organisasi
                        </button>
                    </div>
                </div>
            ) : null}

            {activeOrg && (
                <>
                    {/* Donation Categories Overview */}
                    <div className="liquid-glass p-6" style={{ borderRadius: '1.5rem' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">Prestasi Derma Mengikut Kategori</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {DONATION_CATEGORIES.map(cat => (
                                <div key={cat.value} className="liquid-glass-subtle p-3 flex flex-col items-center gap-2 hover:scale-[1.03] transition-transform" style={{ borderRadius: '1rem' }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner" style={{ background: '#6366f115' }}>
                                        <span className="text-xl">{cat.icon}</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-600 text-center leading-tight h-6 flex items-center">{cat.label}</span>
                                    <span className="text-sm font-bold text-indigo-600">RM {(byCategory[cat.value] || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* QR Code / Transparency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* QR Generator */}
                        <div className="liquid-glass p-6" style={{ borderRadius: '1.5rem' }}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-3">Jana QR Derma</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Pilih kategori untuk jana kod QR khas. Penderma boleh gunakan BarakahSpend untuk scan kod ini.
                            </p>

                            <select
                                className="w-full bg-white/80 border border-slate-200 text-sm rounded-xl px-4 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">-- Pilih Kategori Derma --</option>
                                {DONATION_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>

                            <div className="liquid-glass-subtle p-6 flex flex-col items-center justify-center min-h-[220px]" style={{ borderRadius: '1rem' }}>
                                {qrDataUrl ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="bg-white p-2 rounded-xl shadow-sm">
                                            <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-600">Tunjuk untuk Di-Scan</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 text-center">Sila pilih kategori di atas untuk memaparkan kod QR</span>
                                )}
                            </div>
                        </div>

                        {/* Financial Transparency panel */}
                        <div className="liquid-glass p-6 flex flex-col" style={{ borderRadius: '1.5rem' }}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-3">Ketelusan Kewangan ({activeOrg.name})</h3>
                            <p className="text-sm text-slate-500 mb-4 flex-1">
                                Maklumat ringkasan wang masuk dan keluar untuk memastikan kepercayaan jamaah masjid terpelihara secara digital.
                            </p>

                            <div className="space-y-3 mt-auto">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                                    <span className="text-sm text-slate-600">Jumlah Derma Terkumpul</span>
                                    <span className="text-sm font-bold text-emerald-600">RM {totalDonations.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/60 border border-red-100 opacity-60">
                                    <span className="text-sm text-slate-600 flex items-center gap-2">
                                        Perbelanjaan (Belum Ada)
                                    </span>
                                    <span className="text-sm font-bold text-red-500">RM 0.00</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                                    <span className="text-sm text-slate-600 font-medium">Baki Semasa</span>
                                    <span className="text-base font-bold text-indigo-600 leading-none">RM {totalDonations.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Ahli Jawatankuasa: <strong className="text-slate-700">{members.length}</strong></span>
                                {orgs.length > 0 && (
                                    <button onClick={() => setShowCreateModal(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                        + Cipta Org Lain
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Role Info */}
            <div className="liquid-glass-subtle p-4 flex items-center gap-3" style={{ borderRadius: '1rem' }}>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs text-slate-600">
                        <span className="font-semibold">Akses Berdasarkan Peranan:</span>
                        {activeOrg ? ' Ciri-ciri tambahan untuk admin seperti melantik bendahari dan menguruskan perbelanjaan akan ditambah dalam fasa seterusnya.' : ' Admin boleh urus semua, Bendahari urus wang masuk keluar.'}
                    </p>
                </div>
            </div>

            {/* Create Org Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-white/60">
                        <div className="p-4 border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50/50 to-white flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Cipta Organisasi / Masjid</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={handleCreateOrg} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">Nama Organisasi</label>
                                <input
                                    type="text"
                                    required
                                    value={newOrgName}
                                    onChange={e => setNewOrgName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Masjid Al-Falah"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5 ml-1">Penerangan (Pilihan)</label>
                                <textarea
                                    value={newOrgDesc}
                                    onChange={e => setNewOrgDesc(e.target.value)}
                                    className="w-full bg-white border border-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px]"
                                    placeholder="Komuniti Seri Kembangan"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 liquid-btn liquid-btn-primary py-2.5 rounded-xl text-sm font-semibold"
                                >
                                    Sahkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
