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
    const authHeader  = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
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

    const today = new Date().toISOString().slice(0, 10)
    const lastDate = (profile.last_generation_date || '').slice(0, 10)
    const scriptsToday = lastDate === today ? (profile.scripts_generated_today || 0) : 0

    if (profile.subscription_type === 'free' && scriptsToday >= 3) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.error('Missing GEMINI_API_KEY')
      return new Response(
        JSON.stringify({ error: 'Configuration requise : Clé API Gemini manquante.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const characterDescriptions = characters && characters.length > 0
      ? characters.map((char: any) => `- ${char.name} (${char.age} ans) - ${char.role}: ${char.description || 'À développer'}`).join('\n')
      : null;

    const lengthGuide = { 'short': '500-800 mots', 'medium': '800-1200 mots', 'long': '1200-1800 mots' }[length as string] || '500-800 mots';

    const prompt = `Genre: ${genre}
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

    const systemPrompt = "Tu es ScriptGenius, un assistant IA spécialisé dans la création de scénarios professionnels. Réponds uniquement en français."

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!geminiResp.ok) {
      const errText = await geminiResp.text()
      console.error('Gemini API error:', geminiResp.status, errText)
      return new Response(
        JSON.stringify({ error: `Erreur Gemini: ${geminiResp.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResp.json()
    const generatedContent = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Réponse Gemini vide' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const titleMatch = generatedContent.match(/TITRE:\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].trim() : `Scénario ${genre}`

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
    console.error('Error in generate-script:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
