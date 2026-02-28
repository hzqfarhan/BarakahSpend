'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, type LocalUser } from '@/lib/db';
import { createClient } from '@/services/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Hook for authentication with offline session persistence.
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [localUser, setLocalUser] = useState<LocalUser | null>(null);
    const [loading, setLoading] = useState(true);

    const persistUserLocally = useCallback(async (u: User) => {
        const local: LocalUser = {
            id: u.id,
            email: u.email || '',
            full_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
            avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
        };
        await db.users.put(local);
        setLocalUser(local);
    }, []);

    useEffect(() => {
        const supabase = createClient();

        // Check initial session
        const checkSession = async () => {
            try {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    setUser(currentUser);
                    await persistUserLocally(currentUser);
                } else {
                    // Try to load from local DB for offline session
                    const localUsers = await db.users.toArray();
                    if (localUsers.length > 0) {
                        setLocalUser(localUsers[0]);
                    }
                }
            } catch {
                // Offline — load from local DB
                const localUsers = await db.users.toArray();
                if (localUsers.length > 0) {
                    setLocalUser(localUsers[0]);
                }
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    await persistUserLocally(session.user);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [persistUserLocally]);

    const signOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        await db.users.clear();
        setUser(null);
        setLocalUser(null);
    };

    const userId = user?.id || localUser?.id || null;
    const userEmail = user?.email || localUser?.email || null;
    const userName = user?.user_metadata?.full_name || localUser?.full_name || null;
    const userAvatar = user?.user_metadata?.avatar_url || localUser?.avatar_url || null;

    return {
        user,
        localUser,
        loading,
        userId,
        userEmail,
        userName,
        userAvatar,
        signOut,
        isAuthenticated: !!user || !!localUser,
        isOnlineSession: !!user,
    };
}
