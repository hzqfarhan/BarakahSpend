import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, HeartHandshake, Calculator, MoonStar, BarChart3, Fingerprint } from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Expense Tracking",
    description: "Understand your financial rhythm with intelligent categorization and zero-clutter insights.",
  },
  {
    icon: HeartHandshake,
    title: "Sedekah Streaks",
    description: "Build momentum in your charity. Every small act of giving becomes a lasting habit.",
  },
  {
    icon: Calculator,
    title: "Zakat Estimation",
    description: "A guided, clear zakat estimate based on live nisab data to keep your wealth pure.",
  },
  {
    icon: MoonStar,
    title: "Ramadan Mode",
    description: "Move through the holy month with intention. Track sahur, iftar, and daily giving.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl overflow-hidden shadow-sm bg-white/10">
              <Image src="/logo-barakah.png" alt="BarakahSpend Logo" width={36} height={36} className="rounded-lg object-cover" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">BarakahSpend</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col pt-16">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-emerald/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8 backdrop-blur-sm animate-fade-up">
              <ShieldCheck className="w-4 h-4" />
              <span>Offline-First • Privacy Focused</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1] animate-fade-up stagger-1">
              Spend with purpose. <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-brand-emerald to-brand-primary">
                Build wealth with barakah.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up stagger-2">
              BarakahSpend helps Malaysian Muslims track spending, stay consistent in giving, estimate zakat, and navigate Ramadan with absolute clarity.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up stagger-3">
              <Link href="/signup">
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all w-full sm:w-auto">
                  Start your journey <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-medium border-border hover:bg-secondary w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Dashboard Mockup Preview */}
            <div className="mt-20 w-full max-w-5xl mx-auto relative animate-fade-up stagger-4">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 h-full flex items-end justify-center pb-12">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider backdrop-blur-md px-4 py-2 rounded-full border border-border/50">Experience financial clarity</p>
              </div>
              <div className="rounded-2xl md:rounded-3xl border border-border/50 bg-card/50 backdrop-blur-md shadow-2xl overflow-hidden min-h-[400px] flex transform perspective-1000 rotate-x-2 scale-95 origin-bottom relative">
                 {/* Fake sidebar */}
                 <div className="w-64 border-r border-border/50 hidden md:block p-6 opacity-40">
                    <div className="h-8 w-32 bg-secondary rounded-lg mb-12" />
                    <div className="space-y-4">
                      {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-full bg-secondary rounded-xl" />)}
                    </div>
                 </div>
                 {/* Fake content */}
                 <div className="flex-1 p-6 md:p-10 opacity-60">
                    <div className="flex justify-between mb-8">
                       <div className="h-10 w-48 bg-secondary rounded-xl" />
                       <div className="h-10 w-10 bg-secondary rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                       <div className="h-40 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20" />
                       <div className="h-40 rounded-2xl bg-secondary" />
                       <div className="h-40 rounded-2xl bg-secondary" />
                    </div>
                    <div className="h-64 rounded-2xl bg-secondary" />
                 </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">A financial companion for your spiritual cadence</h2>
              <p className="text-muted-foreground text-lg">Intentionally designed to bridge modern financial management with Islamic principles.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, i) => (
                <div key={i} className="premium-card p-6 flex flex-col group fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI & Barakah Differentiator */}
        <section className="py-24 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-amber/10 text-brand-amber text-sm font-medium mb-6">
                      <Zap className="w-4 h-4" /> Intelligent Guidance
                    </div>
                    <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 leading-tight">Your Barakah Score, Explained.</h2>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      More than just a number. The Barakah Score measures the harmony of your finances—balancing essential spending discipline, savings consistency, and regular sedekah. Our AI Advisor translates your habits into actionable, encouraging steps.
                    </p>
                    <ul className="space-y-4">
                      {[
                        "Clear breakdown of your financial balance",
                        "Gentle reminders to build giving streaks",
                        "Encouragement, never judgment"
                      ].map((text, i) => (
                        <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                          <div className="w-6 h-6 rounded-full bg-brand-emerald/20 text-brand-emerald flex items-center justify-center shrink-0">
                            ✓
                          </div>
                          {text}
                        </li>
                      ))}
                    </ul>
                 </div>
                 <div className="relative">
                    <div className="aspect-square max-h-[500px] w-full rounded-3xl premium-glass-panel border-brand-amber/20 bg-gradient-to-br from-brand-amber/5 to-transparent flex items-center justify-center p-8 relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('/bgbarakah.png')] bg-cover opacity-5 mix-blend-overlay dark:opacity-10" />
                       <div className="text-center relative z-10">
                          <div className="text-8xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-b from-brand-amber to-brand-amber/50 mb-4">
                            85
                          </div>
                          <h3 className="text-2xl font-bold mb-2">Excellent Rhythm</h3>
                          <p className="text-muted-foreground">Your sedekah consistency grew by 15% this month.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Trust Footer */}
        <footer className="bg-card border-t border-border py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
               <Fingerprint className="w-5 h-5 text-muted-foreground" />
               <span className="text-sm text-muted-foreground font-medium">Your data stays on your device. Offline-first PWA.</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} BarakahSpend. Find your balance.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
