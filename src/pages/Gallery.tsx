
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, Images, TrendingUp, Clock, Heart, Shield } from "lucide-react";
import { usePublicScripts } from "@/hooks/usePublicScripts";
import { useRewards } from "@/hooks/useRewards";
import { useSecureSearch } from "@/hooks/useSecureSearch";
import { useDataProtection } from "@/hooks/useDataProtection";
import GalleryCard from "@/components/GalleryCard";
import Header from "@/components/Header";

const Gallery = () => {
  const { scripts, loading, error, incrementViewCount, toggleLike } = usePublicScripts();
  const { leaderboard } = useRewards();
  const { secureSearch, isBlocked } = useSecureSearch();
  const { filterSearchResults, canShareData, logDataAccess } = useDataProtection();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Créer un map des rangs des auteurs pour optimiser les performances
  const authorRankMap = new Map(
    leaderboard.map(creator => [creator.user_id, creator.rank])
  );

  // Fonction de recherche sécurisée
  const performSecureSearch = (query: string) => {
    return scripts.filter(script => {
      const matchesSearch = script.title.toLowerCase().includes(query.toLowerCase()) ||
                           script.content.toLowerCase().includes(query.toLowerCase()) ||
                           script.author_name.toLowerCase().includes(query.toLowerCase());
      
      const matchesGenre = filterGenre === "all" || script.genre === filterGenre;
      
      return matchesSearch && matchesGenre;
    });
  };

  // Recherche sécurisée avec filtrage
  const searchResults = searchTerm 
    ? secureSearch(searchTerm, performSecureSearch, (query) => {
        // Vérifications additionnelles pour la galerie publique
        if (query.length < 2) {
          return { valid: false, reason: "La recherche doit contenir au moins 2 caractères" };
        }
        return { valid: true };
      })
    : { results: scripts, error: null };

  // Gestion des erreurs de recherche
  useEffect(() => {
    if (searchResults.error) {
      setSearchError(searchResults.error);
    } else {
      setSearchError(null);
    }
  }, [searchResults.error]);

  // Filtrer et protéger les données des résultats
  const protectedResults = filterSearchResults(
    searchResults.results || [], 
    'user', // Rôle utilisateur standard pour la galerie publique
    'public_scripts'
  );

  const filteredAndSortedScripts = protectedResults
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes_count - a.likes_count;
        case 'views':
          return b.view_count - a.view_count;
        case 'top_creators':
          // Prioriser les créateurs du top 3
          const rankA = authorRankMap.get(a.user_id) || 999;
          const rankB = authorRankMap.get(b.user_id) || 999;
          if (rankA !== rankB) return rankA - rankB;
          return b.likes_count - a.likes_count;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const genres = [...new Set(scripts.map(script => script.genre))];

  const handleViewScript = async (scriptId: string) => {
    // Logger l'accès au script
    logDataAccess('view', 'public_script', 'content');
    await incrementViewCount(scriptId);
  };

  const handleToggleLike = async (scriptId: string) => {
    logDataAccess('view', 'public_script', 'like_action');
    return await toggleLike(scriptId);
  };

  const handleSearchChange = (value: string) => {
    // Vérifier si le terme est bloqué avant de l'accepter
    if (isBlocked(value)) {
      setSearchError("Ce terme de recherche n'est pas autorisé");
      return;
    }
    setSearchTerm(value);
    setSearchError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* En-tête de la galerie */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Images className="h-16 w-16 text-script-primary" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Galerie des Œuvres
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Découvrez les créations de notre communauté d'auteurs. 
            Scénarios, histoires et BD générés par l'intelligence artificielle.
          </p>
        </div>

        {/* Statistiques */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-script-primary">{scripts.length}</div>
            <div className="text-sm text-slate-600">Œuvres publiées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-script-primary">
              {scripts.reduce((sum, script) => sum + script.view_count, 0)}
            </div>
            <div className="text-sm text-slate-600">Lectures totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-script-primary">
              {scripts.reduce((sum, script) => sum + script.likes_count, 0)}
            </div>
            <div className="text-sm text-slate-600">Likes totaux</div>
          </div>
        </div>

        {/* Alertes de sécurité */}
        {searchError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {searchError}
            </AlertDescription>
          </Alert>
        )}

        {/* Filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher une œuvre, un auteur..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={`pl-9 ${searchError ? 'border-red-300 focus:border-red-500' : ''}`}
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
                <SelectItem value="top_creators">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Créateurs vedettes
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Plus récent
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Plus aimé
                  </div>
                </SelectItem>
                <SelectItem value="views">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Plus vu
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
            <div className="animate-spin h-8 w-8 border-4 border-script-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement de la galerie...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erreur: {error}</p>
          </div>
        ) : filteredAndSortedScripts.length === 0 ? (
          <div className="text-center py-12">
            {scripts.length === 0 ? (
              <>
                <Images className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">Aucune œuvre publiée</h3>
                <p className="text-slate-600">
                  La galerie est encore vide. Soyez le premier à publier votre création !
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
              <GalleryCard
                key={script.id}
                script={script}
                onViewScript={handleViewScript}
                onToggleLike={handleToggleLike}
                authorRank={authorRankMap.get(script.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
