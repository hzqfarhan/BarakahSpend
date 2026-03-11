"use client";

import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { InstallPwaBanner } from "@/components/pwa/InstallPwaBanner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/20 selection:text-primary">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-end px-6 lg:px-8 border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-40">
           <ThemeToggle />
        </header>
        <main className="flex-1 p-6 lg:p-8 pb-32 lg:pb-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
      <InstallPwaBanner />
    </div>
  );
}
