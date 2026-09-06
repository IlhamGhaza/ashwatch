/**
 * Aviation terminology translation utilities.
 * Converts raw aeronautical codes (Flight Level, knots, wind bearings)
 * into accessible, human-readable explanations.
 */

const DIRECTION_NAMES: Record<string, string> = {
  N: 'North',
  NNE: 'North-Northeast',
  NE: 'Northeast',
  ENE: 'East-Northeast',
  E: 'East',
  ESE: 'East-Southeast',
  SE: 'Southeast',
  SSE: 'South-Southeast',
  S: 'South',
  SSW: 'South-Southwest',
  SW: 'Southwest',
  WSW: 'West-Southwest',
  W: 'West',
  WNW: 'West-Northwest',
  NW: 'Northwest',
  NNW: 'North-Northwest',
};

/**
 * Parses flight level strings (e.g. "FL070", "FL150", "SFC/FL200", "SFC → FL150")
 * into human-readable altitude descriptions.
 */
export function formatFlightLevelHuman(raw?: string | null): string {
  if (!raw) return 'Altitude unspecified';

  // Matches pattern like FL070, FL150, FL500
  const flMatch = raw.match(/FL(\d{2,3})/i);
  if (flMatch) {
    const flNum = parseInt(flMatch[1], 10);
    const feet = flNum * 100;
    const meters = Math.round(feet * 0.3048);
    return `${feet.toLocaleString('en-US')} ft altitude (~${meters.toLocaleString('en-US')} m)`;
  }

  // Range pattern like SFC/FL070 or SFC -> FL150
  const rangeMatch = raw.match(/SFC\s*(?:\/|→|TO|-)\s*FL(\d{2,3})/i);
  if (rangeMatch) {
    const flNum = parseInt(rangeMatch[1], 10);
    const feet = flNum * 100;
    const meters = Math.round(feet * 0.3048);
    return `Surface to ${feet.toLocaleString('en-US')} ft (~${meters.toLocaleString('en-US')} m)`;
  }

  return raw;
}

/**
 * Parses movement vectors (e.g. "MOV NW 05KT", "MOV SE 10KT", "NW 05 KT", "STNR")
 * into human-readable direction and speed.
 */
export function formatMovementHuman(raw?: string | null): string {
  if (!raw) return 'Movement data not available';

  const clean = raw.trim().toUpperCase();
  if (clean === 'STNR' || clean.includes('STATIONARY')) {
    return 'Stationary (minimal wind movement)';
  }

  // Match direction and knots: e.g. "NW 05KT" or "MOV SE 10 KT"
  const match = clean.match(/(?:MOV\s+)?([A-Z]{1,3})\s*(\d{1,3})\s*(?:KT|KTS)?/i);
  if (match) {
    const dirCode = match[1];
    const knots = parseInt(match[2], 10);
    const kmh = Math.round(knots * 1.852);
    const dirFull = DIRECTION_NAMES[dirCode] || dirCode;

    return `Moving ${dirFull} · ${knots} knots (${kmh} km/h)`;
  }

  return raw;
}

/**
 * Compact human interpretation of altitude for cards and lists.
 * e.g. "SFC → FL070" => "SFC → FL070 (7,000 ft)"
 */
export function formatAltitudeCompact(raw?: string | null): string {
  if (!raw) return 'SFC → Unknown';
  const flMatch = raw.match(/FL(\d{2,3})/i);
  if (flMatch) {
    const feet = parseInt(flMatch[1], 10) * 100;
    return `${raw} (${feet.toLocaleString('en-US')} ft)`;
  }
  return raw;
}
