import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Lock, Globe, Crown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const seriesId = searchParams.get("seriesId");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(comic.title);
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public" | "premium">("private");
  const [price, setPrice] = useState<string>("");
  const [terms, setTerms] = useState(false);

  const handlePublish = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour publier");
      return;
    }

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (visibility === "premium") {
      if (!terms) { toast.error("Vous devez accepter les CGU et conditions de vente"); return; }
      const p = parseInt(price, 10);
      if (!p || p < 100) { toast.error("Prix minimum : 100 XOF"); return; }
    }

    setLoading(true);

    try {
      if (seriesId) {
        // Publish as a new episode of the series
        const { count } = await supabase
          .from("episodes" as any)
          .select("id", { count: "exact", head: true })
          .eq("series_id", seriesId);

        const nextNumber = (count || 0) + 1;
        const published = visibility !== "private";
        const status = published ? "published" : "draft";
        const isPremium = visibility === "premium";

        const { error } = await supabase.from("episodes" as any).insert({
          series_id: seriesId,
          episode_number: nextNumber,
          title: title.trim(),
          comic_panels: comic.panels as any,
          status,
          published_at: published ? new Date().toISOString() : null,
          is_premium: isPremium,
          price_xof: isPremium ? parseInt(price, 10) : null,
        });
        if (error) throw error;

        toast.success(
          visibility === "private"
            ? `Épisode ${nextNumber} sauvegardé dans votre espace privé`
            : visibility === "public"
            ? `Épisode ${nextNumber} publié dans la galerie !`
            : `Épisode ${nextNumber} mis en vente sur la Boutique Premium`
        );
      } else {
        const isPremium = visibility === "premium";
        const isPublic = visibility !== "private";
        const { error } = await (supabase as any).from("comics").insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          art_style: comic.artStyle || null,
          comic_panels: comic.panels as any,
          is_public: isPublic,
          is_premium: isPremium,
          price_xof: isPremium ? parseInt(price, 10) : null,
          terms_accepted_at: isPremium ? new Date().toISOString() : null,
          status: isPublic ? "published" : "draft",
        });
        if (error) throw error;

        toast.success(
          visibility === "private"
            ? "BD sauvegardée dans votre espace privé"
            : visibility === "public"
            ? "BD publiée dans la galerie !"
            : "BD mise en vente sur la Boutique Premium"
        );
      }

      setOpen(false);
      onPublished?.();
      if (visibility === "private") navigate("/workplace");
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
          {seriesId ? "Sauvegarder comme épisode" : "Sauvegarder la BD"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {seriesId ? "Enregistrer comme épisode de série" : "Enregistrer votre Bande Dessinée"}
          </DialogTitle>
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

          <div className="space-y-2">
            <Label>Que faire de cette œuvre ?</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)} className="grid gap-2">
              <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem value="private" id="v-private" className="mt-1" />
                <div>
                  <div className="font-medium flex items-center gap-2"><Lock className="h-4 w-4" /> Garder privé (recommandé)</div>
                  <p className="text-xs text-muted-foreground">Visible uniquement dans Mon Espace de Travail. Vous pourrez publier plus tard.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem value="public" id="v-public" className="mt-1" />
                <div>
                  <div className="font-medium flex items-center gap-2"><Globe className="h-4 w-4" /> Publier dans la galerie publique</div>
                  <p className="text-xs text-muted-foreground">Gratuit, visible par tous les lecteurs.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40">
                <RadioGroupItem value="premium" id="v-premium" className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Mettre en vente (Boutique Premium)</div>
                  <p className="text-xs text-muted-foreground">Œuvre payante listée dans la boutique.</p>
                  {visibility === "premium" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <Label htmlFor="price">Prix (XOF)</Label>
                        <Input id="price" type="number" min={100} step={50} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 500" />
                      </div>
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
                        <span>J'accepte les <a href="/terms" target="_blank" className="underline">conditions d'utilisation et de vente</a> et confirme détenir les droits sur cette œuvre.</span>
                      </label>
                    </div>
                  )}
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
