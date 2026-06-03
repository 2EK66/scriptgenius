import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Crown, TrendingUp, DollarSign, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PremiumScriptCard from "@/components/PremiumScriptCard";

interface PremiumScript {
  id: string;
  title: string;
  content: string;
  genre: string;
  age_range: string;
  theme: string;
  created_at: string;
  price: number;
  author_name: string;
  user_id: string;
  preview_content?: string;
  word_count?: number;
  is_purchased?: boolean;
}

const PremiumStore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scripts, setScripts] = useState<PremiumScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchPremiumScripts();
  }, [user]);

  const fetchPremiumScripts = async () => {
    // Données vides pour l'interface en attente
    setScripts([]);
    setLoading(false);
  };

  const filteredAndSortedScripts = scripts
    .filter(script => {
      const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           script.author_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = filterGenre === "all" || script.genre === filterGenre;
      
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'popular':
          // Placeholder pour la popularité - à implémenter avec des ventes
          return 0;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const genres = [...new Set(scripts.map(script => script.genre))];

  const handlePurchase = (scriptId: string) => {
    // Rafraîchir la liste après un achat
    fetchPremiumScripts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* En-tête du store */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-premium rounded-full">
              <Crown className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Boutique Premium
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Découvrez et achetez les meilleures œuvres de nos créateurs vedettes. 
            Contenus exclusifs et de qualité supérieure.
          </p>
        </div>

        {/* Statistiques */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{scripts.length}</div>
            <div className="text-sm text-slate-600">Œuvres premium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {user ? scripts.filter(s => s.is_purchased).length : 0}
            </div>
            <div className="text-sm text-slate-600">Vos achats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {Math.min(...scripts.map(s => s.price)) / 100 || 0} XOF
            </div>
            <div className="text-sm text-slate-600">À partir de</div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une œuvre, un auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Plus récent
                  </div>
                </SelectItem>
                <SelectItem value="price_low">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Prix croissant
                  </div>
                </SelectItem>
                <SelectItem value="price_high">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Prix décroissant
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Plus populaire
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtres actifs */}
        {(searchTerm || filterGenre !== "all") && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchTerm && (
              <Badge variant="secondary" className="px-3 py-1">
                Recherche: "{searchTerm}"
              </Badge>
            )}
            {filterGenre !== "all" && (
              <Badge variant="secondary" className="px-3 py-1">
                Genre: {filterGenre}
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1">
              {filteredAndSortedScripts.length} résultat{filteredAndSortedScripts.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement de la boutique...</p>
          </div>
        ) : filteredAndSortedScripts.length === 0 ? (
          <div className="text-center py-12">
            {scripts.length === 0 ? (
              <>
                <Crown className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">Aucune œuvre premium</h3>
                <p className="text-slate-600">
                  La boutique premium sera bientôt disponible avec des contenus exclusifs !
                </p>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
                <p className="text-slate-600">
                  Aucune œuvre ne correspond à vos critères de recherche
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedScripts.map(script => (
              <PremiumScriptCard
                key={script.id}
                script={script}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumStore;