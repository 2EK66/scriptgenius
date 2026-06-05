import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Kind = "comic" | "script" | "episode";

interface Props {
  kind: Kind;
  id: string;
  title?: string;
  trigger?: React.ReactNode;
  onDone?: () => void;
}

const tableFor = (k: Kind) => (k === "comic" ? "comics" : k === "script" ? "scripts" : "episodes");

export const PublishToPremiumDialog = ({ kind, id, title, trigger, onDone }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [priceLater, setPriceLater] = useState(false);

  const reset = () => { setTerms(false); setPrice(""); setPriceLater(false); };

  const handleSubmit = async () => {
    if (!terms) { toast.error("Vous devez accepter les CGU et conditions de vente"); return; }
    const priceVal = priceLater ? null : parseInt(price, 10);
    if (!priceLater && (!priceVal || priceVal < 100)) { toast.error("Prix minimum : 100 XOF"); return; }

    setLoading(true);
    try {
      const table = tableFor(kind);
      const patch: any = {
        is_premium: true,
        is_public: priceLater ? false : true,
        price_xof: priceVal,
        terms_accepted_at: new Date().toISOString(),
      };
      if (kind === "episode") {
        patch.status = priceLater ? "draft" : "published";
        patch.is_free_preview = false;
        patch.published_at = priceLater ? null : new Date().toISOString();
      } else {
        patch.status = priceLater ? "draft" : "published";
      }
      const { error } = await (supabase as any).from(table).update(patch).eq("id", id);
      if (error) throw error;
      toast.success(priceLater ? "Œuvre enregistrée. Définissez un prix pour la mettre en vente." : "Œuvre mise en vente dans la Boutique Premium");
      reset();
      setOpen(false);
      onDone?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de la mise en vente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Crown className="h-4 w-4" /> Mettre en vente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre en vente sur la Boutique Premium</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {title && <p className="text-sm text-muted-foreground">Œuvre : <strong>{title}</strong></p>}

          <div>
            <Label htmlFor="price">Prix de vente (XOF)</Label>
            <Input
              id="price"
              type="number"
              min={100}
              step={50}
              placeholder="Ex: 500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceLater}
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <Checkbox checked={priceLater} onCheckedChange={(v) => setPriceLater(!!v)} />
              Configurer le prix plus tard (œuvre non listée tant que le prix est manquant)
            </label>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
              <span>
                J'accepte les <a href="/terms" target="_blank" className="underline">conditions d'utilisation</a> et de vente de la plateforme, et confirme détenir les droits sur cette œuvre.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={loading || !terms}>{loading ? "Envoi…" : (priceLater ? "Enregistrer" : "Mettre en vente")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishToPremiumDialog;