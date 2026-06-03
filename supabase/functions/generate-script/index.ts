import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Fetch user using the provided token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request data
    const { 
      genre, 
      ageRange, 
      theme, 
      customIdea, 
      characters, 
      setting, 
      tone, 
      length, 
      plotStructure 
    } = await req.json()

    // Fetch or create user profile
    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          subscription_type: 'free',
          scripts_generated_today: 0,
          scripts_generated_total: 0,
        })
        .select()
        .single()
      
      if (createError || !newProfile) {
        return new Response(
          JSON.stringify({ error: 'Unable to initialize user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      profile = newProfile
    }

    // Check if user can generate (free users: 3 per day)
    const today = new Date().toISOString().slice(0, 10)
    const lastDate = (profile.last_generation_date || '').slice(0, 10)
    const scriptsToday = lastDate === today ? (profile.scripts_generated_today || 0) : 0

    if (profile.subscription_type === 'free' && scriptsToday >= 3) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 🔑 RÉCUPÉRATION DE TA CLÉ GEMINI DIRECTE (A configurer dans les Secrets Supabase)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('Missing GEMINI_API_KEY')
      return new Response(
        JSON.stringify({ error: 'Configuration requise : Clé API Gemini manquante.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construction des guides de prompt (Identique à ton code d'origine)
    const characterDescriptions = characters && characters.length > 0 
      ? characters.map((char: any) => `- ${char.name} (${char.age} ans) - ${char.role}: ${char.description || 'À développer'}`).join('\n')
      : null;

    const lengthGuide = { 'short': '500-800 mots', 'medium': '800-1200 mots', 'long': '1200-1800 mots' }[length as string] || '500-800 mots';

    const prompt = `Tu es ScriptGenius, un assistant IA spécialisé dans la création de scénarios professionnels. Réponds uniquement en français.
    Genre: ${genre}
    Public cible: ${ageRange}
    Thème principal: ${theme}
    Décor: ${setting || 'Non défini'}
    ${characterDescriptions ? `Personnages :\n${characterDescriptions}` : ''}
    Longueur: ${lengthGuide}
    Instructions spéciales: ${customIdea || 'Aucune'}

    Format attendu obligatoirement :
    TITRE: [Titre]
    LOGLINE: [Résumé]
    FADE IN:
    [Contenu de l'histoire découpée en scènes]
    FADE OUT.`

    // 🚀 APPEL DIRECT DE L'API OFFICIELLE DE GOOGLE GEMINI (Modèle 1.5 Flash ou 2.0)
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const aiResp = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      }),
    })

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('Gemini direct API error:', errText);
      return new Response(JSON.stringify({ error: 'Erreur lors de la génération avec Gemini.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiResp.json()
    // Extraction propre de la réponse selon le format JSON natif de Google Gemini
    const generatedContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const titleMatch = generatedContent.match(/TITRE:\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].trim() : `Scénario ${genre}`

    // Sauvegarde en Base de données (Identique à ton projet)
    const { data: script, error: insertError } = await supabaseClient
      .from('scripts')
      .insert({
        user_id: user.id,
        title,
        content: generatedContent,
        genre,
        age_range: ageRange,
        theme,
        custom_idea: customIdea,
        word_count: generatedContent.split(' ').length,
      })
      .select()
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Failed to save script' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Mise à jour des compteurs quotidiens
    const nextTodayCount = lastDate === today ? (profile.scripts_generated_today || 0) + 1 : 1
    await supabaseClient
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
