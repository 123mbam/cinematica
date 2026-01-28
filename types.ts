
export interface CinematicStyle {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  previewUrl: string;
}

export type GenerationState = 'idle' | 'drafting' | 'editing' | 'animating' | 'completed' | 'error';

export interface MediaState {
  imageUrl: string | null;
  videoUrl: string | null;
  excerpt: string;
  selectedStyle: CinematicStyle | null;
  lastPrompt: string;
}
