import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface ComicPublishDialogProps {
  comic: {
    title: string;
    panels: Array<{
      id: string;
      description: string;
      imageUrl: string;
      dialogue?: string;
    }>;
    artStyle: string;
  };
  onPublished?: () => void;
}

export const ComicPublishDialog = ({ comic, onPublished }: ComicPublishDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(comic.title);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [allowSharing, setAllowSharing] = useState(true);

  const handlePublish = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour publier");
      return;
    }

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("comics")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          genre: genre.trim() || null,
          art_style: comic.artStyle,
          panels: comic.panels,
          is_public: isPublic,
          allow_social_sharing: allowSharing,
          status: 'published'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(isPublic ? "BD publiée avec succès!" : "BD sauvegardée avec succès!");
      setOpen(false);
      onPublished?.();
    } catch (error) {
      console.error("Erreur lors de la publication:", error);
      toast.error("Erreur lors de la publication de la BD");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Publier la BD
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publier votre Bande Dessinée</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre à votre BD"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre BD..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ex: Aventure, Science-fiction, Fantaisie..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="isPublic">BD publique</Label>
              <p className="text-sm text-muted-foreground">
                Rendre visible dans la galerie publique
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowSharing">Autoriser le partage</Label>
              <p className="text-sm text-muted-foreground">
                Permettre le partage sur les réseaux sociaux
              </p>
            </div>
            <Switch
              id="allowSharing"
              checked={allowSharing}
              onCheckedChange={setAllowSharing}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? "Publication..." : "Publier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
