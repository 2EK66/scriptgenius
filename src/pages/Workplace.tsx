import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Film, Palette, Plus, Lock, Globe, Crown, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PublishToGalleryDialog from "@/components/PublishToGalleryDialog";
import PublishToPremiumDialog from "@/components/PublishToPremiumDialog";

type Row = any;

function StatusBadge({ row, isEpisode }: { row: Row; isEpisode?: boolean }) {
  if (row.is_premium) return <Badge className="bg-amber-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
  const published = isEpisode ? row.status === "published" : row.is_public;
  if (published) return <Badge className="bg-emerald-500 text-white"><Globe className="h-3 w-3 mr-1" />Public</Badge>;
  return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Privé</Badge>;
}

const Workplace = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scripts, setScripts] = useState<Row[]>([]);
  const [comics, setComics] = useState<Row[]>([]);
  const [series, setSeries] = useState<Row[]>([]);
  const [episodes, setEpisodes] = useState<Row[]>([]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, c, sr] = await Promise.all([
        supabase.from("scripts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("comics").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("series").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setScripts(s.data || []);
      setComics(c.data || []);
      setSeries(sr.data || []);
      const seriesIds = (sr.data || []).map((x: any) => x.id);
      if (seriesIds.length) {
        const { data: eps } = await (supabase as any).from("episodes").select("*").in("series_id", seriesIds).order("episode_number");
        setEpisodes(eps || []);
      } else setEpisodes([]);
    } catch (e: any) {
      toast.error(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const makePrivate = async (kind: "scripts" | "comics" | "series" | "episodes", id: string) => {
    const patch: any = { is_public: false, is_premium: false };
    if (kind !== "series") patch.status = "draft";
    if (kind === "episodes") { patch.is_free_preview = false; patch.published_at = null; delete patch.is_premium; }
    const { error } = await (supabase as any).from(kind).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Repassé en privé");
    fetchAll();
  };

  const remove = async (kind: "scripts" | "comics" | "series" | "episodes", id: string) => {
    if (!confirm("Supprimer définitivement ?")) return;
    const { error } = await (supabase as any).from(kind).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    fetchAll();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Chargement…</div>;
  if (!user) return <Navigate to="/" replace />;

  const renderActions = (
    kind: "comic" | "script" | "episode" | "series",
    row: Row,
    table: "comics" | "scripts" | "episodes" | "series",
  ) => (
    <div className="flex flex-wrap gap-2">
      {kind !== "series" && (
        <PublishToPremiumDialog kind={kind} id={row.id} title={row.title} onDone={fetchAll} />
      )}
      <PublishToGalleryDialog kind={kind} id={row.id} title={row.title} onDone={fetchAll} />
      <Button size="sm" variant="ghost" onClick={() => makePrivate(table, row.id)}>
        <Lock className="h-4 w-4 mr-1" /> Privé
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(table, row.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const Empty = ({ label, to }: { label: string; to: string }) => (
    <div className="text-center py-12 border-2 border-dashed rounded-lg">
      <p className="text-muted-foreground mb-4">Aucune œuvre — toutes vos créations restent privées ici.</p>
      <Button asChild><Link to={to}><Plus className="h-4 w-4 mr-2" />{label}</Link></Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/40">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Mon Espace de Travail</h1>
            <p className="text-slate-600">Vos œuvres sont privées par défaut. Choisissez quand les publier.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/scripts"><BookOpen className="h-4 w-4 mr-1" />Nouveau scénario</Link></Button>
            <Button asChild variant="outline"><Link to="/comic-generator"><Palette className="h-4 w-4 mr-1" />Nouvelle BD</Link></Button>
            <Button asChild><Link to="/series/create"><Film className="h-4 w-4 mr-1" />Nouvelle série</Link></Button>
          </div>
        </div>

        <Tabs defaultValue="comics">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="comics">BD ({comics.length})</TabsTrigger>
            <TabsTrigger value="series">Séries ({series.length})</TabsTrigger>
            <TabsTrigger value="scripts">Scénarios ({scripts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="comics" className="mt-6 space-y-3">
            {loading ? <p>Chargement…</p> : comics.length === 0 ? <Empty label="Créer ma première BD" to="/comic-generator" /> :
              comics.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-lg">{c.title}</CardTitle>
                      <StatusBadge row={c} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-1">{c.description || "Sans description"}</p>
                    {renderActions("comic", c, "comics")}
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          <TabsContent value="series" className="mt-6 space-y-6">
            {loading ? <p>Chargement…</p> : series.length === 0 ? <Empty label="Créer ma première série" to="/series/create" /> :
              series.map((s) => {
                const eps = episodes.filter((e) => e.series_id === s.id);
                return (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <CardTitle className="text-lg">{s.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{eps.length} épisode(s)</p>
                        </div>
                        <StatusBadge row={s} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline"><Link to={`/series/${s.id}/manage`}>Gérer la série</Link></Button>
                        <PublishToGalleryDialog kind="series" id={s.id} title={s.title} onDone={fetchAll} />
                        <Button size="sm" variant="ghost" onClick={() => makePrivate("series", s.id)}><Lock className="h-4 w-4 mr-1" />Privé</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove("series", s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      {eps.length > 0 && (
                        <div className="border-t pt-3 space-y-2">
                          {eps.map((e) => (
                            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Ép. {e.episode_number}</Badge>
                                <span className="text-sm font-medium">{e.title || "Sans titre"}</span>
                                <StatusBadge row={e} isEpisode />
                                {e.is_free_preview && <Badge className="bg-sky-500 text-white">Extrait gratuit</Badge>}
                              </div>
                              {renderActions("episode", e, "episodes")}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            }
          </TabsContent>

          <TabsContent value="scripts" className="mt-6 space-y-3">
            {loading ? <p>Chargement…</p> : scripts.length === 0 ? <Empty label="Générer un scénario" to="/scripts" /> :
              scripts.map((s) => (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-3">
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                      <StatusBadge row={s} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{s.genre} · {s.word_count || 0} mots</p>
                    {renderActions("script", s, "scripts")}
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Workplace;