
import { supabase } from '@/integrations/supabase/client';

export interface Character {
  name: string;
  age: number;
  description: string;
  role: string;
}

export interface GenerateScriptRequest {
  genre: string;
  ageRange: string;
  theme: string;
  customIdea?: string;
  characters?: Character[];
  setting?: string;
  tone?: string;
  length?: string;
  plotStructure?: string;
}

export interface GenerateScriptResponse {
  success: boolean;
  script?: {
    id: string;
    title: string;
    content: string;
    genre: string;
    age_range: string;
    theme: string;
    custom_idea?: string;
    word_count: number;
  };
  error?: string;
}

export const generateScript = async (request: GenerateScriptRequest): Promise<GenerateScriptResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: request,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate script');
    }

    return data;
  } catch (error) {
    console.error('Script generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};
