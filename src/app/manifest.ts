import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'BarakahSpend — Islamic Financial Companion',
        short_name: 'BarakahSpend',
        description:
            'AI-powered Islamic financial companion for Malaysian Muslims, masjid committees and local communities.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#0a0a1a',
        theme_color: '#7c3aed',
        orientation: 'portrait',
        categories: ['finance', 'lifestyle'],
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        screenshots: [],
    };
}
