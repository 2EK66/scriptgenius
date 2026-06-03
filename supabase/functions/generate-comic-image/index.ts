import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');

interface GenerateImageRequest {
  positivePrompt: string;
  width?: number;
  height?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!huggingFaceToken) {
      return new Response(JSON.stringify({ error: 'Hugging Face token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params: GenerateImageRequest = await req.json();

    // 🌟 ASTUCE : On injecte automatiquement des mots-clés de BD pour forcer le style
    const comicPrompt = `comic book style, panel, graphic novel illustration, digital artwork, ${params.positivePrompt}`;

    console.log('Generating comic image with Hugging Face:', comicPrompt);

    // Initialize Hugging Face client
    const hf = new HfInference(huggingFaceToken);

    // 🚀 Utilisation d'Animagine XL (Gratuit via l'API Inference de Hugging Face)
    const image = await hf.textToImage({
      inputs: comicPrompt,
      model: 'cagliostrolab/animagine-xl-3.1', // Modèle BD / Illustration magnifique
    });

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const imageUrl = `data:image/png;base64,${base64}`;
    
    console.log('Hugging Face comic image generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        image: {
          url: imageUrl,
          prompt: params.positivePrompt,
          id: crypto.randomUUID(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-comic-image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
