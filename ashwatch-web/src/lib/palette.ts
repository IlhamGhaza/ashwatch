import { PolygonType } from './types';

/**
 * Orange-scale volcanic palette — professional aviation monitoring aesthetic.
 * Warm amber-to-burnt-orange progression for clear differentiation
 * against dark navy map background.
 */
export const VOLCANO_PALETTE: string[] = [
  '#e8731a', // volcanic orange (primary)
  '#d4610a', // burnt orange
  '#f59e0b', // amber
  '#ea8c2a', // golden orange
  '#c2530a', // deep burnt
  '#e06820', // flame orange
  '#d97706', // dark amber
  '#f97316', // bright orange
  '#b45309', // bronze
  '#ef8b2c', // warm tangerine
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
  observed: 0.50,
  estimated: 0.50,
  forecast6h: 0.35,
  forecast12h: 0.22,
  forecast18h: 0.14,
};

export function getPolygonOpacity(type: PolygonType): number {
  return POLYGON_OPACITIES[type] ?? 0.30;
}
