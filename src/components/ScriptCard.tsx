
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpen, Calendar, FileText, MoreVertical, Trash2, Eye, Download, Globe, Lock } from "lucide-react";
import { Script } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";
import { exportScriptToPDF } from "@/services/pdfExportService";
import PublishDialog from "@/components/PublishDialog";

interface ScriptCardProps {
  script: Script;
  onDelete: (scriptId: string) => Promise<void>;
  onUpdate: (scriptId: string, updates: Partial<Script>) => Promise<void>;
  onTogglePublish?: (scriptId: string) => Promise<boolean>;
}

const ScriptCard = ({ script, onDelete, onUpdate, onTogglePublish }: ScriptCardProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(script.id);
      toast({
        title: "Scénario supprimé",
        description: "Le scénario a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le scénario.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      exportScriptToPDF(script);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
            {script.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="h-4 w-4 mr-2" />
                    Lire
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{script.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{script.genre}</Badge>
                      <Badge variant="outline">{script.age_range}</Badge>
                      <Badge variant="outline">{script.theme}</Badge>
                      <Badge variant={getStatusBadgeVariant(script.status)}>
                        {getStatusLabel(script.status)}
                      </Badge>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border font-mono leading-relaxed">
                      {script.content}
                    </pre>
                  </div>
                </DialogContent>
              </Dialog>
              
              {onTogglePublish && (
                <PublishDialog 
                  script={script} 
                  onTogglePublish={onTogglePublish}
                  onUpdateSettings={onUpdate}
                >
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    {script.is_public ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Dépublier
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-2" />
                        Publier dans la galerie
                      </>
                    )}
                  </DropdownMenuItem>
                </PublishDialog>
              )}
              
              <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
                <FileText className="h-4 w-4 mr-2" />
                {isExporting ? 'Export en cours...' : 'Exporter en PDF'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Télécharger (TXT)
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {script.genre}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.age_range}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.theme}
          </Badge>
          <Badge variant={getStatusBadgeVariant(script.status)} className="text-xs">
            {getStatusLabel(script.status)}
          </Badge>
          {script.is_public && (
            <Badge variant="default" className="text-xs bg-green-600">
              <Globe className="h-3 w-3 mr-1" />
              Public
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(script.created_at)}
          </div>
          {script.word_count && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              {script.word_count} mots
            </div>
          )}
        </div>

        {script.custom_idea && (
          <p className="text-sm text-slate-600 italic line-clamp-2">
            "{script.custom_idea}"
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ScriptCard;
