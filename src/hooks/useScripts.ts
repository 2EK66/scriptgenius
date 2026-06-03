
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Script } from '@/types/database';

export const useScripts = () => {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setScripts([]);
      setLoading(false);
      return;
    }

    fetchScripts();
  }, [user]);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts((data || []) as any); // Type casting temporaire
    } catch (err) {
      console.error('Error fetching scripts:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des scénarios');
    } finally {
      setLoading(false);
    }
  };

  const deleteScript = async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setScripts(prev => prev.filter(script => script.id !== scriptId));
    } catch (err) {
      console.error('Error deleting script:', err);
      throw err;
    }
  };

  const updateScript = async (scriptId: string, updates: Partial<Script>) => {
    try {
      const { error } = await supabase
        .from('scripts')
        .update(updates)
        .eq('id', scriptId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setScripts(prev => prev.map(script => 
        script.id === scriptId ? { ...script, ...updates } : script
      ));
    } catch (err) {
      console.error('Error updating script:', err);
      throw err;
    }
  };

  const togglePublishScript = async (scriptId: string) => {
    try {
      const script = scripts.find(s => s.id === scriptId);
      if (!script) throw new Error('Script non trouvé');

      const newPublicStatus = !script.is_public;
      await updateScript(scriptId, { 
        is_public: newPublicStatus,
        allow_social_sharing: newPublicStatus ? true : script.allow_social_sharing
      });
      
      return newPublicStatus;
    } catch (err) {
      console.error('Error toggling script publication:', err);
      throw err;
    }
  };

  return {
    scripts,
    loading,
    error,
    fetchScripts,
    deleteScript,
    updateScript,
    togglePublishScript,
  };
};
