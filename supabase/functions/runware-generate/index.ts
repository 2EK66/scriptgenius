
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const runwareApiKey = Deno.env.get('RUNWARE_API_KEY')!

interface GenerateImageRequest {
  positivePrompt: string;
  model?: string;
  width?: number;
  height?: number;
  numberResults?: number;
  outputFormat?: string;
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  seed?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization token')
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining, scripts_generated_total')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error('Failed to fetch user profile')
    }

    if (!profile.credits_remaining || profile.credits_remaining <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient credits. Please purchase more credits to continue.' 
        }),
        { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { positivePrompt, ...params }: GenerateImageRequest = await req.json()

    if (!positivePrompt) {
      throw new Error('positivePrompt is required')
    }

    // Generate image with Runware API
    const runwareResponse = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskType: 'authentication',
          apiKey: runwareApiKey,
        },
        {
          taskType: 'imageInference',
          taskUUID: crypto.randomUUID(),
          positivePrompt,
          model: params.model || 'runware:100@1',
          width: params.width || 1024,
          height: params.height || 1024,
          numberResults: params.numberResults || 1,
          outputFormat: params.outputFormat || 'WEBP',
          CFGScale: params.CFGScale || 1,
          scheduler: params.scheduler || 'FlowMatchEulerDiscreteScheduler',
          strength: params.strength || 0.8,
          ...(params.seed && { seed: params.seed })
        }
      ])
    })

    if (!runwareResponse.ok) {
      throw new Error(`Runware API error: ${runwareResponse.status}`)
    }

    const runwareData = await runwareResponse.json()
    
    if (runwareData.error) {
      throw new Error(runwareData.error.message || 'Image generation failed')
    }

    const imageData = runwareData.data?.find((item: any) => item.taskType === 'imageInference')
    
    if (!imageData) {
      throw new Error('No image generated')
    }

    // Deduct one credit
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ 
        credits_remaining: profile.credits_remaining - 1
      })
      .eq('id', user.id)

    if (creditError) {
      console.error('Failed to deduct credit:', creditError)
      // Continue anyway - image was generated
    }

    // Log the generation
    await supabase
      .from('image_generations')
      .insert({
        user_id: user.id,
        prompt: positivePrompt,
        image_url: imageData.imageURL,
        model: params.model || 'runware:100@1',
        credits_used: 1
      })

    return new Response(
      JSON.stringify({
        success: true,
        image: {
          url: imageData.imageURL,
          prompt: positivePrompt,
          seed: imageData.seed,
          id: imageData.imageUUID
        },
        credits_remaining: profile.credits_remaining - 1
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in runware-generate function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
