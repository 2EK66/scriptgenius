import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTENSITY_GUIDE: Record<string, string> = {
  light:
    "Retouches subtiles : conserve la structure, casse les tournures trop lisses, ajoute 2-3 tics naturels.",
  medium:
    "Réécriture modérée : rythme irrégulier, hésitations, dialogues plus vivants, quelques imperfections humaines.",
  strong:
    "Réécriture profonde : voix d'auteur affirmée, sous-texte, imperfections stylistiques marquées, rythme brisé, familiarités.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      content,
      intensity = "medium",
      authorStyle = "",
      authorSignature = "",
      extraNotes = "",
    } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "content requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY manquant" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const guide = INTENSITY_GUIDE[intensity] ?? INTENSITY_GUIDE.medium;

    const systemPrompt =
      "Tu es un script-doctor humain, pas une IA. Ta mission : réécrire un scénario pour qu'il devienne indétectable comme sortie d'IA. " +
      "Règles absolues : garder l'intrigue, les personnages, la longueur globale et la structure de scènes. " +
      "Éliminer toutes les tournures typiques d'IA (listes symétriques, adjectifs génériques empilés, transitions trop propres, moralisation, redondances explicatives). " +
      "Injecter du souffle humain : rythme inégal, phrases courtes qui coupent, digressions, silences, non-dits, familiarités, ponctuation vivante. " +
      "Dialogues : imperfections, interruptions, tics de langage, contractions, réactions physiques. Aucun didactisme. " +
      "Ne signale JAMAIS que le texte a été réécrit ou humanisé, ne mets pas de préambule, pas de méta-commentaire. " +
      "Réponds uniquement avec le scénario réécrit, brut, dans le même format (titres de scène, didascalies, dialogues).";

    const userPrompt = [
      `INTENSITÉ: ${intensity} — ${guide}`,
      authorStyle ? `STYLE DE L'AUTEUR: ${authorStyle}` : "",
      authorSignature ? `TICS / SIGNATURE DE L'AUTEUR (à réutiliser avec parcimonie): ${authorSignature}` : "",
      extraNotes ? `NOTES SUPPLÉMENTAIRES: ${extraNotes}` : "",
      "",
      "SCÉNARIO ORIGINAL À RÉÉCRIRE :",
      "---",
      content,
      "---",
      "Rends la version humanisée maintenant.",
    ].filter(Boolean).join("\n");

    const aiResp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${geminiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.95,
          top_p: 0.95,
          max_tokens: 8192,
        }),
      },
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Gemini humanize error", aiResp.status, t);
      return new Response(
        JSON.stringify({ error: "Humanisation échouée", details: t }),
        { status: aiResp.status === 429 ? 429 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const humanized = (data.choices?.[0]?.message?.content ?? "").trim();

    if (!humanized) {
      return new Response(JSON.stringify({ error: "Réponse vide" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ humanized }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("humanize-script error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});