import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getKey(names: string[]): string {
  for (const n of names) { const v = Deno.env.get(n); if (v) return v }
  return ''
}

// Decoupe un script long en plusieurs blocs, extrait les scenes.
// budgetPerScene controle combien de caracteres de contenu on garde par scene,
// pour que le budget total soit reparti sur TOUTES les scenes (pas juste les premieres).
function extractScenes(script: string, budgetPerScene: number): string[] {
  const sceneRegex = /\*{0,2}SC[EÈ]NE\s*\d+[^\n]*/gi
  const scenes: string[] = []
  const parts = script.split(sceneRegex)
  const headers = script.match(sceneRegex) || []
  headers.forEach((h, i) => {
    const content = (parts[i + 1] || '').trim()
    if (content) scenes.push(`${h}\n${content.substring(0, budgetPerScene)}`)
  })
  return scenes.length > 0 ? scenes : [script.substring(0, 8000)]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { scriptContent, style = 'bd', panelsPerPage = 6 } = await req.json()
    if (!scriptContent?.trim()) return new Response(JSON.stringify({ error: 'Scenario vide' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const styleDesc: Record<string, string> = {
      manga: 'manga japonais noir et blanc, trait dynamique, expressions exagerees',
      comics: 'comics americain couleurs vives, contours epais, style Marvel DC',
      european: 'BD franco-belge ligne claire, couleurs plates, style Tintin Asterix',
      cartoon: 'cartoon colore, formes simples, personnages expressifs',
      realistic: 'style realiste, proportions naturelles, eclairage cinematographique',
      bd: 'BD franco-belge professionnelle, ligne claire, couleurs vives',
    }
    const maxPanels = Math.min(panelsPerPage, 8)
    const sd = styleDesc[style] || styleDesc['bd']

    // Compte les scenes AVANT de decouper, pour repartir le budget de caracteres
    // proportionnellement sur TOUTES les scenes (evite de perdre la fin du scenario).
    const sceneHeaderRegex = /\*{0,2}SC[EÈ]NE\s*\d+[^\n]*/gi
    const detectedSceneCount = Math.max(1, (scriptContent.match(sceneHeaderRegex) || []).length)

    const TOTAL_CHAR_BUDGET = 6000 // budget total envoye a l'IA, reparti sur toutes les scenes
    const MIN_PER_SCENE = 150      // toujours garder un minimum de contexte par scene
    const MAX_PER_SCENE = 1200     // eviter qu'une seule scene monopolise tout le budget
    const budgetPerScene = Math.min(
      MAX_PER_SCENE,
      Math.max(MIN_PER_SCENE, Math.floor(TOTAL_CHAR_BUDGET / detectedSceneCount))
    )

    // Extraction intelligente des scenes pour couvrir tout le script
    const scenes = extractScenes(scriptContent, budgetPerScene)
    const totalScenes = scenes.length
    const scriptForAI = scenes.map((s, i) => `[SCENE ${i + 1}]\n${s}`).join('\n\n')

    console.log(`[INFO] Script: ${scriptContent.length} chars, ${totalScenes} scenes detectees`)

    const systemPrompt = `Tu es un storyboarder BD professionnel. Tu reponds UNIQUEMENT en JSON valide sans backticks ni markdown.`

    const userPrompt = `Analyse CE SCENARIO COMPLET et cree exactement ${maxPanels} panels BD bien repartis sur TOUTES les scenes.
Style: ${sd}

IMPORTANT: Couvre TOUT le scenario du debut a la fin. Repartis les ${maxPanels} panels sur les ${totalScenes} scene(s) detectee(s).

REGLES:
- Panel 1: plan large etablissement du lieu principal et des personnages
- Alterner: plan large, plan moyen, gros plan, plan americain
- Dialogues: COPIE EXACTEMENT le texte du scenario, max 15 mots
- Attribue chaque dialogue au bon personnage (speaker = nom exact du personnage)
- Dernier panel: cliffhanger ou moment fort

SCENARIO COMPLET:
${scriptForAI}

Reponds avec SEULEMENT ce JSON:
{"synopsis":"Resume complet en 2 phrases","totalPages":1,"panels":[{"panelNumber":1,"type":"etablissement","visualDescription":"Description precise et detaillee: decor exact, position des personnages, couleurs, lumiere. 2-3 phrases.","dialogue":"Texte exact du personnage (vide si silence)","speaker":"NOM exact du personnage qui parle","characters":["Prenom1","Prenom2"],"action":"Action physique precise en 1 phrase","cameraAngle":"plan large|plan moyen|gros plan|plan americain|contre-plongee|plongee","mood":"joyeux|triste|dramatique|mysterieux|action|romantique|tendu|comique","transitionToNext":"ellipse|zoom|autre lieu|meme lieu"}]}`

    let result: any = null
    let lastError = ''

    // GROQ priorite 1 — modeles actuellement supportes (verifie sur console.groq.com/docs/models)
    // mixtral-8x7b-32768 a ete decommissionne par Groq, retire de la liste.
    // "llama-3.1-70b-versatile" n'a jamais ete un ID valide (faute de frappe pour 3.3), corrige.
    const groqKey = getKey(['GROQ_API_KEY', 'Groq_API_KEY'])
    if (groqKey) {
      for (const model of ['openai/gpt-oss-20b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        if (result) break
        try {
          console.log(`[GROQ] ${model}...`)
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model, max_tokens: 4000, temperature: 0.4,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          })
          const txt = await r.text()
          if (r.ok) {
            const d = JSON.parse(txt)
            const content = d?.choices?.[0]?.message?.content || ''
            try { result = JSON.parse(content) }
            catch { const m = content.match(/\{[\s\S]*\}/); if (m) result = JSON.parse(m[0]) }
            if (result) console.log(`[GROQ] OK ${model} - ${result?.panels?.length} panels`)
          } else {
            lastError = `GROQ ${model}: HTTP ${r.status}`
            console.error(`[GROQ] ${model}:`, r.status, txt.substring(0, 150))
          }
        } catch (e: any) { lastError = `GROQ ${model}: ${e.message}`; console.error('[GROQ]', e.message) }
      }
    }

    // GEMINI fallback
    const geminiKey = getKey(['GEMINI_API_KEY'])
    if (!result && geminiKey) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
              generationConfig: { maxOutputTokens: 4000, temperature: 0.4 }
            })
          }
        )
        const txt = await r.text()
        if (r.ok) {
          const d = JSON.parse(txt)
          let content = d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const m = content.match(/\{[\s\S]*\}/)
          if (m) { result = JSON.parse(m[0]); console.log('[GEMINI] OK') }
        } else {
          lastError += ` | GEMINI: HTTP ${r.status}`
          console.error('[GEMINI]', r.status, txt.substring(0, 150))
        }
      } catch (e: any) { lastError += ` | GEMINI: ${e.message}` }
    }

    if (!result?.panels?.length) {
      return new Response(JSON.stringify({ error: `Analyse impossible: ${lastError}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    result.panels = result.panels.slice(0, maxPanels).map((p: any, i: number) => ({
      panelNumber: p.panelNumber ?? i + 1,
      type: p.type || 'action',
      visualDescription: p.visualDescription || `Scene ${i + 1}`,
      dialogue: p.dialogue || '',
      speaker: p.speaker || '',
      characters: Array.isArray(p.characters) ? p.characters : [],
      action: p.action || '',
      cameraAngle: p.cameraAngle || 'plan moyen',
      mood: p.mood || 'neutre',
      transitionToNext: p.transitionToNext || 'ellipse',
    }))
    result.totalPages = Math.ceil(result.panels.length / panelsPerPage) || 1
    result.synopsis = result.synopsis || 'Scenario analyse'
    result.scriptCoverage = `${totalScenes} scene(s) sur ${totalScenes} couverte(s)`

    console.log(`[OK] ${result.panels.length} panels - ${result.scriptCoverage}`)
    return new Response(JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e: any) {
    console.error('[CRASH]', e.message)
    return new Response(JSON.stringify({ error: `Erreur: ${e.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
