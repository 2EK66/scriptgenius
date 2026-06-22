import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, Image, Download, Loader2 } from 'lucide-react';
import { analyzeScriptForComic, generateAllPanelImages, ComicPanel } from '@/services/comicCreationService';
import { useScripts } from '@/hooks/useScripts';
import jsPDF from 'jspdf';
import { ComicPublishDialog } from './ComicPublishDialog';

export const ComicCreator = () => {
  const { scripts, loading: loadingScripts } = useScripts();
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [scriptContent, setScriptContent] = useState('');
  const [style, setStyle] = useState('manga');
  const [panelsPerPage, setPanelsPerPage] = useState(6);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [panels, setPanels] = useState<ComicPanel[]>([]);
  const [synopsis, setSynopsis] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleScriptSelect = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    const selectedScript = scripts?.find(s => s.id === scriptId);
    if (selectedScript) {
      setScriptContent(selectedScript.content);
      toast.success(`Scénario "${selectedScript.title}" chargé`);
    }
  };

  const createCoverPage = (title: string, author: string): ComicPanel => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;

    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titre
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    const titleY = canvas.height / 2 - 100;
    ctx.fillText(title, canvas.width / 2, titleY);

    // Ligne décorative
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, titleY + 40);
    ctx.lineTo(canvas.width - 100, titleY + 40);
    ctx.stroke();

    // Auteur
    ctx.font = '32px Arial';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`Par ${author}`, canvas.width / 2, titleY + 120);

    // Date
    ctx.font = '24px Arial';
    ctx.fillStyle = '#9ca3af';
    const date = new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(date, canvas.width / 2, canvas.height - 100);

    return {
      panelNumber: 0,
      visualDescription: 'Page de couverture',
      dialogue: '',
      characters: [],
      action: 'Page titre',
      cameraAngle: 'front',
      mood: 'neutre',
      imageUrl: canvas.toDataURL('image/png')
    };
  };

  const handleAnalyze = async () => {
    if (!scriptContent.trim()) {
      toast.error('Veuillez entrer un scénario');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeScriptForComic(scriptContent, style, panelsPerPage);
      
      // Créer la page de couverture
      const title = scripts?.find(s => s.id === selectedScriptId)?.title || 'Ma Bande Dessinée';
      const author = 'Auteur'; // On peut améliorer ça plus tard avec le nom de l'utilisateur
      const coverPage = createCoverPage(title, author);
      
      // Ajouter la couverture en premier et renuméroter les autres panels
      const numberedPanels = result.panels.map(p => ({
        ...p,
        panelNumber: p.panelNumber + 1
      }));
      
      setPanels([coverPage, ...numberedPanels]);
      setSynopsis(result.synopsis);
      toast.success(`Scénario analysé ! ${numberedPanels.length + 1} panels créés (avec couverture) sur ${result.totalPages + 1} pages`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Erreur lors de l\'analyse du scénario');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImages = async () => {
    if (panels.length === 0) {
      toast.error('Veuillez d\'abord analyser un scénario');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const updatedPanels = await generateAllPanelImages(
        panels,
        style,
        (current, total) => {
          setGenerationProgress((current / total) * 100);
        }
      );
      
      setPanels(updatedPanels);
      toast.success('Toutes les images ont été générées !');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Erreur lors de la génération des images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (panels.length === 0 || !panels.some(p => p.imageUrl)) {
      toast.error('Aucune image à exporter');
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const cols = 2;
    const rows = 3;
    const panelW = (pageWidth - margin * (cols + 1)) / cols;
    const panelH = (pageHeight - margin * (rows + 1)) / rows;
    const perPage = cols * rows;

    let col = 0;
    let row = 0;
    let panelsOnPage = 0;

    panels.forEach((panel) => {
      if (!panel.imageUrl) return;

      if (panelsOnPage > 0 && panelsOnPage % perPage === 0) {
        pdf.addPage();
        col = 0;
        row = 0;
        panelsOnPage = 0;
      }

      const x = margin + col * (panelW + margin);
      const y = margin + row * (panelH + margin);

      try {
        const fmt = panel.imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(panel.imageUrl, fmt, x, y, panelW, panelH);
      } catch (e) {
        pdf.setFillColor(220, 220, 220);
        pdf.rect(x, y, panelW, panelH, 'F');
      }

      // Bordure
      pdf.setDrawColor(30, 30, 30);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, panelW, panelH);

      col++;
      if (col >= cols) { col = 0; row++; }
      panelsOnPage++;
    });

    pdf.save('scriptgenius-bd.pdf');
    toast.success('BD exportée en PDF !');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Créateur de BD
            </CardTitle>
            <CardDescription>
              Transformez vos scénarios en bandes dessinées avec l'IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="script-select">Charger un scénario existant</Label>
              <Select value={selectedScriptId} onValueChange={handleScriptSelect}>
                <SelectTrigger id="script-select" className="mt-2 bg-background z-50">
                  <SelectValue placeholder="Choisir un scénario de votre bibliothèque..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {loadingScripts ? (
                    <SelectItem value="loading" disabled>Chargement des scénarios...</SelectItem>
                  ) : scripts && scripts.length > 0 ? (
                    scripts.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title} - {s.genre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>Aucun scénario disponible</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="script">Ou collez votre scénario</Label>
              <Textarea
                id="script"
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Collez votre scénario ici..."
                rows={8}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Style visuel</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manga">Manga (Japonais)</SelectItem>
                    <SelectItem value="comics">Comics (Américain)</SelectItem>
                    <SelectItem value="european">BD Européenne</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="realistic">Réaliste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="panels">Panels par page</Label>
                <Input
                  id="panels"
                  type="number"
                  min={4}
                  max={9}
                  value={panelsPerPage}
                  onChange={(e) => setPanelsPerPage(Number(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !scriptContent.trim()}>
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                Analyser le scénario
              </Button>

              <Button 
                onClick={handleGenerateImages} 
                disabled={isGenerating || panels.length === 0}
                variant="secondary"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Image className="w-4 h-4 mr-2" />}
                Générer les images
              </Button>

              <Button 
                onClick={handleExportPDF} 
                disabled={!panels.some(p => p.imageUrl)}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>

              {panels.some(p => p.imageUrl) && (
                <ComicPublishDialog
                  comic={{
                    title: scripts?.find(s => s.id === selectedScriptId)?.title || 'Ma BD',
                    panels: panels.filter(p => p.imageUrl).map(p => ({
                      id: p.panelNumber.toString(),
                      description: p.visualDescription,
                      imageUrl: p.imageUrl,
                      dialogue: p.dialogue
                    })),
                    artStyle: style
                  }}
                  onPublished={() => {
                    toast.success('Vous pouvez maintenant promouvoir votre BD en premium!');
                  }}
                />
              )}
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={generationProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Génération en cours... {Math.round(generationProgress)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {synopsis && (
          <Card>
            <CardHeader>
              <CardTitle>Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{synopsis}</p>
            </CardContent>
          </Card>
        )}

        {panels.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Panels ({panels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {panels.map((panel) => (
                  <Card key={panel.panelNumber}>
                    <CardHeader>
                      <CardTitle className="text-sm">Panel {panel.panelNumber}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{panel.cameraAngle}</Badge>
                        <Badge variant="secondary">{panel.mood}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {panel.imageUrl ? (
                        <img src={panel.imageUrl} alt={`Panel ${panel.panelNumber}`} className="w-full rounded-lg" />
                      ) : (
                        <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Image className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{panel.visualDescription}</p>
                      {panel.dialogue && (
                        <p className="text-sm italic border-l-2 border-primary pl-2">"{panel.dialogue}"</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
