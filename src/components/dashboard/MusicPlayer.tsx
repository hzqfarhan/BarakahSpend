'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MusicPlayerProps {
    className?: string;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element once
        const audio = new Audio('/audio/background.mp3');
        audio.loop = true;
        audio.volume = 0.3;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    const toggle = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().catch(() => {
                // Browser might block autoplay — silently catch
            });
            setPlaying(true);
        }
    }, [playing]);

    return (
        <button
            onClick={toggle}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${playing
                    ? 'bg-indigo-50/70 text-indigo-600 shadow-sm shadow-indigo-100/50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                } ${className || ''}`}
            title={playing ? 'Mute Music' : 'Play Music'}
        >
            {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 010 7.07" />
                    <path d="M19.07 4.93a10 10 0 010 14.14" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
            )}
        </button>
    );
}
