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

// Dessine une bulle de dialogue BD sur une image base64
export const addSpeechBubbleToImage = (imageUrl: string, dialogue: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!dialogue || !dialogue.trim()) {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      const maxWidth = canvas.width * 0.55;
      const padding = 14;
      const fontSize = Math.max(16, canvas.width * 0.028);
      const lineHeight = fontSize * 1.35;
      const tailSize = 18;

      ctx.font = `bold ${fontSize}px Arial, sans-serif`;

      const words = dialogue.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth - padding * 2) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
      const maxLines = 3;
      const shownLines = lines.slice(0, maxLines);
      if (lines.length > maxLines) shownLines[maxLines - 1] += '…';

      const textWidth = Math.max(...shownLines.map(l => ctx.measureText(l).width));
      const bubbleW = textWidth + padding * 2;
      const bubbleH = shownLines.length * lineHeight + padding * 2;

      const bubbleX = canvas.width - bubbleW - 20;
      const bubbleY = 20;
      const r = 16;

      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.moveTo(bubbleX + r, bubbleY);
      ctx.lineTo(bubbleX + bubbleW - r, bubbleY);
      ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r);
      ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
      ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH);
      ctx.lineTo(bubbleX + 60, bubbleY + bubbleH);
      ctx.lineTo(bubbleX + 30, bubbleY + bubbleH + tailSize);
      ctx.lineTo(bubbleX + 30, bubbleY + bubbleH);
      ctx.lineTo(bubbleX + r, bubbleY + bubbleH);
      ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r);
      ctx.lineTo(bubbleX, bubbleY + r);
      ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY);
      ctx.closePath();

      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = Math.max(2, canvas.width * 0.004);
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      shownLines.forEach((line, i) => {
        ctx.fillText(line, bubbleX + padding, bubbleY + padding + i * lineHeight);
      });

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
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
