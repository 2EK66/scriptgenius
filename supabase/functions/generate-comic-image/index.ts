import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params: GenerateImageRequest = await req.json();

    // ✅ Ne PAS wrapper le prompt : le client construit déjà un prompt complet
    // (description visuelle EN PREMIER + style + angle + mood). Wrapper ici
    // enterrait la description au milieu et cassait la fidélité au prompt.
    const comicPrompt = params.positivePrompt;

    console.log('Generating image with gpt-image-2, prompt:', comicPrompt.substring(0, 100));

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // gpt-image-2 respecte le prompt beaucoup mieux que gemini-flash-image
        model: 'openai/gpt-image-2',
        prompt: comicPrompt,
        size: '1024x1024',
        quality: 'low',
        n: 1,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI Gateway error:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI Gateway: ${aiRes.status} ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiRes.json();
    const b64 = aiData?.data?.[0]?.b64_json;
    if (!b64) {
      console.error('No image in response:', JSON.stringify(aiData).slice(0, 500));
      return new Response(JSON.stringify({ error: 'No image returned' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const imageUrl = `data:image/png;base64,${b64}`;
    console.log('Comic image generated successfully');

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
