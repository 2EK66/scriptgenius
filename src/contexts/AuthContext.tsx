
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseReady } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady()) {
      setLoading(false);
      return;
    }

    // Get initial session — si le refresh_token est corrompu (ancien projet),
    // on nettoie le localStorage pour repartir sur une session propre.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('[Auth] Session invalide, nettoyage:', error.message);
        supabase.auth.signOut().catch(() => {});
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
          .forEach((k) => localStorage.removeItem(k));
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseReady()) {
      return { error: new Error('Supabase n\'est pas configuré') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseReady()) {
      return { error: new Error('Supabase n\'est pas configuré') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseReady()) {
      return;
    }
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseReady()) {
      return { error: new Error('Supabase n\'est pas configuré') };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
