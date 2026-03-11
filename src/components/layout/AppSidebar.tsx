"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Wallet, 
  HeartHandshake, 
  Calculator, 
  MoonStar,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Sedekah", href: "/sedekah", icon: HeartHandshake },
  { name: "Zakat", href: "/zakat", icon: Calculator },
  { name: "Ramadan", href: "/ramadan", icon: MoonStar },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex w-72 flex-col justify-between h-screen sticky top-0 bg-sidebar border-r border-sidebar-border shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex flex-col gap-8 p-6 pt-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="p-1 flex items-center justify-center rounded-xl group-hover:opacity-80 transition-all duration-300">
             <Image src="/logo.png" alt="BarakahSpend Logo" width={28} height={28} className="rounded-md" />
          </div>
          <span className="text-xl font-heading font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 dark:from-white dark:to-white/70">
            BarakahSpend
          </span>
        </Link>

        <nav className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "text-primary-foreground bg-primary shadow-md shadow-primary/20 dark:shadow-primary/10"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 w-1 h-full bg-white/20 dark:bg-black/20 rounded-l-xl" />
                )}
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        <nav className="flex flex-col gap-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-all"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            Settings
          </Link>
          <button
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all text-left"
          >
            <LogOut className="h-5 w-5 opacity-70" />
            Sign Out
          </button>
        </nav>
      </div>
    </div>
  );
}
