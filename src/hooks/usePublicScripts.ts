
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
      const [seriesRes, comicsRes, scriptsRes] = await Promise.all([
        supabase.from('series').select('*').eq('is_public', true).order('created_at', { ascending: false }),
        (supabase as any).from('comics').select('*').eq('is_public', true).eq('is_premium', false).eq('status', 'published').order('created_at', { ascending: false }),
        (supabase as any).from('scripts').select('*').eq('is_public', true).eq('is_premium', false).eq('status', 'published').order('created_at', { ascending: false }),
      ]);

      if (seriesRes.error) throw seriesRes.error;

      const mapRow = (s: any, genre: string, contentField = 'description', source: 'series'|'comics'|'scripts' = 'series') => ({
        id: s.id, title: s.title, content: s[contentField] || '', genre: s.genre || genre,
        age_range: s.age_range || 'all', theme: s.theme || s.art_style || s.genre || '',
        view_count: s.view_count || 0, likes_count: s.likes_count || 0,
        created_at: s.created_at, updated_at: s.updated_at, user_id: s.user_id,
        author_name: 'Créateur', author_avatar: null, is_public: true,
        allow_social_sharing: true, word_count: s.word_count || 0, custom_idea: null, status: 'published',
        _source: source,
      });

      const all = [
        ...(comicsRes.data || []).map((c: any) => mapRow(c, 'BD', 'description', 'comics')),
        ...(scriptsRes.data || []).map((s: any) => mapRow(s, 'Scénario', 'content', 'scripts')),
        ...(seriesRes.data || []).map((s: any) => mapRow(s, 'Série', 'description', 'series')),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setScripts(all as any);
    } catch (err) {
      console.error('Error fetching public scripts:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la galerie');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (scriptId: string) => {
    try {
      const item = scripts.find(s => s.id === scriptId) as any;
      const table = (item?._source as 'series'|'comics'|'scripts') || 'series';
      const { data: current } = await (supabase as any)
        .from(table)
        .select('view_count')
        .eq('id', scriptId)
        .maybeSingle();
      const newViewCount = (current?.view_count || 0) + 1;
      const { error } = await (supabase as any)
        .from(table)
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
      const item = scripts.find(s => s.id === scriptId) as any;
      const table = (item?._source as 'series'|'comics'|'scripts') || 'series';
      const userId = (await supabase.auth.getUser()).data.user?.id;
      // Check if user already liked this series
      const { data: existingLike } = await supabase
        .from('script_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('script_id', scriptId)
        .maybeSingle();

      let likeAdded = false;
      
      const { data: current } = await (supabase as any)
        .from(table)
        .select('likes_count')
        .eq('id', scriptId)
        .maybeSingle();
      const currentLikesCount = current?.likes_count || 0;
      
      if (existingLike) {
        // Remove like
        await supabase
          .from('script_likes')
          .delete()
          .eq('id', existingLike.id);
          
        await (supabase as any)
          .from(table)
          .update({ likes_count: Math.max(0, currentLikesCount - 1) })
          .eq('id', scriptId);
          
        likeAdded = false;
      } else {
        // Add like
        await supabase
          .from('script_likes')
          .insert({ 
            user_id: userId,
            script_id: scriptId 
          });
          
        await (supabase as any)
          .from(table)
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
