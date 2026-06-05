import { supabase } from '@/integrations/supabase/client';
import { RunwareService } from './runwareService';
import { uploadImageToStorage, isBase64Image } from './storageService';

export interface ComicPanel {
  panelNumber: number;
  visualDescription: string;
  dialogue: string;
  characters: string[];
  action: string;
  cameraAngle: string;
  mood: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface ComicAnalysisResult {
  panels: ComicPanel[];
  totalPages: number;
  synopsis: string;
}

export const analyzeScriptForComic = async (
  scriptContent: string,
  style: string = 'manga',
  panelsPerPage: number = 6
): Promise<ComicAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('comic-script-analyzer', {
      body: {
        scriptContent,
        style,
        panelsPerPage
      }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Script analysis error:', error);
    throw error;
  }
};

export const generatePanelImage = async (
  panel: ComicPanel,
  style: string
): Promise<string> => {
  try {
    const runware = new RunwareService();

    // Build enhanced prompt with style
    const stylePrompts = {
      manga: 'Japanese manga style, black and white with dynamic speed lines, expressive faces',
      comics: 'American comic book style, vibrant colors, bold outlines, dramatic shading',
      european: 'European BD style, detailed realistic art, soft colors, ligne claire technique',
      cartoon: 'Colorful cartoon style, simple shapes, expressive characters, bright colors',
      realistic: 'Photorealistic style, natural proportions, cinematic lighting, detailed textures'
    };

    const stylePrefix = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.manga;
    
    const enhancedPrompt = `${stylePrefix}. ${panel.visualDescription}. ${panel.cameraAngle}. ${panel.mood} atmosphere. High quality, professional comic art.`;

    console.log('Generating panel image with prompt:', enhancedPrompt);
    
    const result = await runware.generateImage({
      positivePrompt: enhancedPrompt,
      width: 1024,
      height: 768,
    });

    console.log('Panel generation result:', result);

    if (!result.success || !result.image) {
      throw new Error(result.error || 'Failed to generate panel image');
    }

    console.log('Panel image URL:', result.image.url.substring(0, 50));
    return result.image.url;
  } catch (error) {
    console.error('Panel image generation error:', error);
    throw error;
  }
};

export const generateAllPanelImages = async (
  panels: ComicPanel[],
  style: string,
  onProgress?: (current: number, total: number) => void
): Promise<ComicPanel[]> => {
  const updatedPanels: ComicPanel[] = [];

  // Get current user for storage upload
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anonymous';

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    
    try {
      // Skip cover page (already has base64 image) - upload to storage
      if (panel.panelNumber === 0 && panel.imageUrl && isBase64Image(panel.imageUrl)) {
        let finalUrl = panel.imageUrl;
        try {
          finalUrl = await uploadImageToStorage(panel.imageUrl, 'comic-images', userId);
        } catch (e) {
          console.warn('Cover upload failed, keeping base64:', e);
        }
        updatedPanels.push({ ...panel, imageUrl: finalUrl, isGenerating: false });
        if (onProgress) {
          onProgress(i + 1, panels.length);
        }
        continue;
      }

      const imageUrl = await generatePanelImage(panel, style);
      
      // Upload generated image to storage if it's base64
      if (imageUrl && isBase64Image(imageUrl)) {
        let finalUrl = imageUrl;
        try {
          finalUrl = await uploadImageToStorage(imageUrl, 'comic-images', userId);
        } catch (e) {
          console.warn(`Upload failed for panel ${panel.panelNumber}, keeping base64:`, e);
        }
        updatedPanels.push({ ...panel, imageUrl: finalUrl, isGenerating: false });
      } else {
        updatedPanels.push({ ...panel, imageUrl, isGenerating: false });
      }
      
      if (onProgress) {
        onProgress(i + 1, panels.length);
      }
    } catch (error) {
      console.error(`Failed to generate image for panel ${panel.panelNumber}:`, error);
      updatedPanels.push({ ...panel, isGenerating: false });
    }
  }

  return updatedPanels;
};