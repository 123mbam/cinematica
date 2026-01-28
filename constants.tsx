
import { CinematicStyle } from './types';

export const CINEMATIC_STYLES: CinematicStyle[] = [
  {
    id: 'noir',
    name: 'Vintage Noir',
    description: 'High contrast black and white, dramatic shadows, mysterious atmosphere.',
    promptSuffix: 'in the style of classic 1940s film noir, high contrast black and white, grainy film texture, dramatic chiaroscuro lighting',
    previewUrl: 'https://picsum.photos/seed/noir/400/225'
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Vibrant neon colors, rainy streets, futuristic urban aesthetics.',
    promptSuffix: 'in a cyberpunk aesthetic, vibrant neon cyan and magenta lighting, rainy city streets, cinematic anamorphic flares, futuristic atmosphere',
    previewUrl: 'https://picsum.photos/seed/cyber/400/225'
  },
  {
    id: 'ghibli',
    name: 'Ghibli Fantasy',
    description: 'Soft hand-painted textures, lush nature, whimsical lighting.',
    promptSuffix: 'in the style of Studio Ghibli, hand-painted anime aesthetics, lush green meadows, soft golden hour lighting, whimsical and peaceful',
    previewUrl: 'https://picsum.photos/seed/ghibli/400/225'
  },
  {
    id: 'epic',
    name: 'Epic Cinematic',
    description: 'Grand scale, panoramic vistas, 70mm film look.',
    promptSuffix: 'epic grand scale cinematography, shot on 70mm film, panoramic vistas, majestic lighting, highly detailed textures, masterfully composed',
    previewUrl: 'https://picsum.photos/seed/epic/400/225'
  },
  {
    id: 'horror',
    name: 'Gothic Horror',
    description: 'Desaturated, eerie fog, Victorian dark aesthetics.',
    promptSuffix: 'gothic horror aesthetic, desaturated colors, dense fog, Victorian architecture, eerie atmosphere, moody lighting',
    previewUrl: 'https://picsum.photos/seed/horror/400/225'
  }
];

export const VEO_LOADING_MESSAGES = [
  "Framing the sequence...",
  "Simulating light transport...",
  "Applying cinematic grain...",
  "Syncing temporal consistency...",
  "Developing the motion paths...",
  "Finalizing color grade...",
  "The director is reviewing the cut..."
];
