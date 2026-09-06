import { LatLng, AshPolygon, VolcanoAdvisory, PolygonType } from './types';
import { formatFlightLevelHuman, formatMovementHuman } from './aviation-format';

export interface LocationCheckResult {
  status: 'CLEAR' | 'ASH_AREA' | 'FORECAST_OVERLAP';
  statusLabel: string;
  statusDescription: string;
  locationName?: string;
  coordinates: LatLng;
  affectedVolcano?: string;
  affectedAdvisory?: VolcanoAdvisory;
  polygonType?: PolygonType;
  flightLevel?: string;
  humanAltitude?: string;
  movement?: string;
  humanMovement?: string;
  validTime?: string;
  forecastHorizon?: string; // e.g. "+6 hours"
  nearestAshDistanceKm: number;
  nearestVolcanoName: string;
}

/**
 * Standard Ray Casting algorithm for Point-in-Polygon (PIP) testing.
 * Determines if point is strictly inside polygon coordinates.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate Great Circle distance between two points in Kilometers using Haversine formula.
 */
export function haversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const lat1 = (p1.latitude * Math.PI) / 180;
  const lat2 = (p2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculate polygon centroid approximation
 */
export function getPolygonCenter(coordinates: LatLng[]): LatLng {
  if (!coordinates || coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  let sumLat = 0;
  let sumLng = 0;
  for (const c of coordinates) {
    sumLat += c.latitude;
    sumLng += c.longitude;
  }
  return {
    latitude: sumLat / coordinates.length,
    longitude: sumLng / coordinates.length,
  };
}

/**
 * Distance in km from a point to the boundary or vertices of a polygon
 */
export function distanceToPolygonKm(point: LatLng, coordinates: LatLng[]): number {
  if (!coordinates || coordinates.length === 0) return 99999;
  let minDistance = Infinity;

  // Check vertices
  for (const coord of coordinates) {
    const dist = haversineDistanceKm(point, coord);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  // Also check centroid
  const center = getPolygonCenter(coordinates);
  const centerDist = haversineDistanceKm(point, center);
  if (centerDist < minDistance) {
    minDistance = centerDist;
  }

  return minDistance === Infinity ? 99999 : minDistance;
}

/**
 * Comprehensive ash area check for a given user location.
 * Evaluates against all active advisories and their observed and forecast polygons.
 */
export function checkLocationAshStatus(
  location: LatLng,
  advisories: VolcanoAdvisory[],
  locationName?: string
): LocationCheckResult {
  // 1. Check if inside OBSERVED / ESTIMATED active ash polygon
  let observedHit: {
    advisory: VolcanoAdvisory;
    polygon: AshPolygon;
  } | null = null;

  // 2. Check if inside FORECAST polygon (+6h, +12h, +18h)
  let forecastHit: {
    advisory: VolcanoAdvisory;
    polygon: AshPolygon;
    horizon: string;
  } | null = null;

  // Track nearest ash cloud distance
  let nearestAshDistance = Infinity;
  let nearestVolcanoName = 'Unknown';

  for (const adv of advisories) {
    // Check distance to volcano summit if known
    if (adv.position) {
      const distToSummit = haversineDistanceKm(location, adv.position);
      if (distToSummit < nearestAshDistance) {
        nearestAshDistance = distToSummit;
        nearestVolcanoName = adv.volcanoName;
      }
    }

    for (const poly of adv.polygons) {
      if (poly.coordinates.length < 3) continue;

      const dist = distanceToPolygonKm(location, poly.coordinates);
      if (dist < nearestAshDistance) {
        nearestAshDistance = dist;
        nearestVolcanoName = adv.volcanoName;
      }

      const isInside = isPointInPolygon(location, poly.coordinates);
      if (isInside) {
        if (poly.type === 'observed' || poly.type === 'estimated') {
          if (!observedHit) {
            observedHit = { advisory: adv, polygon: poly };
          }
        } else {
          if (!forecastHit) {
            let horizon = '+6 hours';
            if (poly.type === 'forecast12h') horizon = '+12 hours';
            if (poly.type === 'forecast18h') horizon = '+18 hours';
            forecastHit = { advisory: adv, polygon: poly, horizon };
          }
        }
      }
    }
  }

  if (nearestAshDistance === Infinity) {
    nearestAshDistance = 0;
    if (advisories.length > 0) {
      nearestVolcanoName = advisories[0].volcanoName;
    }
  }

  // CASE 2: Inside active OBSERVED ash polygon
  if (observedHit) {
    const adv = observedHit.advisory;
    const poly = observedHit.polygon;
    const flightLevel = poly.topFlightLevel
      ? `${poly.baseFlightLevel || 'SFC'} → ${poly.topFlightLevel}`
      : adv.primaryFlightLevel;
    const movement = poly.movementDirection
      ? `${poly.movementDirection} ${poly.movementSpeed || ''}`.trim()
      : adv.primaryMovement;

    return {
      status: 'ASH_AREA',
      statusLabel: 'ASH AREA',
      statusDescription: 'This location is currently inside an active volcanic ash area.',
      locationName,
      coordinates: location,
      affectedVolcano: adv.volcanoName,
      affectedAdvisory: adv,
      polygonType: poly.type,
      flightLevel,
      humanAltitude: formatFlightLevelHuman(flightLevel),
      movement,
      humanMovement: formatMovementHuman(movement),
      validTime: 'Current advisory',
      nearestAshDistanceKm: 0,
      nearestVolcanoName: adv.volcanoName,
    };
  }

  // CASE 3: Inside FORECAST ash polygon but outside observed
  if (forecastHit) {
    const adv = forecastHit.advisory;
    const poly = forecastHit.polygon;
    const flightLevel = poly.topFlightLevel
      ? `${poly.baseFlightLevel || 'SFC'} → ${poly.topFlightLevel}`
      : adv.primaryFlightLevel;
    const movement = poly.movementDirection
      ? `${poly.movementDirection} ${poly.movementSpeed || ''}`.trim()
      : adv.primaryMovement;

    return {
      status: 'FORECAST_OVERLAP',
      statusLabel: 'FORECAST ASH',
      statusDescription:
        'This location is currently outside observed ash, but a forecast ash area overlaps this location.',
      locationName,
      coordinates: location,
      affectedVolcano: adv.volcanoName,
      affectedAdvisory: adv,
      polygonType: poly.type,
      flightLevel,
      humanAltitude: formatFlightLevelHuman(flightLevel),
      movement,
      humanMovement: formatMovementHuman(movement),
      forecastHorizon: forecastHit.horizon,
      nearestAshDistanceKm: nearestAshDistance,
      nearestVolcanoName: adv.volcanoName,
    };
  }

  // CASE 1: CLEAR (outside all active ash polygons)
  return {
    status: 'CLEAR',
    statusLabel: 'CLEAR',
    statusDescription: 'No active volcanic ash detected in this area.',
    locationName,
    coordinates: location,
    nearestAshDistanceKm: nearestAshDistance,
    nearestVolcanoName,
  };
}
