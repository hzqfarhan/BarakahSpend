"use client";

import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell, Shield, LogOut, Database } from "lucide-react";

export default function SettingsPage() {
  const { user, userName, userEmail, signOut } = useAuth();

  return (
    <div className="space-y-8 animate-fade-up max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" /> Manage your BarakahSpend preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" /> Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 premium-glass-panel rounded-xl">
               <div>
                  <p className="font-semibold text-foreground">{userName || "Barakah User"}</p>
                  <p className="text-sm text-muted-foreground">{userEmail || "No email provided"}</p>
               </div>
               <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
                  {userName ? userName[0].toUpperCase() : "U"}
               </div>
            </div>
            {/* Future edit profile form could go here */}
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-brand-emerald" /> Appearance
            </CardTitle>
            <CardDescription>Customize how BarakahSpend looks on your device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 premium-glass-panel rounded-xl">
               <div>
                  <p className="font-semibold text-foreground">Theme Preference</p>
                  <p className="text-sm text-muted-foreground">Switch between misty light and cinematic dark modes.</p>
               </div>
               <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Data & Sync Section */}
        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-brand-amber" /> Data & Sync
            </CardTitle>
            <CardDescription>Manage your offline data and syncing preferences</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between p-4 premium-glass-panel rounded-xl">
                  <div>
                     <p className="font-semibold text-foreground">Sync Status</p>
                     <p className="text-sm text-muted-foreground">Data is synced automatically when online.</p>
                  </div>
                  <div className="px-3 py-1 bg-brand-emerald/10 text-brand-emerald rounded-full text-xs font-bold">
                     Active
                  </div>
               </div>
               <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-muted-foreground hover:text-foreground">
                  Export My Data
               </Button>
             </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20 bg-destructive/5 shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button
                variant="destructive"
                className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2"
                onClick={signOut}
             >
                <LogOut className="w-4 h-4" /> Sign Out
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
