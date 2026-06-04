import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Play, Eye, Settings, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SeriesManage = () => {
  const { seriesId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [series, setSeries] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seriesId || !user?.id) return;
    
    const loadSeriesData = async () => {
      try {
        setLoading(true);
        
        // Load series from database
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('*')
          .eq('id', seriesId)
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (seriesError) throw seriesError;
        setSeries(seriesData);
        
        // For now, episodes are empty since we don't have an episodes table yet
        setEpisodes([]);
        
      } catch (error) {
        console.error('Error loading series data:', error);
        // Fallback to empty state if series not found
        setSeries(null);
        setEpisodes([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadSeriesData();
  }, [seriesId, user?.id]);

  const handleCreateEpisode = () => {
    // Redirect to the comic generator, pre-filling the series context
    window.location.href = `/comic-generator?seriesId=${seriesId}`;
  };

  const handlePublishEpisode = (episodeId: string) => {
    // Toggle episode publication status
    setEpisodes(prev => prev.map(ep => 
      ep.id === episodeId 
        ? { ...ep, status: ep.status === 'published' ? 'draft' : 'published' }
        : ep
    ));
    
    toast({
      title: "Statut mis à jour",
      description: "Le statut de l'épisode a été modifié.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-script-primary animate-pulse mx-auto mb-4" />
          <p>Chargement de la série...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Série introuvable</h2>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/gallery" className="inline-flex items-center text-script-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la galerie
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                {series.title}
              </h1>
              <p className="text-slate-600 text-lg mb-4">{series.description}</p>
              <div className="flex gap-2">
                <Badge className="bg-script-primary/10 text-script-primary">
                  {series.genre}
                </Badge>
                <Badge variant={series.status === 'ongoing' ? 'default' : 'secondary'}>
                  {series.status === 'ongoing' ? 'En cours' : 
                   series.status === 'completed' ? 'Terminée' : 'Brouillon'}
                </Badge>
                <Badge variant="outline">
                  {series.episode_count} épisode{series.episode_count > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button onClick={handleCreateEpisode} className="bg-gradient-script text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel épisode
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Gestion des épisodes</h2>
          
          {episodes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium mb-2">Aucun épisode</h3>
                <p className="text-slate-600 mb-4">
                  Commencez votre série en créant le premier épisode.
                </p>
                <Button onClick={handleCreateEpisode} className="bg-gradient-script text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier épisode
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {episodes.map((episode) => (
                <Card key={episode.id} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">
                            Épisode {episode.episode_number}
                          </Badge>
                          <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                            {episode.status === 'published' ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {episode.title || `Épisode ${episode.episode_number}`}
                        </h3>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {episode.view_count} vues
                          </span>
                          <span>•</span>
                          <span>Créé le {new Date(episode.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={episode.status === 'published' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handlePublishEpisode(episode.id)}
                        >
                          {episode.status === 'published' ? 'Dépublier' : 'Publier'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesManage;