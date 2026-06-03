
import { supabase } from '@/integrations/supabase/client';

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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      console.log('Calling generate-comic-image with prompt:', params.positivePrompt);
      
      const { data, error } = await supabase.functions.invoke('generate-comic-image', {
        body: {
          positivePrompt: params.positivePrompt,
          width: params.width,
          height: params.height,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Image generation error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate image'
        };
      }

      if (!data.success) {
        console.error('Image generation failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to generate image'
        };
      }

      console.log('Image generated successfully:', data.image?.url?.substring(0, 50));
      return data;
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur inattendue est survenue'
      };
    }
  }

  async generateComicPanel(description: string, artStyle: string, customPrompt?: string): Promise<GeneratedImage> {
    let prompt = `${description}, ${artStyle} style`;
    
    if (customPrompt) {
      prompt += `, ${customPrompt}`;
    }

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
