
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PublicScript } from '@/types/database';

type GallerySource = 'series' | 'comics' | 'scripts';
type GalleryItem = PublicScript & { _source?: GallerySource };

export const usePublicScripts = () => {
  const [scripts, setScripts] = useState<GalleryItem[]>([]);
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

      const mapRow = (s: any, genre: string, contentField = 'description', source: GallerySource = 'series') => ({
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
      const item = scripts.find(s => s.id === scriptId);
      const source = item?._source || 'series';
      const { data: newViewCount, error } = await (supabase as any).rpc('increment_public_content_view', {
        p_content_id: scriptId,
        p_source: source,
      });
      if (error) throw error;
      
      // Mettre à jour localement le compteur de vues
      setScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { ...script, view_count: Number(newViewCount ?? script.view_count + 1) }
          : script
      ));
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const toggleLike = async (scriptId: string) => {
    try {
      const item = scripts.find(s => s.id === scriptId);
      const source = item?._source || 'series';
      const { data, error } = await (supabase as any).rpc('toggle_public_content_like', {
        p_content_id: scriptId,
        p_source: source,
      });
      if (error) throw error;

      const likeAdded = Boolean(data?.liked);
      const likesCount = Number(data?.likes_count ?? 0);
      
      // Mettre à jour localement le compteur de likes
      setScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              likes_count: likesCount
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
