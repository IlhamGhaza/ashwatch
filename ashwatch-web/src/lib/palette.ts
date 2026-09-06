import { PolygonType } from './types';

/**
 * Standard visual tokens for AshWatch map layers according to design specifications.
 * Observed/Estimated ash clouds use a neutral gray-white translucent appearance.
 * Forecast horizons (+6h, +12h, +18h) use progressively lighter translucent warm orange layers.
 */
export const LAYER_COLORS: Record<PolygonType, { fill: string; stroke: string; opacity: number }> = {
  observed: {
    fill: '#E2E8F0', // Neutral gray-white
    stroke: '#FFFFFF',
    opacity: 0.45,
  },
  estimated: {
    fill: '#E2E8F0',
    stroke: '#FFFFFF',
    opacity: 0.45,
  },
  forecast6h: {
    fill: '#FF8A3D', // Warm orange
    stroke: '#FFA25B',
    opacity: 0.32,
  },
  forecast12h: {
    fill: '#FF8A3D',
    stroke: '#FFA25B',
    opacity: 0.20,
  },
  forecast18h: {
    fill: '#FF8A3D',
    stroke: '#FFA25B',
    opacity: 0.12,
  },
};

/**
 * Primary accent colors for AshWatch
 */
export const BRAND_COLORS = {
  primaryAccent: '#FF6B1A',
  secondaryAccent: '#FF8A3D',
  background: '#0B0F17',
  surfaceSecondary: '#111827',
  surfaceElevated: '#151C28',
  textPrimary: '#F5F7FA',
  textSecondary: '#8B95A7',
};

/**
 * Clean volcano marker accent color
 */
export function getVolcanoColor(_volcanoName?: string): string {
  // Return primary warm accent instead of random rainbow colors
  return BRAND_COLORS.primaryAccent;
}

export function getPolygonStyle(type: PolygonType) {
  return LAYER_COLORS[type] || LAYER_COLORS.observed;
}

export function getPolygonOpacity(type: PolygonType): number {
  return LAYER_COLORS[type]?.opacity ?? 0.3;
}
