import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";

const SeriesCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [artStyle, setArtStyle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSeries = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour créer une série.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Titre requis",
        description: "Veuillez saisir un titre pour votre série.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // Create series in database with user's input
      const { data: newSeries, error } = await supabase
        .from('series')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          genre: genre || null,
          is_public: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      toast({
        title: "Série créée !",
        description: "Votre série a été créée avec succès. Ajoutez maintenant vos épisodes.",
      });
      
      navigate(`/series/${newSeries.id}/manage`);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la série.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-script-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Créer une Série/Feuilleton
          </h1>
          <p className="text-slate-600 text-lg">
            Créez votre série ou feuilleton multi-épisodes
          </p>
        </div>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-amber-800">
                Connectez-vous pour créer votre série et gérer vos épisodes.
              </span>
              <AuthModal>
                <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                  Se connecter
                </Button>
              </AuthModal>
            </div>
          </div>
        )}

        <Card className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-script-primary" />
              Informations de la série
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Titre de la série *</label>
              <Input
                placeholder="Ex: Les Aventures de..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                placeholder="Décrivez l'univers et l'intrigue générale de votre série..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Aventure</SelectItem>
                    <SelectItem value="comedy">Comédie</SelectItem>
                    <SelectItem value="drama">Drame</SelectItem>
                    <SelectItem value="horror">Horreur</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="scifi">Science-fiction</SelectItem>
                    <SelectItem value="fantasy">Fantastique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Style artistique</label>
                <Select value={artStyle} onValueChange={setArtStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Style par défaut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manga">Manga/Anime</SelectItem>
                    <SelectItem value="realistic">Réaliste</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="comic-book">Comic Book</SelectItem>
                    <SelectItem value="watercolor">Aquarelle</SelectItem>
                    <SelectItem value="noir">Noir & Blanc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour votre série</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Planifiez l'arc narratif général avant de créer les épisodes</li>
                <li>• Gardez une cohérence dans les personnages et l'univers</li>
                <li>• Chaque épisode peut être généré séparément avec l'IA</li>
                <li>• Vous pourrez publier les épisodes au fur et à mesure</li>
              </ul>
            </div>

            {user ? (
              <Button 
                onClick={handleCreateSeries}
                disabled={!title.trim() || isCreating}
                className="w-full bg-gradient-script text-white py-3 hover:scale-105 transition-transform"
              >
                {isCreating ? (
                  "Création en cours..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la série
                  </>
                )}
              </Button>
            ) : (
              <AuthModal>
                <Button className="w-full bg-gradient-script text-white py-3 hover:scale-105 transition-transform">
                  <Plus className="h-4 w-4 mr-2" />
                  Se connecter pour créer
                </Button>
              </AuthModal>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeriesCreate;