import { supabase } from '@/integrations/supabase/client';
import { RunwareService } from './runwareService';
import { uploadImageToStorage, isBase64Image } from './storageService';
import { toast } from 'sonner';

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
    if (!data || !data.panels) throw new Error('Réponse invalide du serveur');

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
  const runware = new RunwareService();

  const stylePrompts: Record<string, string> = {
    manga: 'Japanese manga style, black and white with dynamic speed lines, expressive faces',
    comics: 'American comic book style, vibrant colors, bold outlines, dramatic shading',
    european: 'European BD style, detailed realistic art, soft colors, ligne claire technique',
    cartoon: 'Colorful cartoon style, simple shapes, expressive characters, bright colors',
    realistic: 'Photorealistic style, natural proportions, cinematic lighting, detailed textures',
    bd: 'Franco-belge BD style, ligne claire, Tintin/Asterix inspired, clean lines, flat colors',
  };

  const stylePrefix = stylePrompts[style] || stylePrompts.manga;
  const enhancedPrompt = `${stylePrefix}. ${panel.visualDescription}. ${panel.cameraAngle}. ${panel.mood} atmosphere. High quality, professional comic art.`;

  console.log(`[Panel ${panel.panelNumber}] Generating image with prompt:`, enhancedPrompt.substring(0, 80));

  const result = await runware.generateImage({
    positivePrompt: enhancedPrompt,
    width: 768,
    height: 512,
  });

  console.log(`[Panel ${panel.panelNumber}] Result:`, { success: result.success, error: result.error });

  if (!result.success || !result.image) {
    throw new Error(result.error || 'Failed to generate panel image');
  }

  return result.image.url;
};

export const generateAllPanelImages = async (
  panels: ComicPanel[],
  style: string,
  onProgress?: (current: number, total: number) => void
): Promise<ComicPanel[]> => {
  const updatedPanels: ComicPanel[] = [];
  let successCount = 0;
  let failCount = 0;

  // Get current user for storage upload
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anonymous';

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];

    try {
      // Panel 0 = couverture générée localement (canvas), juste uploader
      if (panel.panelNumber === 0 && panel.imageUrl && isBase64Image(panel.imageUrl)) {
        let finalUrl = panel.imageUrl;
        try {
          finalUrl = await uploadImageToStorage(panel.imageUrl, 'comic-images', userId);
        } catch (e) {
          console.warn('Cover upload failed, keeping base64:', e);
          // garde le base64 — l'image s'affiche quand même
        }
        updatedPanels.push({ ...panel, imageUrl: finalUrl, isGenerating: false });
        if (onProgress) onProgress(i + 1, panels.length);
        successCount++;
        continue;
      }

      // Génération IA pour les autres panels
      const imageUrl = await generatePanelImage(panel, style);

      // Upload vers Storage si c'est du base64
      let finalUrl = imageUrl;
      if (imageUrl && isBase64Image(imageUrl)) {
        try {
          finalUrl = await uploadImageToStorage(imageUrl, 'comic-images', userId);
        } catch (e) {
          console.warn(`Upload failed for panel ${panel.panelNumber}, keeping base64:`, e);
          finalUrl = imageUrl; // garde le base64
        }
      }

      updatedPanels.push({ ...panel, imageUrl: finalUrl, isGenerating: false });
      successCount++;
      console.log(`[Panel ${panel.panelNumber}] ✅ Image générée`);

    } catch (error) {
      failCount++;
      console.error(`[Panel ${panel.panelNumber}] ❌ Échec génération:`, error);
      // ✅ CORRECTION : afficher un toast d'erreur par panel raté
      toast.error(`Panel ${panel.panelNumber} : échec de génération`);
      updatedPanels.push({ ...panel, isGenerating: false }); // sans imageUrl
    }

    if (onProgress) onProgress(i + 1, panels.length);
  }

  // ✅ CORRECTION : toast adapté au résultat réel
  if (failCount === 0) {
    toast.success(`✅ ${successCount} images générées avec succès !`);
  } else if (successCount > 0) {
    toast.warning(`⚠️ ${successCount} images générées, ${failCount} échec(s)`);
  } else {
    toast.error(`❌ Aucune image générée (${failCount} échecs)`);
  }

  return updatedPanels;
};
