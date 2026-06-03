
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Share2 } from "lucide-react";
import { Script } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

interface PublishDialogProps {
  script: Script;
  onTogglePublish: (scriptId: string) => Promise<boolean>;
  onUpdateSettings: (scriptId: string, updates: Partial<Script>) => Promise<void>;
  children: React.ReactNode;
}

const PublishDialog = ({ script, onTogglePublish, onUpdateSettings, children }: PublishDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [allowSocialSharing, setAllowSocialSharing] = useState(script.allow_social_sharing || false);
  const [open, setOpen] = useState(false);

  const handleTogglePublish = async () => {
    try {
      setIsLoading(true);
      const newStatus = await onTogglePublish(script.id);
      
      toast({
        title: newStatus ? "Œuvre publiée !" : "Œuvre dépubliée",
        description: newStatus 
          ? "Votre œuvre est maintenant visible dans la galerie publique." 
          : "Votre œuvre a été retirée de la galerie publique.",
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de publication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSocialSharing = async (enabled: boolean) => {
    try {
      setAllowSocialSharing(enabled);
      await onUpdateSettings(script.id, { allow_social_sharing: enabled });
      
      toast({
        title: "Paramètres mis à jour",
        description: enabled 
          ? "Le partage social est maintenant autorisé." 
          : "Le partage social a été désactivé.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {script.is_public ? (
              <>
                <Globe className="h-5 w-5 text-green-600" />
                Œuvre publiée
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-gray-600" />
                Œuvre privée
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {script.is_public 
              ? "Votre œuvre est visible dans la galerie publique. Vous pouvez la dépublier à tout moment."
              : "Votre œuvre est privée. Publiez-la pour la partager avec la communauté."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  {script.is_public ? "Dépublier l'œuvre" : "Publier l'œuvre"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {script.is_public 
                    ? "Retirer cette œuvre de la galerie publique"
                    : "Rendre cette œuvre visible dans la galerie publique"
                  }
                </p>
              </div>
              <Button 
                onClick={handleTogglePublish}
                disabled={isLoading}
                variant={script.is_public ? "destructive" : "default"}
                size="sm"
              >
                {isLoading ? "..." : (script.is_public ? "Dépublier" : "Publier")}
              </Button>
            </div>

            {script.is_public && (
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="social-sharing" className="text-sm font-medium flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Partage social
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Autoriser les autres à partager votre œuvre sur les réseaux sociaux
                  </p>
                </div>
                <Switch
                  id="social-sharing"
                  checked={allowSocialSharing}
                  onCheckedChange={handleUpdateSocialSharing}
                />
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Note :</strong> Seuls vous pouvez télécharger et exporter vos œuvres.</p>
              <p>Les autres utilisateurs peuvent uniquement les lire et les apprécier.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
