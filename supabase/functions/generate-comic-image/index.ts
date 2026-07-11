import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GenerateImageRequest {
  positivePrompt: string;
  width?: number;
  height?: number;
}

// Fonction utilitaire d'appel avec Exponential Backoff (jusqu'à 5 essais)
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Si l'erreur est liée au quota ou serveur, on tente de rejouer
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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params: GenerateImageRequest = await req.json();
    const comicPrompt = params.positivePrompt;

    console.log('Generating image with imagen-4.0, prompt length:', comicPrompt.length);

    // Endpoint officiel Google Imagen 4
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiApiKey}`;

    const aiRes = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: comicPrompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1", // Forcer le format carré par défaut
          outputMimeType: "image/png"
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gemini API error:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: `Gemini API: ${aiRes.status} ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    // Extraction des bytes encodés en base64 de la réponse d'Imagen 4
    const b64 = aiData?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      console.error('No image prediction in response:', JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: 'No image returned by Imagen' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const imageUrl = `data:image/png;base64,${b64}`;
    console.log('Comic image generated successfully with Imagen 4');

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
