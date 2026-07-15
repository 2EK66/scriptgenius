import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Wand2, Download, Volume2, BookOpen, Sparkles, Lock, FileText, Save, Share, Plus, Trash2, User, Feather } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/use-toast";
import { generateScript, Character } from "@/services/scriptService";
import { exportScriptToPDF } from "@/services/pdfExportService";
import AuthModal from "./AuthModal";
import PublishDialog from "./PublishDialog";
import HumanizeScriptDialog from "./HumanizeScriptDialog";

const ScriptGenerator = () => {
  const { user } = useAuth();
  const { profile, canGenerateScript } = useProfile();
  const { toast } = useToast();
  
  const [genre, setGenre] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [theme, setTheme] = useState("");
  const [customIdea, setCustomIdea] = useState("");
  const [setting, setSetting] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");
  const [plotStructure, setPlotStructure] = useState("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [currentScript, setCurrentScript] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHumanized, setIsHumanized] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour générer un scénario.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerateScript()) {
      toast({
        title: "Limite atteinte",
        description: "Vous avez atteint votre limite de 3 scénarios par jour. Passez à Premium pour un accès illimité !",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await generateScript({
        genre,
        ageRange,
        theme,
        customIdea,
        characters,
        setting,
        tone,
        length,
        plotStructure,
      });

      if (result.success && result.script) {
        setGeneratedScript(result.script.content);
        setCurrentScript(result.script);
        
        toast({
          title: "Scénario généré !",
          description: "Votre scénario a été créé avec succès par l'IA.",
        });
      } else {
        throw new Error(result.error || 'Erreur lors de la génération');
      }

    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération du scénario.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!currentScript) return;
    
    try {
      setIsExporting(true);
      exportScriptToPDF(currentScript);
      toast({
        title: "Export réussi",
        description: "Le scénario a été exporté en PDF avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le scénario en PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveScript = async () => {
    if (!currentScript) return;
    
    try {
      setIsSaving(true);
      // TODO: Implement save to database
      toast({
        title: "Scénario sauvegardé",
        description: "Votre scénario a été sauvegardé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le scénario.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (scriptId: string): Promise<boolean> => {
    // TODO: Implement toggle publish
    return !currentScript?.is_public;
  };

  const handleUpdateSettings = async (scriptId: string, updates: any) => {
    // TODO: Implement update settings
  };

  const addCharacter = () => {
    setCharacters([...characters, {
      name: "",
      age: 25,
      description: "",
      role: ""
    }]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const updateCharacter = (index: number, field: keyof Character, value: string | number) => {
    setCharacters(characters.map((char, i) => 
      i === index ? { ...char, [field]: value } : char
    ));
  };

  const remainingScripts = profile ? (profile.subscription_type === 'premium' ? '∞' : Math.max(0, 3 - profile.scripts_generated_today)) : 0;

  return (
    <section id="generator" className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            🤖 ScriptGenius AI - Mini Assistant IA
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Votre assistant IA spécialisé dans la création de scénarios professionnels. 
            Définissez vos personnages, décors, et instructions détaillées pour obtenir des histoires uniques et captivantes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Configuration avancée */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-script-primary" />
                🤖 Configuration Mini-IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Paramètres de base</TabsTrigger>
                  <TabsTrigger value="characters">Personnages</TabsTrigger>
                  <TabsTrigger value="advanced">Avancé</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
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
                        <SelectItem value="mystery">Mystère</SelectItem>
                        <SelectItem value="action">Action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tranche d'âge</label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Public cible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enfant">Enfant (8-12 ans)</SelectItem>
                        <SelectItem value="adolescent">Adolescent (13-17 ans)</SelectItem>
                        <SelectItem value="jeune-adulte">Jeune adulte (18-25 ans)</SelectItem>
                        <SelectItem value="adulte">Adulte (26-40 ans)</SelectItem>
                        <SelectItem value="senior">Senior (40+ ans)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Thème principal</label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Thème de l'histoire" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="friendship">Amitié</SelectItem>
                        <SelectItem value="family">Famille</SelectItem>
                        <SelectItem value="love">Amour</SelectItem>
                        <SelectItem value="betrayal">Trahison</SelectItem>
                        <SelectItem value="revenge">Vengeance</SelectItem>
                        <SelectItem value="redemption">Rédemption</SelectItem>
                        <SelectItem value="discovery">Découverte</SelectItem>
                        <SelectItem value="survival">Survie</SelectItem>
                        <SelectItem value="justice">Justice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Décor / Environnement</label>
                    <Input
                      placeholder="Ex: Dans un lycée parisien, Sur une île déserte, Dans l'espace..."
                      value={setting}
                      onChange={(e) => setSetting(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="characters" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Personnages</h3>
                    <Button onClick={addCharacter} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un personnage
                    </Button>
                  </div>

                  {characters.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun personnage défini</p>
                      <p className="text-sm">L'IA créera des personnages automatiquement</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {characters.map((character, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">Personnage {index + 1}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeCharacter(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium mb-1">Nom</label>
                              <Input
                                placeholder="Nom du personnage"
                                value={character.name}
                                onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Âge</label>
                              <Input
                                type="number"
                                placeholder="25"
                                value={character.age}
                                onChange={(e) => updateCharacter(index, 'age', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Rôle</label>
                              <Input
                                placeholder="Ex: Héros, Méchant, Ami..."
                                value={character.role}
                                onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Description</label>
                              <Input
                                placeholder="Traits de personnalité..."
                                value={character.description}
                                onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Tonalité du scénario</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez une tonalité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Léger et amusant</SelectItem>
                        <SelectItem value="serious">Sérieux et réfléchi</SelectItem>
                        <SelectItem value="dark">Sombre et intense</SelectItem>
                        <SelectItem value="inspirational">Inspirant et motivant</SelectItem>
                        <SelectItem value="emotional">Émotionnel et touchant</SelectItem>
                        <SelectItem value="suspenseful">Suspense et tension</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Longueur souhaitée</label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue placeholder="Longueur du scénario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Court (500-800 mots)</SelectItem>
                        <SelectItem value="medium">Moyen (800-1200 mots)</SelectItem>
                        <SelectItem value="long">Long (1200-1800 mots)</SelectItem>
                        <SelectItem value="detailed">Très détaillé (1800+ mots)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Structure narrative</label>
                    <Select value={plotStructure} onValueChange={setPlotStructure}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type de structure" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classique (Exposition, Nœud, Dénouement)</SelectItem>
                        <SelectItem value="three-act">Trois actes</SelectItem>
                        <SelectItem value="hero-journey">Voyage du héros</SelectItem>
                        <SelectItem value="circular">Narrative circulaire</SelectItem>
                        <SelectItem value="flashback">Avec flashbacks</SelectItem>
                        <SelectItem value="multiple-pov">Multiples points de vue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Instructions spéciales pour l'IA</label>
                    <Textarea
                      placeholder="Donnez des instructions spécifiques à l'IA : style d'écriture, éléments à inclure, contraintes particulières..."
                      value={customIdea}
                      onChange={(e) => setCustomIdea(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {user ? (
                <Button 
                  onClick={handleGenerate}
              disabled={!genre || !ageRange || !theme || isGenerating || !canGenerateScript()}
                  className="w-full bg-gradient-script text-white py-3 hover:scale-105 transition-transform"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      L'IA travaille sur votre scénario...
                    </>
                  ) : !canGenerateScript() ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Limite atteinte
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Générer avec l'IA
                    </>
                  )}
                </Button>
              ) : (
                <AuthModal>
                  <Button className="w-full bg-gradient-script text-white py-3 hover:scale-105 transition-transform">
                    <Lock className="h-4 w-4 mr-2" />
                    Se connecter pour générer
                  </Button>
                </AuthModal>
              )}

              <div className="text-center text-sm text-slate-500">
                {user ? (
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {profile?.subscription_type === 'premium' ? 'Premium' : 'Version gratuite'}
                    </Badge>
                    <p>
                      {profile?.subscription_type === 'premium' 
                        ? 'Scénarios illimités' 
                        : `${remainingScripts} scénario${remainingScripts !== 1 ? 's' : ''} restant${remainingScripts !== 1 ? 's' : ''} aujourd'hui`
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    <Badge variant="secondary" className="mb-2">Connexion requise</Badge>
                    <p>Connectez-vous pour générer vos scénarios</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résultat */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-script-primary" />
                  Votre scénario IA
                </span>
                {generatedScript && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleSaveScript}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    {currentScript && (
                      <PublishDialog
                        script={currentScript}
                        onTogglePublish={handleTogglePublish}
                        onUpdateSettings={handleUpdateSettings}
                      >
                        <Button size="sm" variant="outline">
                          <Share className="h-4 w-4" />
                        </Button>
                      </PublishDialog>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-script-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">L'IA travaille sur votre scénario...</p>
                    <p className="text-sm text-slate-500 mt-2">Cela peut prendre quelques secondes</p>
                  </div>
                </div>
              ) : generatedScript ? (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border font-mono leading-relaxed max-h-96 overflow-y-auto">
                    {generatedScript}
                  </pre>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-script-primary/10 text-script-primary">
                      Genre: {genre}
                    </Badge>
                    <Badge className="bg-script-secondary/10 text-script-secondary">
                      Âge: {ageRange}
                    </Badge>
                    <Badge className="bg-script-accent/10 text-script-accent">
                      Thème: {theme}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      ✨ Généré par IA
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {user 
                      ? "Configurez vos paramètres et cliquez sur \"Générer avec l'IA\" pour créer votre scénario professionnel."
                      : "Connectez-vous et configurez vos paramètres pour générer votre premier scénario avec l'IA."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ScriptGenerator;
