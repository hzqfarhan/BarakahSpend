'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
}

export interface FinancialContext {
    totalExpenses: number;
    totalSedekah: number;
    totalSavings: number;
    totalDebt: number;
    barakahScore: number;
    barakahTier: string;
    sedekahStreak: number;
    isRamadan: boolean;
}

interface ChatBotProps {
    isActive: boolean;
    onClose: () => void;
    userAvatar: string | null;
    userName: string | null;
    financialContext?: FinancialContext;
}

const EXAMPLE_PROMPTS = [
    'Berapa zakat yang perlu saya bayar?',
    'Can I afford this purchase?',
    'How much sedekah should I give monthly?',
    'Apa beza antara zakat dan sedekah?',
    'Cara nak tambah barakah dalam kewangan',
    'Tips menabung untuk pelajar',
];

export function ChatBot({ isActive, onClose, userAvatar, userName, financialContext }: ChatBotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Assalamualaikum! I\'m BarakahBot, your Islamic financial advisor. Ask me anything about budgeting, zakat, sedekah, halal investing, or how to increase barakah in your finances! You can chat in Bahasa Melayu or English.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const getFixedResponse = (query: string) => {
        const q = query.trim().toLowerCase();

        if (q.includes('berapa zakat')) {
            return "Zakat pendapatan diwajibkan jika pendapatan anda melepasi nisab (anggaran RM24,000+ setahun). Anda boleh guna kalkulator Zakat di tab Zakat untuk kira dengan tepat!";
        }
        if (q.includes('afford this purchase')) {
            return "This depends on your disposable income and savings. The 50/30/20 rule suggests 50% for needs, 30% for wants, and 20% savings. Make sure you don't use your emergency fund or go into debt for a 'want'.";
        }
        if (q.includes('how much sedekah')) {
            return "There's no minimum for sedekah! Even RM1 consistently is beloved by Allah. 'The most beloved of deeds to Allah are those that are most consistent, even if it is small.' (Bukhari)";
        }
        if (q.includes('beza antara zakat dan sedekah')) {
            return "Zakat adalah rukun Islam yang diwajibkan (2.5%) ke atas harta yang cukup syarat (nisab & haul). Sedekah pula adalah pemberian sunat pada bila-bila masa mengikut kemampuan.";
        }
        if (q.includes('tambah barakah')) {
            return "Untuk tambah barakah:\n1. Pastikan sumber rezeki halal.\n2. Bayar zakat bila wajib.\n3. Rajinkan bersedekah (terutamanya lepas Subuh).\n4. Jauhi riba (hutang faedah tinggi).\n5. Berbakti pada ibu bapa.";
        }
        if (q.includes('tips menabung')) {
            return "1. Asingkan duit simpanan SEBELUM berbelanja.\n2. Bawa bekal makanan.\n3. Guna diskaun pelajar (KTM, Apple dll).\n4. Cuba puasa sunat Isnin & Khamis untuk jimat dan dapat pahala!";
        }

        return "Saya masih belajar. Sila klik butang soalan yang dicadangkan di atas!";
    };

    const sendMessage = async (overrideText?: string) => {
        const messageText = overrideText || input.trim();
        if (!messageText || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: messageText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        // Simulate network delay for natural feel
        setTimeout(() => {
            const responseText = getFixedResponse(messageText);
            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
            setLoading(false);
        }, 600);
    };

    // Only show example prompts when there's only the greeting message
    const showExamples = messages.length === 1;

    if (!isActive) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header — mobile only */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 liquid-glass-strong" style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-200/50">
                        <Image src="/icons/barakahbot.png" alt="BarakahBot" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800">BarakahBot</p>
                        <p className="text-[10px] text-emerald-500">AI Financial Advisor</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center gap-3 p-5 pb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md shadow-indigo-300/20 border border-indigo-100/50">
                    <Image src="/icons/barakahbot.png" alt="BarakahBot" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">BarakahBot</h2>
                    <p className="text-xs text-emerald-500">AI Financial Advisor</p>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        {msg.role === 'user' ? (
                            userAvatar ? (
                                <Image src={userAvatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full shrink-0 ring-1 ring-indigo-200/50" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {userName?.[0] || '?'}
                                </div>
                            )
                        ) : (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-200/50 bg-white">
                                <Image src="/icons/barakahbot.png" alt="BarakahBot" width={32} height={32} className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-tr-md shadow-md shadow-indigo-200/30'
                                : msg.isError
                                    ? 'liquid-glass text-red-600 rounded-tl-md border-red-200/50'
                                    : 'liquid-glass text-slate-700 rounded-tl-md'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Example Prompts */}
                {showExamples && !loading && (
                    <div className="pt-2">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Cuba tanya:</p>
                        <div className="flex flex-wrap gap-2">
                            {EXAMPLE_PROMPTS.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(prompt)}
                                    className="liquid-glass-subtle px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:scale-[1.03] transition-all cursor-pointer"
                                    style={{ borderRadius: '99px' }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Retry button for errors */}
                {retryCount > 0 && !loading && messages[messages.length - 1]?.isError && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => {
                                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                if (lastUserMsg) sendMessage(lastUserMsg.content);
                            }}
                            className="liquid-btn-glass px-4 py-2 text-xs text-slate-600 hover:text-indigo-600 rounded-full"
                        >
                            Cuba lagi / Try again
                        </button>
                    </div>
                )}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-slate-200/50 bg-white">
                            <Image src="/icons/barakahbot.png" alt="BarakahBot" width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <div className="liquid-glass px-4 py-3 rounded-2xl rounded-tl-md">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 pt-2">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="Tanya tentang zakat, kewangan, pelaburan halal..."
                        className="flex-1 h-12 liquid-input text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="liquid-btn liquid-btn-primary h-12 px-5 disabled:opacity-40"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
