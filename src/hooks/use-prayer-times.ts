'use client';

import { useState, useEffect } from 'react';

interface PrayerTimes {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    Sunrise: string;
    Sunset: string;
}

interface PrayerTimesData {
    times: PrayerTimes | null;
    nextPrayer: { name: string; time: string; countdown: string } | null;
    iftarTime: string | null;
    loading: boolean;
    error: string | null;
    hijriDate: string | null;
    gregorianDate: string;
}

const PRAYER_NAMES: Record<string, string> = {
    Fajr: 'Subuh',
    Dhuhr: 'Zohor',
    Asr: 'Asar',
    Maghrib: 'Maghrib',
    Isha: 'Isyak',
};

function formatCountdown(diffMs: number): string {
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function parseTime(timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    now.setHours(h, m, 0, 0);
    return now;
}

export function usePrayerTimes(): PrayerTimesData {
    const [times, setTimes] = useState<PrayerTimes | null>(null);
    const [hijriDate, setHijriDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextPrayer, setNextPrayer] = useState<PrayerTimesData['nextPrayer']>(null);

    const now = new Date();
    const gregorianDate = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });

    useEffect(() => {
        async function fetchPrayerTimes() {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                // Use Aladhan API with auto-detected timezone
                const date = new Date();
                const dd = date.getDate();
                const mm = date.getMonth() + 1;
                const yyyy = date.getFullYear();

                const res = await fetch(
                    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=3.1390&longitude=101.6869&method=3&timezone=${tz}`
                );

                if (!res.ok) throw new Error('Failed to fetch prayer times');

                const data = await res.json();
                const timings = data.data.timings;
                const hijri = data.data.date.hijri;

                setTimes({
                    Fajr: timings.Fajr,
                    Dhuhr: timings.Dhuhr,
                    Asr: timings.Asr,
                    Maghrib: timings.Maghrib,
                    Isha: timings.Isha,
                    Sunrise: timings.Sunrise,
                    Sunset: timings.Sunset,
                });

                setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load prayer times');
            } finally {
                setLoading(false);
            }
        }

        fetchPrayerTimes();
    }, []);

    // Calculate next prayer
    useEffect(() => {
        if (!times) return;

        const updateNextPrayer = () => {
            const now = new Date();
            const prayers = [
                { name: 'Fajr', time: times.Fajr },
                { name: 'Dhuhr', time: times.Dhuhr },
                { name: 'Asr', time: times.Asr },
                { name: 'Maghrib', time: times.Maghrib },
                { name: 'Isha', time: times.Isha },
            ];

            for (const prayer of prayers) {
                const prayerTime = parseTime(prayer.time);
                if (prayerTime > now) {
                    setNextPrayer({
                        name: PRAYER_NAMES[prayer.name] || prayer.name,
                        time: prayer.time,
                        countdown: formatCountdown(prayerTime.getTime() - now.getTime()),
                    });
                    return;
                }
            }

            // All prayers passed — next is tomorrow's Fajr
            setNextPrayer({
                name: 'Subuh (tomorrow)',
                time: times.Fajr,
                countdown: '-',
            });
        };

        updateNextPrayer();
        const interval = setInterval(updateNextPrayer, 60000);
        return () => clearInterval(interval);
    }, [times]);

    return {
        times,
        nextPrayer,
        iftarTime: times?.Maghrib || null,
        loading,
        error,
        hijriDate,
        gregorianDate,
    };
}
