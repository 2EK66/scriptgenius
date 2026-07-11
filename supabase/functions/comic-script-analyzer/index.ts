import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { scriptContent, style = 'manga', panelsPerPage = 6 } = await req.json()

    if (!scriptContent) {
      return new Response(
        JSON.stringify({ error: 'Script content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Remplacement par la clé d'API officielle de Gemini / Google AI Studio
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration de la clé API Gemini manquante' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const styleGuides = {
      manga: 'Style manga japonais avec lignes dynamiques et expressions exagérées',
      comics: 'Style comics américain avec couleurs vives et action spectaculaire',
      european: 'Style BD européenne avec détails réalistes et couleurs douces',
      cartoon: 'Style cartoon coloré et expressif avec formes simplifiées',
      realistic: 'Style réaliste avec proportions naturelles et éclairage cinématographique'
    }

    const prompt = `Tu es un expert en découpage de scénarios pour bandes dessinées.

MISSION: Analyser ce scénario et le découper en panels de BD cohérents.

SCÉNARIO:
${scriptContent}

STYLE VISUEL: ${styleGuides[style as keyof typeof styleGuides] || styleGuides.manga}

CONTRAINTES:
- Maximum ${panelsPerPage} panels par page
- COUVRIR L'INTÉGRALITÉ DU SCÉNARIO — ne rien omettre, du début à la fin
- Pour un long script, générer autant de panels/pages que nécessaire (30, 50, 100+ panels si besoin)
- Chaque scène, chaque dialogue important doit avoir son panel
- Chaque panel doit avoir une composition visuelle claire
- Équilibrer dialogues et action visuelle
- Maintenir la continuité narrative

FORMAT DE SORTIE (JSON strict):
{
  "panels": [
    {
      "panelNumber": 1,
      "visualDescription": "Description détaillée de la scène: personnages, décor, angle de vue, composition, éclairage",
      "dialogue": "Texte du dialogue ou narration",
      "characters": ["Liste des personnages présents"],
      "action": "Description de l'action principale",
      "cameraAngle": "plan large/plan américain/gros plan/etc.",
      "mood": "Ambiance: joyeux/tendu/dramatique/etc."
    }
  ],
  "totalPages": 4,
  "synopsis": "Résumé du scénario découpé"
}

IMPORTANT: 
- Descriptions visuelles TRÈS détaillées pour la génération d'images
- Cohérence des personnages entre les panels
- Spécifier l'apparence des personnages (vêtements, traits, couleurs)
- Décrire précisément le décor et l'ambiance

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

    // Appel direct au endpoint de compatibilité OpenAI de Google AI Studio
    const aiResp = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${geminiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en découpage de scénarios pour bandes dessinées. Tu réponds uniquement en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 16384,
        temperature: 0.7,
        // Force Gemini à structurer la réponse en JSON natif
        response_format: { type: "json_object" }
      }),
    })

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez plus tard.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const t = await aiResp.text()
      console.error('Gemini API error:', aiResp.status, t)
      return new Response(
        JSON.stringify({ error: 'Failed to analyze script via Gemini' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResp.json()
    let content = aiData.choices?.[0]?.message?.content || ''

    // Extraction de secours si le modèle a quand même inclus des blocs de code Markdown
    const jsonMatch = content.match(/
http://googleusercontent.com/immersive_entry_chip/0

*Note : N'oubliez pas d'ajouter la variable d'environnement `GEMINI_API_KEY` dans votre tableau de bord Supabase (avec votre clé obtenue sur Google AI Studio) à la place de l'ancienne clé Lovable.*
