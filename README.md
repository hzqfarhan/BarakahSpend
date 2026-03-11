<div align="center">
  <img src="./public/logo-barakah.png" alt="BarakahSpend Logo" width="120" height="120" />
  <h1>BarakahSpend</h1>
  <p><strong>Your premium Islamic financial companion.</strong></p>
</div>

<br />

BarakahSpend is a modern, offline-first Next.js web application designed to help Muslims track their spending, maintain giving momentum, calculate their obligatory zakat, and navigate Ramadan with absolute clarity. It steps away from generic budgeting apps by embedding core spiritual financial principles directly into its user experience—all wrapped in a highly polished Neobank/Fintech aesthetic.

## ✨ Features

- **Barakah Score Intelligence:** A proprietary metric tracking your financial harmony based on saving rates, spending, and consistent sedekah. Includes an AI Advisor that translates this score into actionable, encouraging steps.
- **Categorical Expense Tracking:** Quick, intuitive interfaces for logging daily expenses via custom-mapped categories (Halal Food, Family Needs, Savings, Debt, Charity, etc).
- **Sedekah Momentum:** A dedicated interface tracking your consecutive giving habits. "Even half a date is charity."
- **Zakat Calculator:** Clear, high-trust calculation tools that weigh your savings and gold against live Nisab thresholds. Keep a permanent historical record of your yearly obligations.
- **Ramadan Mode:** An automated, immersive dashboard mode that tracks 30-day fasting progress, aggregates Sahur and Iftar specific budgets, and monitors daily Ramadan sedekah.
- **Offline-First PWA:** Built to work anywhere. Your data remains on your device and syncs intelligently when your connection is restored. Installable natively to your home screen.

## 🛠️ Technology Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Premium Tokens)
- **Components:** shadcn/ui & Radix Primitives
- **Icons:** Lucide React
- **Authentication:** Supabase Auth (Email & Google OAuth)
- **Deployment:** Vercel

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Configure your environment variables by creating a `.env.local` file at the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🌙 Design Philosophy

BarakahSpend rejects the traditional "washed-out" aesthetics often used in Islamic apps, adopting a premium, cinematic visual language instead.
It features two deeply tuned theme modes:
- **Light Mode:** A misty, airy environment promoting focus and clarity.
- **Dark Mode:** A deep, cinematic indigo experience with high-contrast glowing accents for late-night reflection and tracking.

## 📄 License & Privacy
BarakahSpend is a privacy-first application meaning we do not harvest or sell your categorical data. Sync flows require user consent and are strictly bound to individual Supabase tenants.
