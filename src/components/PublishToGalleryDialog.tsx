import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Kind = "comic" | "script" | "series" | "episode";

interface Props {
  kind: Kind;
  id: string;
  title?: string;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

const tableFor = (k: Kind) => (k === "comic" ? "comics" : k === "script" ? "scripts" : k === "series" ? "series" : "episodes");

export const PublishToGalleryDialog = ({ kind, id, title, trigger, onDone }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [freePreview, setFreePreview] = useState(kind === "episode");

  const handlePublish = async () => {
    setLoading(true);
    try {
      const table = tableFor(kind);
      const patch: any = {
        is_public: true,
        is_premium: false,
        status: "published",
        published_at: new Date().toISOString(),
      };
      if (kind === "series") delete patch.status;
      if (kind === "episode") patch.is_free_preview = freePreview;
      if (kind !== "episode") delete patch.published_at;

      const { error } = await (supabase as any).from(table).update(patch).eq("id", id);
      if (error) throw error;
      toast.success("Œuvre publiée dans la galerie publique");
      setOpen(false);
      onDone?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur de publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" /> Publier en galerie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publier dans la galerie publique</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {title ? <strong>{title}</strong> : "Cette œuvre"} sera visible gratuitement par tous les lecteurs dans la galerie publique.
          </p>
          {kind === "episode" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Marquer comme extrait gratuit</Label>
                <p className="text-xs text-muted-foreground">Mis en avant pour donner envie de lire la suite.</p>
              </div>
              <Switch checked={freePreview} onCheckedChange={setFreePreview} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handlePublish} disabled={loading}>{loading ? "Publication…" : "Publier"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishToGalleryDialog;