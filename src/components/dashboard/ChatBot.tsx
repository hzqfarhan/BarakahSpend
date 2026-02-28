'use client';

import { useState, useRef, useEffect } from 'react';
import { IconChat } from '@/components/icons';
import Image from 'next/image';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatBotProps {
    isActive: boolean;
    onClose: () => void;
    userAvatar: string | null;
    userName: string | null;
}

export function ChatBot({ isActive, onClose, userAvatar, userName }: ChatBotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: 'Assalamualaikum! I\'m BarakahBot, your Islamic financial advisor. Ask me anything about budgeting, zakat, sedekah, halal investing, or how to increase barakah in your finances! You can chat in Bahasa Melayu or English.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = { role: 'user', content: input.trim() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        content: m.content,
                    })),
                }),
            });

            const data = await res.json();

            if (data.message) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I couldn\'t process that. Please try again later.',
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I\'m currently offline. Please check your connection and try again.',
            }]);
        } finally {
            setLoading(false);
        }
    };

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
                        <p className="text-[10px] text-emerald-500">Online</p>
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
                    <p className="text-xs text-emerald-500">AI Financial Advisor • Online</p>
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
                            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-tr-md shadow-md shadow-indigo-200/30'
                                : 'liquid-glass text-slate-700 rounded-tl-md'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

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
                        placeholder="Ask about zakat, budgeting, halal investing..."
                        className="flex-1 h-12 liquid-input text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
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
