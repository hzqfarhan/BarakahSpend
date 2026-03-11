"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaBanner() {
  const isOnline = useOnlineStatus();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (typeof window !== "undefined") {
      const matchMedia = window.matchMedia("(display-mode: standalone)");
      setIsStandalone(matchMedia.matches || (window.navigator as any).standalone === true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if we aren't already running as a PWA
      if (!isStandalone) {
          setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const closeBanner = () => {
    setShowBanner(false);
    // Optionally save dismissal state in localStorage
  };

  if (!showBanner && isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-[60] px-4 md:px-0 pointer-events-none flex flex-col gap-3 max-w-lg mx-auto w-full">
      
      {/* Offline Status */}
      {!isOnline && (
         <div className="pointer-events-auto bg-brand-amber text-brand-amber-foreground px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-fade-up">
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-amber-foreground animate-ping" />
              <p className="text-sm font-semibold">You are offline. Changes will sync later.</p>
           </div>
         </div>
      )}

      {/* Install PWA Prompt */}
      {showBanner && isOnline && (
         <div className="pointer-events-auto premium-glass-panel border-brand-emerald/30 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-4 animate-fade-up">
            <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-xl flex items-center justify-center shrink-0">
               <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
               <h4 className="text-sm font-bold text-foreground">Install BarakahSpend</h4>
               <p className="text-xs text-muted-foreground mt-0.5">Add to home screen for faster tracking and offline access.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <Button onClick={closeBanner} variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-muted text-muted-foreground shrink-0 border border-border/50">
                  <X className="w-4 h-4" />
               </Button>
               <Button onClick={handleInstallClick} className="w-full md:w-auto h-10 rounded-xl bg-brand-emerald hover:bg-brand-emerald/90 text-white font-semibold flex-1 md:flex-none">
                  <Download className="w-4 h-4 mr-2" /> Install App
               </Button>
            </div>
         </div>
      )}
    </div>
  );
}
