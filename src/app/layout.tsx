import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  title: 'BarakahSpend — Islamic Financial Companion',
  description:
    'AI-powered Islamic financial companion for Malaysian Muslims, masjid committees and local communities. Track expenses, calculate zakat, give sedekah, and grow your barakah.',
  keywords: [
    'islamic finance',
    'halal spending',
    'zakat calculator',
    'sedekah tracker',
    'masjid management',
    'PWA',
    'offline finance',
  ],
  authors: [{ name: 'BarakahSpend' }],
  openGraph: {
    title: 'BarakahSpend — Islamic Financial Companion',
    description: 'AI-powered Islamic financial companion for Malaysian Muslims.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#eef1f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        style={{ backgroundColor: '#eef1f6', color: '#1a1d2e', colorScheme: 'light' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
