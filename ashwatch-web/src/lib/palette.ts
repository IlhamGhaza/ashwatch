import { PolygonType } from './types';

export const VOLCANO_PALETTE: string[] = [
  '#E53E3E', // red
  '#DD6B20', // dark orange
  '#D53F8C', // pink
  '#C53030', // dark red
  '#E25353', // coral red
  '#B83280', // magenta
  '#ED6436', // burnt orange
  '#CB3A5F', // rose
  '#D44A4A', // crimson
  '#E2683C', // tangerine
];

/**
 * Deterministic color picker based on volcano name string hash,
 * preserving exact visual consistency with the Flutter application.
 */
export function getVolcanoColor(volcanoName: string): string {
  const upper = volcanoName.toUpperCase();
  let hash = 0;
  for (let i = 0; i < upper.length; i++) {
    hash = (hash * 31 + upper.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % VOLCANO_PALETTE.length;
  return VOLCANO_PALETTE[index];
}

export const POLYGON_OPACITIES: Record<PolygonType, number> = {
  observed: 0.55,
  estimated: 0.55,
  forecast6h: 0.40,
  forecast12h: 0.28,
  forecast18h: 0.18,
};

export function getPolygonOpacity(type: PolygonType): number {
  return POLYGON_OPACITIES[type] ?? 0.35;
}
