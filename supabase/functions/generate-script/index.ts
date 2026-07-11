import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction utilitaire d'appel avec Exponential Backoff (jusqu'à 5 essais)
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Si erreur de quota (429) ou erreur serveur (>=500), on retente
    if (!response.ok && (response.status === 429 || response.status >= 500) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    // Client utilisateur — uniquement pour vérifier l'auth de l'utilisateur connecté
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Client admin — pour contourner les politiques RLS restrictives de l'écriture de profils/compteurs
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { genre, ageRange, theme, customIdea, characters, setting, length } = await req.json()

    // Lecture ou création du profil utilisateur via le client admin
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles').select('*').eq('id', user.id).single()

    if (profileError || !profile) {
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          subscription_type: 'free',
          scripts_generated_today: 0,
          scripts_generated_total: 0,
        })
        .select().single()

      if (createError || !newProfile) {
        return new Response(
          JSON.stringify({ error: 'Unable to initialize user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      profile = newProfile
    }

    // Gestion de la limite journalière (3 par jour pour l'offre gratuite)
    const today = new Date().toISOString().slice(0, 10)
    const lastDate = (profile.last_generation_date || '').slice(0, 10)
    const scriptsToday = lastDate === today ? (profile.scripts_generated_today || 0) : 0

    if (profile.subscription_type === 'free' && scriptsToday >= 3) {
      return new Response(
        JSON.stringify({ error: 'Limite quotidienne atteinte (3 scénarios max par jour pour les comptes gratuits)' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const characterDescriptions = characters && characters.length > 0
      ? characters.map((char: any) => `- ${char.name} (${char.age} ans) - ${char.role}: ${char.description || 'À développer'}`).join('\n')
      : null

    const lengthGuide = {
      'short': '500-800 mots',
      'medium': '800-1200 mots',
      'long': '1200-1800 mots'
    }[length as string] || '500-800 mots'

    const basePrompt = `Crée un scénario de bande dessinée professionnel en français avec ces paramètres :
Genre: ${genre}
Public cible: ${ageRange}
Thème principal: ${theme}
Décor: ${setting || 'Non défini'}
${characterDescriptions ? `Personnages :\n${characterDescriptions}` : ''}
Longueur: ${lengthGuide}
Instructions spéciales: ${customIdea || 'Aucune'}

Réponds OBLIGATOIREMENT dans ce format :
TITRE: [Titre du scénario]
LOGLINE: [Résumé en une phrase]
FADE IN:
[Contenu de l'histoire découpée en scènes numérotées]
FADE OUT.`

    const systemPrompt = "Tu es ScriptGenius, un assistant IA spécialisé dans la création de scénarios professionnels de BD. Réponds uniquement en français."
    let generatedContent = ''

    console.log(`Generating script with gemini-2.5-flash for user: ${user.id}`)

    // Appel direct et robuste au modèle Gemini 2.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`

    try {
      const geminiResp = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: basePrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192 // Large marge pour les longs scénarios
          }
        }),
      })

      if (geminiResp.ok) {
        const geminiData = await geminiResp.json()
        const text = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''
        if (text && text.trim().length > 100) {
          generatedContent = text
          console.log('✅ Génération réussie via Gemini 2.5 Flash')
        }
      } else {
        const err = await geminiResp.text()
        console.error('Gemini API Error:', geminiResp.status, err)
      }
    } catch (geminiError) {
      console.error('Exception during Gemini API call:', geminiError)
    }

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Le service de génération de scénario est temporairement indisponible. Réessayez dans quelques instants.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extraction propre du titre
    const titleMatch = generatedContent.match(/TITRE:\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].replace(/\[|\]/g, '').trim() : `Scénario ${genre}`

    // Sauvegarde du scénario dans la base de données via le client admin
    const { data: script, error: insertError } = await supabaseAdmin
      .from('scripts')
      .insert({
        user_id: user.id,
        title,
        content: generatedContent,
        genre,
        age_range: ageRange,
        theme,
        custom_idea: customIdea,
        word_count: generatedContent.split(/\s+/).length,
      })
      .select().single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save generated script' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mise à jour des compteurs quotidiens et totaux de l'utilisateur
    const nextTodayCount = lastDate === today ? (profile.scripts_generated_today || 0) + 1 : 1
    await supabaseAdmin
      .from('profiles')
      .update({
        scripts_generated_today: nextTodayCount,
        scripts_generated_total: (profile.scripts_generated_total || 0) + 1,
        last_generation_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    return new Response(
      JSON.stringify({ success: true, script }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-script function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
