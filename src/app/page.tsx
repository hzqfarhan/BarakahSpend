import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a103d] to-[#0a0a1a]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo & Badge */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Offline-First PWA
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Barakah</span>
            <span className="text-white">Spend</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            AI-powered Islamic financial companion for Malaysian Muslims, masjid committees &amp; communities.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-lg">
          {[
            { icon: '🕌', text: 'Masjid SaaS' },
            { icon: '🤲', text: 'Sedekah Tracker' },
            { icon: '💰', text: 'Zakat Calculator' },
            { icon: '🌙', text: 'Ramadan Mode' },
            { icon: '📊', text: 'Barakah Score' },
            { icon: '🤖', text: 'AI Advisor' },
          ].map((f) => (
            <span
              key={f.text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full glass-card text-slate-300"
            >
              {f.icon} {f.text}
            </span>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-purple-300 rounded-xl border border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 text-center">
          {[
            { value: '100%', label: 'Offline Ready' },
            { value: '2.5%', label: 'Zakat Auto-Calc' },
            { value: '∞', label: 'Barakah Potential' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
