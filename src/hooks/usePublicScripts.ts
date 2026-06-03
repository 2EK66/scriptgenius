
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicScript } from '@/types/database';

export const usePublicScripts = () => {
  const [scripts, setScripts] = useState<PublicScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicScripts();
  }, []);

  const fetchPublicScripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform series data to match PublicScript interface
      const transformedData = (data || []).map(series => ({
        id: series.id,
        title: series.title,
        content: series.description || '',
        genre: series.genre || '',
        age_range: 'all',
        theme: series.genre || '',
        view_count: series.view_count || 0,
        likes_count: series.likes_count || 0,
        created_at: series.created_at,
        updated_at: series.updated_at,
        user_id: series.user_id,
        author_name: 'Créateur',
        author_avatar: null,
        is_public: true,
        allow_social_sharing: true,
        word_count: 0,
        custom_idea: null,
        status: 'published'
      }));
      
      setScripts(transformedData as any);
    } catch (err) {
      console.error('Error fetching public scripts:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la galerie');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (scriptId: string) => {
    try {
      // Get current view count first
      const { data: currentSeries } = await supabase
        .from('series')
        .select('view_count')
        .eq('id', scriptId)
        .single();
        
      const newViewCount = (currentSeries?.view_count || 0) + 1;
      
      const { error } = await supabase
        .from('series')
        .update({ view_count: newViewCount })
        .eq('id', scriptId);
      
      if (error) throw error;
      
      // Mettre à jour localement le compteur de vues
      setScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { ...script, view_count: script.view_count + 1 }
          : script
      ));
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const toggleLike = async (scriptId: string) => {
    try {
      // Check if user already liked this series
      const { data: existingLike } = await supabase
        .from('script_likes')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('script_id', scriptId)
        .single();

      let likeAdded = false;
      
      // Get current likes count
      const { data: currentSeries } = await supabase
        .from('series')
        .select('likes_count')
        .eq('id', scriptId)
        .single();
        
      const currentLikesCount = currentSeries?.likes_count || 0;
      
      if (existingLike) {
        // Remove like
        await supabase
          .from('script_likes')
          .delete()
          .eq('id', existingLike.id);
          
        await supabase
          .from('series')
          .update({ likes_count: Math.max(0, currentLikesCount - 1) })
          .eq('id', scriptId);
          
        likeAdded = false;
      } else {
        // Add like
        await supabase
          .from('script_likes')
          .insert({ 
            user_id: (await supabase.auth.getUser()).data.user?.id,
            script_id: scriptId 
          });
          
        await supabase
          .from('series')
          .update({ likes_count: currentLikesCount + 1 })
          .eq('id', scriptId);
          
        likeAdded = true;
      }
      
      // Mettre à jour localement le compteur de likes
      setScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              likes_count: likeAdded 
                ? script.likes_count + 1 
                : Math.max(0, script.likes_count - 1)
            }
          : script
      ));
      
      return likeAdded;
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  };

  return {
    scripts,
    loading,
    error,
    fetchPublicScripts,
    incrementViewCount,
    toggleLike,
  };
};
