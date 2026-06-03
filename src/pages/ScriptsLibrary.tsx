import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, BookOpen, Filter, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useScripts } from "@/hooks/useScripts";
import { exportMultipleScriptsToPDF } from "@/services/pdfExportService";
import { useToast } from "@/components/ui/use-toast";
import ScriptCard from "@/components/ScriptCard";
import AuthModal from "@/components/AuthModal";
import Header from "@/components/Header";
import { Link } from "react-router-dom";

const ScriptsLibrary = () => {
  const { user } = useAuth();
  const { scripts, loading, error, deleteScript, updateScript, togglePublishScript } = useScripts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedScripts, setSelectedScripts] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (script.custom_idea && script.custom_idea.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesGenre = filterGenre === "all" || script.genre === filterGenre;
    const matchesStatus = filterStatus === "all" || script.status === filterStatus;
    
    return matchesSearch && matchesGenre && matchesStatus;
  });

  const genres = [...new Set(scripts.map(script => script.genre))];
  const statuses = [...new Set(scripts.map(script => script.status))];

  const handleSelectScript = (scriptId: string, checked: boolean) => {
    if (checked) {
      setSelectedScripts([...selectedScripts, scriptId]);
    } else {
      setSelectedScripts(selectedScripts.filter(id => id !== scriptId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScripts(filteredScripts.map(script => script.id));
    } else {
      setSelectedScripts([]);
    }
  };

  const handleExportSelected = async () => {
    if (selectedScripts.length === 0) {
      toast({
        title: "Aucun scénario sélectionné",
        description: "Veuillez sélectionner au moins un scénario à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      const scriptsToExport = scripts.filter(script => selectedScripts.includes(script.id));
      exportMultipleScriptsToPDF(scriptsToExport);
      toast({
        title: "Export réussi",
        description: `${selectedScripts.length} scénario${selectedScripts.length > 1 ? 's' : ''} exporté${selectedScripts.length > 1 ? 's' : ''} en PDF.`,
      });
      setSelectedScripts([]);
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les scénarios en PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-script-primary" />
            <h1 className="text-3xl font-bold mb-4">Ma Bibliothèque de Scénarios</h1>
            <p className="text-lg text-slate-600 mb-8">
              Connectez-vous pour accéder à tous vos scénarios générés par l'IA
            </p>
            <AuthModal>
              <Button size="lg" className="bg-gradient-script text-white">
                Se connecter
              </Button>
            </AuthModal>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Ma Bibliothèque de Scénarios
              </h1>
              <p className="text-slate-600">
                {scripts.length} scénario{scripts.length !== 1 ? 's' : ''} généré{scripts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedScripts.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleExportSelected}
                  disabled={isExporting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isExporting ? 'Export...' : `Exporter ${selectedScripts.length} PDF`}
                </Button>
              )}
              <Link to="/#generator">
                <Button className="bg-gradient-script text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau scénario
                </Button>
              </Link>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher dans vos scénarios..."
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status === 'draft' ? 'Brouillon' : 
                       status === 'published' ? 'Publié' : 
                       status === 'archived' ? 'Archivé' : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sélection multiple */}
          {filteredScripts.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedScripts.length === filteredScripts.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Tout sélectionner ({filteredScripts.length})
                </label>
              </div>
              {selectedScripts.length > 0 && (
                <Badge variant="secondary">
                  {selectedScripts.length} sélectionné{selectedScripts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}

          {/* Statistiques rapides */}
          {scripts.length > 0 && (
            <div className="flex gap-4 mb-6">
              <Badge variant="outline" className="px-3 py-1">
                Total: {scripts.length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Brouillons: {scripts.filter(s => s.status === 'draft').length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Publiés: {scripts.filter(s => s.status === 'published').length}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                En galerie: {scripts.filter(s => s.is_public).length}
              </Badge>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-script-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement de vos scénarios...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Erreur: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-12">
            {scripts.length === 0 ? (
              <>
                <BookOpen className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">Aucun scénario généré</h3>
                <p className="text-slate-600 mb-6">
                  Commencez par générer votre premier scénario avec l'IA
                </p>
                <Link to="/#generator">
                  <Button className="bg-gradient-script text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer mon premier scénario
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
                <p className="text-slate-600">
                  Aucun scénario ne correspond à vos critères de recherche
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScripts.map(script => (
              <div key={script.id} className="relative">
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedScripts.includes(script.id)}
                    onCheckedChange={(checked) => handleSelectScript(script.id, checked as boolean)}
                    className="bg-white shadow-sm"
                  />
                </div>
                <ScriptCard
                  script={script}
                  onDelete={deleteScript}
                  onUpdate={updateScript}
                  onTogglePublish={togglePublishScript}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptsLibrary;
