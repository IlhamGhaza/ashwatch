import { LatLng } from '../types';

/**
 * Parses a single aviation-format coordinate string (e.g. "N0148", "S0806",
 * "E12750", "W15405") into a decimal degree value.
 *
 * Latitude format:  [N|S]DDMM  (degrees + minutes)
 * Longitude format: [E|W]DDDMM (degrees + minutes)
 */
export function parseAviationComponent(raw: string): number | null {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;

  const prefix = trimmed[0];
  const digits = trimmed.substring(1);
  if (!digits) return null;

  const isNegative = prefix === 'S' || prefix === 'W';
  const isLatitude = prefix === 'N' || prefix === 'S';
  const isLongitude = prefix === 'E' || prefix === 'W';

  if (!isLatitude && !isLongitude) return null;

  const degreeDigits = isLatitude ? 2 : 3;
  if (digits.length < degreeDigits + 2) return null;

  const degreePart = parseInt(digits.substring(0, degreeDigits), 10);
  const minutePart = parseInt(digits.substring(degreeDigits, degreeDigits + 2), 10);

  if (isNaN(degreePart) || isNaN(minutePart)) return null;
  if (minutePart < 0 || minutePart >= 60) return null;

  let decimal = degreePart + minutePart / 60.0;
  if (isNegative) decimal = -decimal;

  return parseFloat(decimal.toFixed(4));
}

/**
 * Parses a coordinate pair string like "S0816 E12330" or "N0148 E12750"
 * into a LatLng object.
 */
export function parseAviationCoordinate(pair: string): LatLng | null {
  const parts = pair.trim().split(/\s+/);
  if (parts.length < 2) return null;

  const lat = parseAviationComponent(parts[0]);
  const lon = parseAviationComponent(parts[1]);

  if (lat === null || lon === null) return null;

  return { latitude: lat, longitude: lon };
}

/**
 * Extracts all coordinate pairs from a line of text.
 * Coordinate pairs are separated by " - ".
 * Stops parsing when encountering movement keywords like "MOV".
 */
export function parsePolygonCoordinates(text: string): LatLng[] {
  const coords: LatLng[] = [];

  // Remove flight level prefix (e.g. "SFC/FL060" or "FL050/FL100")
  let cleaned = text.replace(/(SFC|FL\d+)\s*\/\s*(SFC|FL\d+)\s*/g, '').trim();

  // Remove timestamp prefix for forecast sections (e.g. "04/1940Z")
  cleaned = cleaned.replace(/^\d{2}\/\d{4}Z\s*/, '').trim();

  // Stop at MOV to avoid interpreting movement info as coordinates
  const movMatch = /\bMOV\b/.exec(cleaned);
  if (movMatch && movMatch.index >= 0) {
    cleaned = cleaned.substring(0, movMatch.index).trim();
  }

  // Split on " - " separators
  const segments = cleaned.split(/\s*-\s*/);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const coord = parseAviationCoordinate(trimmed);
    if (coord) {
      coords.push(coord);
    }
  }

  return coords;
}
