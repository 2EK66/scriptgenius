// ✅ VERSION CORRIGÉE — utilise fetch direct au lieu de supabase.functions.invoke
// qui échouait silencieusement avant même d'envoyer la requête réseau.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://grabfyemmvlskhsxbuec.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export interface GenerateImageParams {
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

export interface GeneratedImage {
  url: string;
  prompt: string;
  seed: number;
  id: string;
}

export interface GenerateImageResponse {
  success: boolean;
  image?: GeneratedImage;
  credits_remaining?: number;
  error?: string;
}

export class RunwareService {
  async generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
    try {
      console.log('[RunwareService] Appel direct fetch vers generate-comic-image...');
      console.log('[RunwareService] URL:', `${SUPABASE_URL}/functions/v1/generate-comic-image`);
      console.log('[RunwareService] Prompt:', params.positivePrompt?.substring(0, 60));

      // Timeout de 90 secondes (HuggingFace peut être lent)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-comic-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          positivePrompt: params.positivePrompt,
          width: params.width || 768,
          height: params.height || 512,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      console.log('[RunwareService] HTTP status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[RunwareService] Erreur HTTP:', response.status, errText.substring(0, 200));
        return {
          success: false,
          error: `Erreur serveur ${response.status}: ${errText.substring(0, 100)}`,
        };
      }

      const data = await response.json();
      console.log('[RunwareService] Réponse:', { success: data.success, hasImage: !!data.image?.url });

      if (!data.success || !data.image?.url) {
        console.error('[RunwareService] Échec génération:', data.error);
        return {
          success: false,
          error: data.error || 'Génération échouée',
        };
      }

      console.log('[RunwareService] ✅ Image reçue:', data.image.url.substring(0, 40));
      return data;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[RunwareService] Timeout 90s dépassé');
        return { success: false, error: 'Timeout : HuggingFace a pris trop de temps' };
      }
      console.error('[RunwareService] Exception:', error.message);
      return {
        success: false,
        error: error.message || 'Erreur inattendue',
      };
    }
  }

  async generateComicPanel(description: string, artStyle: string, customPrompt?: string): Promise<GeneratedImage> {
    let prompt = `${description}, ${artStyle} style`;
    if (customPrompt) prompt += `, ${customPrompt}`;
    prompt += ', comic book panel, professional illustration, high quality, detailed artwork';

    const result = await this.generateImage({
      positivePrompt: prompt,
      width: 1024,
      height: 768,
    });

    if (!result.success || !result.image) {
      throw new Error(result.error || 'Failed to generate comic panel');
    }
    return result.image;
  }
}
