"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Wallet, 
  HeartHandshake, 
  Calculator, 
  MoonStar
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Sedekah", href: "/sedekah", icon: HeartHandshake },
  { name: "Zakat", href: "/zakat", icon: Calculator },
  { name: "Ramadan", href: "/ramadan", icon: MoonStar },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 premium-glass-panel rounded-b-none border-x-0 border-b-0 pb-safe pt-2 px-6">
      <nav className="flex justify-between items-center max-w-md mx-auto relative pb-2">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
             <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 p-2 min-w-[3.5rem] relative"
              >
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(91,33,182,0.8)] dark:shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                )}
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.name}
                </span>
             </Link>
          );
        })}
      </nav>
    </div>
  );
}
