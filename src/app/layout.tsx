import type { Metadata, Viewport } from 'next';
import { Inter, Archivo } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-heading',
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
  themeColor: '#09090b', // Updated default dark/light compat
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.variable} ${archivo.variable} antialiased min-h-screen font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
