import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'BarakahSpend — Islamic Financial Companion',
        short_name: 'BarakahSpend',
        description:
            'AI-powered Islamic financial companion. Track expenses, calculate zakat, give sedekah, grow your barakah.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#eef1f6',
        theme_color: '#6366f1',
        orientation: 'portrait',
        categories: ['finance', 'lifestyle'],
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
