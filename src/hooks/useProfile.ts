
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data as any); // Type casting temporaire
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  const canGenerateScript = () => {
    // Allow while loading or when profile not yet created; server enforces limits
    if (loading) return true;
    if (!profile) return true;
    
    // Premium users have unlimited generations
    if (profile.subscription_type === 'premium') return true;
    
    // Normalize by date: if last_generation_date is not today, count is 0
    const today = new Date().toISOString().slice(0, 10);
    const last = (profile.last_generation_date || '').slice(0, 10);
    const countToday = last === today ? profile.scripts_generated_today : 0;
    
    // Free users can generate 3 scripts per day
    return countToday < 3;
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    canGenerateScript,
  };
};
