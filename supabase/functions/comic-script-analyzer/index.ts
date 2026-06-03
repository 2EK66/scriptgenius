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

    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
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

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en découpage de scénarios pour bandes dessinées. Tu réponds uniquement en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    })

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requêtes atteinte. Réessayez plus tard.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits AI épuisés. Veuillez recharger votre espace Lovable AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const t = await aiResp.text()
      console.error('AI gateway error:', aiResp.status, t)
      return new Response(
        JSON.stringify({ error: 'Failed to analyze script' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResp.json()
    let content = aiData.choices?.[0]?.message?.content || ''

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (jsonMatch) {
      content = jsonMatch[1]
    }

    let parsedResult
    try {
      parsedResult = JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        panels: parsedResult.panels || [],
        totalPages: parsedResult.totalPages || 1,
        synopsis: parsedResult.synopsis || ''
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})