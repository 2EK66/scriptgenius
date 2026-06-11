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

    // Client utilisateur — uniquement pour vérifier l'auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Client admin — pour toutes les opérations DB sans blocage RLS
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

    // Lecture profil via admin
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

    const today = new Date().toISOString().slice(0, 10)
    const lastDate = (profile.last_generation_date || '').slice(0, 10)
    const scriptsToday = lastDate === today ? (profile.scripts_generated_today || 0) : 0

    if (profile.subscription_type === 'free' && scriptsToday >= 3) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

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

    let generatedContent = ''

    // ---- TENTATIVE 1 : Hugging Face ----
    if (hfApiKey) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 25000)

        const hfResp = await fetch(
          'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: `<|system|>Tu es ScriptGenius, expert en scénarios de BD. Réponds uniquement en français.</s><|user|>${basePrompt}</s><|assistant|>`,
              parameters: {
                max_new_tokens: 1500,
                temperature: 0.7,
                top_p: 0.9,
                do_sample: true,
                return_full_text: false,
              }
            }),
            signal: controller.signal,
          }
        )
        clearTimeout(timeout)

        if (hfResp.ok) {
          const hfData = await hfResp.json()
          const text = Array.isArray(hfData)
            ? hfData[0]?.generated_text || ''
            : hfData?.generated_text || ''
          if (text && text.length > 100) {
            generatedContent = text
            console.log('✅ Généré via Hugging Face')
          }
        } else {
          const err = await hfResp.text()
          console.error('HuggingFace failed:', hfResp.status, err)
        }
      } catch (hfError) {
        console.error('HuggingFace exception:', hfError)
      }
    }

    // ---- TENTATIVE 2 : Gemini (fallback) ----
    if (!generatedContent && geminiApiKey) {
      const systemPrompt = "Tu es ScriptGenius, un assistant IA spécialisé dans la création de scénarios professionnels de BD. Réponds uniquement en français."

      const models = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
      ]

      for (const model of models) {
        try {
          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: basePrompt }] }],
              }),
            }
          )

          if (geminiResp.ok) {
            const geminiData = await geminiResp.json()
            const text = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || ''
            if (text) {
              generatedContent = text
              console.log(`✅ Généré via Gemini (${model})`)
              break
            }
          } else {
            const err = await geminiResp.text()
            console.error(`Gemini ${model} failed:`, geminiResp.status, err)
          }
        } catch (geminiError) {
          console.error(`Exception Gemini ${model}:`, geminiError)
        }
        await new Promise(r => setTimeout(r, 500))
      }
    }

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Tous les services IA sont indisponibles. Réessayez dans quelques minutes.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const titleMatch = generatedContent.match(/TITRE:\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].trim() : `Scénario ${genre}`

    // Insert script via admin
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
        word_count: generatedContent.split(' ').length,
      })
      .select().single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save script' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update compteur via admin
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
    console.error('Error in generate-script:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
