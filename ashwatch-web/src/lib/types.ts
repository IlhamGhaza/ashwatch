export type LatLngTuple = [number, number]; // [lat, lon]

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type PolygonType = 
  | 'observed' 
  | 'estimated' 
  | 'forecast6h' 
  | 'forecast12h' 
  | 'forecast18h';

export interface AshPolygon {
  type: PolygonType;
  coordinates: LatLng[];
  validTime?: string | null; // ISO string
  baseFlightLevel?: string | null;
  topFlightLevel?: string | null;
  movementDirection?: string | null;
  movementSpeed?: string | null;
}

export interface VolcanoAdvisory {
  id: string; // generated unique slug or number e.g. semeru-2026-1010
  volcanoName: string;
  volcanoSlug: string;
  volcanoCode?: string;
  position?: LatLng | null;
  area: string;
  sourceElevation?: string | null;
  advisoryNumber: string;
  dtg: string; // ISO string in UTC
  dtgRaw: string; // e.g. "20260904/1400Z"
  eruptionDetails?: string | null;
  infoSource?: string | null;
  remarks?: string | null;
  nextAdvisory?: string | null;
  polygons: AshPolygon[];
  noVaExpected: boolean;
  vaNotIdentifiable: boolean;
  primaryFlightLevel: string;
  primaryMovement: string;
}

export interface VolcanoInfo {
  name: string;
  slug: string;
  elevation: string;
  location: string;
  island: string;
  coordinates: LatLng;
  status: 'Active' | 'Unrest' | 'Normal';
  description: string;
  aviationSignificance: string;
}
