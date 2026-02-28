import Link from 'next/link';
import Image from 'next/image';

const FEATURES = [
  { icon: '🕌', text: 'Masjid SaaS', gradient: 'from-indigo-400/20 to-violet-400/15' },
  { icon: '🤲', text: 'Sedekah Tracker', gradient: 'from-emerald-400/20 to-teal-400/15' },
  { icon: '💰', text: 'Zakat Calculator', gradient: 'from-amber-400/20 to-yellow-400/15' },
  { icon: '🌙', text: 'Ramadan Mode', gradient: 'from-purple-400/20 to-pink-400/15' },
  { icon: '📊', text: 'Barakah Score', gradient: 'from-sky-400/20 to-cyan-400/15' },
  { icon: '🤖', text: 'AI Advisor', gradient: 'from-rose-400/20 to-orange-400/15' },
];

const STATS = [
  { value: '100%', label: 'Offline Ready' },
  { value: '2.5%', label: 'Zakat Auto-Calc' },
  { value: '∞', label: 'Barakah Potential' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-300/15 blur-[120px] animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-300/12 blur-[100px] animate-float stagger-3" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-pink-300/10 blur-[80px] animate-float stagger-5" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">

        {/* Online badge */}
        <div className="animate-fade-up mb-8">
          <div className="liquid-badge bg-emerald-50/60 text-emerald-700 border-emerald-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Offline-First • Works Everywhere
          </div>
        </div>

        {/* Hero title */}
        <div className="text-center mb-8 animate-fade-up stagger-1">
          <Image src="/logo.png" alt="BarakahSpend" width={72} height={72} className="mx-auto mb-4 rounded-2xl shadow-lg shadow-indigo-200/40" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            <span className="gradient-text">Barakah</span>
            <span className="text-slate-800">Spend</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
            AI-powered Islamic financial companion for Malaysian Muslims, masjid committees &amp; communities.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-lg animate-fade-up stagger-2">
          {FEATURES.map((f) => (
            <span
              key={f.text}
              className={`liquid-glass-subtle inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-gradient-to-br ${f.gradient} hover:scale-105 transition-transform cursor-default`}
            >
              {f.icon} {f.text}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-up stagger-3">
          <Link href="/signup" className="liquid-btn liquid-btn-primary text-base px-10 py-4">
            Get Started — It&apos;s Free
          </Link>
          <Link href="/login" className="liquid-btn liquid-btn-glass text-base px-10 py-4">
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="liquid-glass px-8 py-6 animate-fade-up stagger-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div >
  );
}
