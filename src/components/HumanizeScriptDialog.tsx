import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

type Intensity = "light" | "medium" | "strong";

interface Props {
  content: string;
  onHumanized: (newContent: string) => void;
  children: React.ReactNode;
}

const HumanizeScriptDialog = ({ content, onHumanized, children }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingStyle, setSavingStyle] = useState(false);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [authorStyle, setAuthorStyle] = useState("");
  const [authorSignature, setAuthorSignature] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("writing_style, writing_signature")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setAuthorStyle(data.writing_style || "");
        setAuthorSignature(data.writing_signature || "");
      }
    })();
  }, [open, user]);

  const handleSaveStyle = async () => {
    if (!user) return;
    setSavingStyle(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({
        writing_style: authorStyle || null,
        writing_signature: authorSignature || null,
      })
      .eq("id", user.id);
    setSavingStyle(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Style enregistré", description: "Ton profil d'écriture est à jour." });
    }
  };

  const handleHumanize = async () => {
    if (!content?.trim()) {
      toast({ title: "Aucun texte à humaniser", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("humanize-script", {
        body: { content, intensity, authorStyle, authorSignature, extraNotes },
      });
      if (error) throw error;
      const humanized = (data as any)?.humanized;
      if (!humanized) throw new Error("Réponse vide");
      onHumanized(humanized);
      toast({
        title: "Version humanisée prête",
        description: "Le scénario a été retravaillé dans ta voix.",
      });
      setOpen(false);
    } catch (e: any) {
      toast({
        title: "Humanisation impossible",
        description: e?.message || "Réessaie dans un instant.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-script-primary" />
            Rendre le scénario plus humain
          </DialogTitle>
          <DialogDescription>
            Réécriture stylistique pour effacer les tournures d'IA et donner à ton scénario
            une voix d'auteur. L'histoire ne change pas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Intensité de la réécriture</Label>
            <RadioGroup value={intensity} onValueChange={(v) => setIntensity(v as Intensity)}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="light" id="light" className="mt-1" />
                <Label htmlFor="light" className="font-normal cursor-pointer">
                  <span className="font-medium">Légère</span> — corrige les tics d'IA, garde la structure.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="medium" id="medium" className="mt-1" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  <span className="font-medium">Moyenne</span> — dialogues vivants, rythme irrégulier.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="strong" id="strong" className="mt-1" />
                <Label htmlFor="strong" className="font-normal cursor-pointer">
                  <span className="font-medium">Forte</span> — voix d'auteur marquée, imperfections assumées.
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Ton style d'écriture</Label>
            <Textarea
              id="style"
              placeholder="Ex : sec, ironique, phrases courtes, peu d'adjectifs, dialogues cassants…"
              value={authorStyle}
              onChange={(e) => setAuthorStyle(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Tics et expressions récurrentes</Label>
            <Textarea
              id="signature"
              placeholder="Ex : phrases nominales, « bref », « et voilà », interruptions par des tirets…"
              value={authorSignature}
              onChange={(e) => setAuthorSignature(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSaveStyle}
                disabled={savingStyle || !user}
              >
                {savingStyle ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                Enregistrer ce profil d'écriture
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes pour cette version (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ex : rendre la scène 3 plus tendue, moins de didascalies…"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleHumanize} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Humanisation…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Humaniser
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HumanizeScriptDialog;