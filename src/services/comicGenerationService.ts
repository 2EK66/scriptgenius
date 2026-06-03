import { supabase, isSupabaseReady } from '@/integrations/supabase/client';
import { RunwareService } from './runwareService';

interface ComicGenerationParams {
  scriptContent: string;
  artStyle: string;
  customPrompt?: string;
  apiKey?: string;
}

interface ComicPanel {
  id: string;
  description: string;
  imageUrl?: string;
  dialogue?: string;
}

interface GeneratedComic {
  id: string;
  title: string;
  panels: ComicPanel[];
  artStyle: string;
  createdAt: string;
}

const extractPanelsFromScript = (scriptContent: string): Array<{description: string, dialogue?: string}> => {
  // Simple extraction logic - in reality, this could be more sophisticated
  const lines = scriptContent.split('\n').filter(line => line.trim());
  const panels = [];
  
  for (let i = 0; i < Math.min(lines.length, 6); i += 2) {
    const description = lines[i] || `Panel ${i/2 + 1} scene`;
    const dialogue = lines[i + 1] || '';
    
    panels.push({
      description: description.length > 100 ? description.substring(0, 100) + '...' : description,
      dialogue: dialogue.length > 150 ? dialogue.substring(0, 150) + '...' : dialogue
    });
  }
  
  // Ensure we have at least 4 panels
  while (panels.length < 4) {
    panels.push({
      description: `Scene ${panels.length + 1} from the story`,
      dialogue: 'Dialogue continues...'
    });
  }
  
  return panels.slice(0, 6); // Max 6 panels
};

export const generateComic = async (params: ComicGenerationParams): Promise<{
  success: boolean;
  comic?: GeneratedComic;
  error?: string;
}> => {
  try {
    console.log('Génération de BD avec les paramètres:', params);

    // Extract panels from script
    const scriptPanels = extractPanelsFromScript(params.scriptContent);
    
    // Use server-side Runware service
    const runware = new RunwareService();
    
    console.log('Generating images with Runware AI...');
    
    let generatedPanels: ComicPanel[] = [];

    for (let i = 0; i < scriptPanels.length; i++) {
      try {
        const panel = scriptPanels[i];
        const generatedImage = await runware.generateComicPanel(
          panel.description,
          params.artStyle,
          params.customPrompt
        );
        
        generatedPanels.push({
          id: `panel_${i + 1}`,
          description: panel.description,
          imageUrl: generatedImage.url,
          dialogue: panel.dialogue
        });
        
        console.log(`Panel ${i + 1} generated successfully`);
        
      } catch (error) {
        console.error(`Error generating panel ${i + 1}:`, error);
        
        // If it's a credits error, stop generation
        if (error instanceof Error && error.message.includes('Crédits insuffisants')) {
          return {
            success: false,
            error: 'Crédits insuffisants pour générer toutes les images. Veuillez acheter plus de crédits.'
          };
        }
        
        // Otherwise, add panel without image
        generatedPanels.push({
          id: `panel_${i + 1}`,
          description: scriptPanels[i].description,
          dialogue: scriptPanels[i].dialogue
        });
      }
    }

    const comic: GeneratedComic = {
      id: `comic_${Date.now()}`,
      title: 'BD Générée',
      panels: generatedPanels,
      artStyle: params.artStyle,
      createdAt: new Date().toISOString()
    };

    // Save to Supabase if available
    if (isSupabaseReady()) {
      try {
        // Fonctionnalité en attente - pas de sauvegarde pour le moment
        console.log('Comic generation - save simulated');
      } catch (error) {
        console.error('Erreur Supabase:', error);
      }
    }

    return {
      success: true,
      comic
    };

  } catch (error) {
    console.error('Erreur dans generateComic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

export const saveComic = async (comic: GeneratedComic): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    if (!isSupabaseReady()) {
      console.log('Mode simulation - sauvegarde simulée');
      return { success: true };
    }

    // Fonctionnalité en attente - pas de sauvegarde pour le moment
    console.log('Comic save - simulated');

    return { success: true };

  } catch (error) {
    console.error('Erreur dans saveComic:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};
