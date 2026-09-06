'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Map as LeafletMap, LayerGroup, Polygon as LeafletPolygon } from 'leaflet';
import { VolcanoAdvisory, AshPolygon, PolygonType } from '@/lib/types';
import { getVolcanoColor, getPolygonOpacity } from '@/lib/palette';
import { formatUtcDateTime, formatWibDateTime } from '@/lib/parser/date-utils';
import {
  Layers,
  Crosshair,
  Maximize2,
  RefreshCw,
  Wind,
  Compass,
  AlertTriangle,
  Flame,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AshMapProps {
  advisories: VolcanoAdvisory[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function AshMap({ advisories, onRefresh, isLoading }: AshMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const polygonLayerGroupRef = useRef<LayerGroup | null>(null);
  const markerLayerGroupRef = useRef<LayerGroup | null>(null);
  const userLocationLayerRef = useRef<LayerGroup | null>(null);

  const [selectedAdvisory, setSelectedAdvisory] = useState<VolcanoAdvisory | null>(null);
  const [activeLayers, setActiveLayers] = useState<{
    observed: boolean;
    forecast6h: boolean;
    forecast12h: boolean;
    forecast18h: boolean;
  }>({
    observed: true,
    forecast6h: true,
    forecast12h: true,
    forecast18h: true,
  });

  const [filterQuery, setFilterQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const filteredAdvisories = useMemo(() => {
    if (!filterQuery.trim()) return advisories;
    const q = filterQuery.toLowerCase();
    return advisories.filter(
      (a) =>
        a.volcanoName.toLowerCase().includes(q) ||
        a.primaryFlightLevel.toLowerCase().includes(q) ||
        a.advisoryNumber.toLowerCase().includes(q)
    );
  }, [advisories, filterQuery]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Dark CartoDB basemap with OpenStreetMap data
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const polyGroup = L.layerGroup().addTo(map);
      const markerGroup = L.layerGroup().addTo(map);
      const userGroup = L.layerGroup().addTo(map);

      polygonLayerGroupRef.current = polyGroup;
      markerLayerGroupRef.current = markerGroup;
      userLocationLayerRef.current = userGroup;
      mapInstanceRef.current = map;

      // Fit bounds if advisories exist
      fitAllAdvisories(map, advisories);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Polygons & Markers when advisories or activeLayers change
  useEffect(() => {
    async function updateLayers() {
      const map = mapInstanceRef.current;
      const polyGroup = polygonLayerGroupRef.current;
      const markerGroup = markerLayerGroupRef.current;

      if (!map || !polyGroup || !markerGroup) return;

      const L = (await import('leaflet')).default;

      polyGroup.clearLayers();
      markerGroup.clearLayers();

      const allCoordinates: [number, number][] = [];

      filteredAdvisories.forEach((advisory) => {
        const volcanoColor = getVolcanoColor(advisory.volcanoName);

        // Render Volcano Marker
        if (advisory.position) {
          const lat = advisory.position.latitude;
          const lng = advisory.position.longitude;
          allCoordinates.push([lat, lng]);

          const markerHtml = `
            <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -50%);">
              <div class="relative flex h-8 w-8 items-center justify-center">
                <div class="pulse-marker-ring" style="background-color: ${volcanoColor}55;"></div>
                <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border-2 shadow-lg" style="border-color: ${volcanoColor};">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${volcanoColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m8 2 1.88 4.22a2 2 0 0 0 1.24 1.25L15 8.5l-3.88 1.03a2 2 0 0 0-1.24 1.25L8 15l-1.88-4.22a2 2 0 0 0-1.24-1.25L1 8.5l3.88-1.03a2 2 0 0 0 1.24-1.25L8 2z"/>
                  </svg>
                </div>
              </div>
              <div class="mt-0.5 whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold shadow-md border border-slate-700" style="color: ${volcanoColor};">
                ${advisory.volcanoName}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'volcano-custom-marker',
            iconSize: [0, 0],
          });

          const marker = L.marker([lat, lng], { icon: customIcon });

          marker.on('click', () => {
            setSelectedAdvisory(advisory);
            map.flyTo([lat, lng], 8, { duration: 1 });
          });

          markerGroup.addLayer(marker);
        }

        // Render Ash Polygons
        // Sort order: +18h, +12h, +6h, observed/estimated on top
        const sortedPolygons = [...advisory.polygons].sort((a, b) => {
          const order: Record<PolygonType, number> = {
            forecast18h: 0,
            forecast12h: 1,
            forecast6h: 2,
            estimated: 3,
            observed: 4,
          };
          return (order[a.type] ?? 0) - (order[b.type] ?? 0);
        });

        sortedPolygons.forEach((ashPoly) => {
          if (ashPoly.coordinates.length < 3) return;

          // Check if layer is toggled on
          if (ashPoly.type === 'observed' && !activeLayers.observed) return;
          if (ashPoly.type === 'estimated' && !activeLayers.observed) return;
          if (ashPoly.type === 'forecast6h' && !activeLayers.forecast6h) return;
          if (ashPoly.type === 'forecast12h' && !activeLayers.forecast12h) return;
          if (ashPoly.type === 'forecast18h' && !activeLayers.forecast18h) return;

          const latLngs: [number, number][] = ashPoly.coordinates.map((c) => [
            c.latitude,
            c.longitude,
          ]);

          latLngs.forEach((coord) => allCoordinates.push(coord));

          const opacity = getPolygonOpacity(ashPoly.type);

          const polygon = L.polygon(latLngs, {
            color: volcanoColor,
            weight: 2,
            opacity: Math.min(1, opacity + 0.35),
            fillColor: volcanoColor,
            fillOpacity: opacity,
          });

          // Informative tooltip matching Flutter app
          const flLabel = ashPoly.topFlightLevel
            ? `${ashPoly.baseFlightLevel || 'SFC'} → ${ashPoly.topFlightLevel}`
            : advisory.primaryFlightLevel;
          const movLabel = ashPoly.movementDirection
            ? `${ashPoly.movementDirection} ${ashPoly.movementSpeed || ''}`
            : '';

          polygon.bindTooltip(
            `
              <div class="text-center">
                <div class="font-bold text-red-400">${advisory.volcanoName} [${ashPoly.type.toUpperCase()}]</div>
                <div class="text-[10px] text-slate-200">Alt: ${flLabel}</div>
                ${movLabel ? `<div class="text-[10px] text-amber-300">Mov: ${movLabel}</div>` : ''}
              </div>
            `,
            { sticky: true, className: 'leaflet-tooltip' }
          );

          polygon.on('click', () => {
            setSelectedAdvisory(advisory);
          });

          polyGroup.addLayer(polygon);
        });
      });
    }

    updateLayers();
  }, [filteredAdvisories, activeLayers]);

  // Fit bounds helper
  const fitAllAdvisories = async (map: LeafletMap, advs: VolcanoAdvisory[]) => {
    const L = (await import('leaflet')).default;
    const points: [number, number][] = [];

    advs.forEach((a) => {
      if (a.position) points.push([a.position.latitude, a.position.longitude]);
      a.polygons.forEach((p) => {
        p.coordinates.forEach((c) => points.push([c.latitude, c.longitude]));
      });
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  };

  // Locate User Geolocation
  const handleLocateUser = async () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);

        const L = (await import('leaflet')).default;
        const map = mapInstanceRef.current;
        const userGroup = userLocationLayerRef.current;

        if (map && userGroup) {
          userGroup.clearLayers();

          const userIconHtml = `
            <div class="relative flex h-6 w-6 items-center justify-center">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white shadow-md"></span>
            </div>
          `;

          const userMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: userIconHtml,
              className: 'user-location-marker',
              iconSize: [24, 24],
            }),
          }).bindPopup('<b>Your Current Location</b>');

          userGroup.addLayer(userMarker);
          map.flyTo([latitude, longitude], 9, { duration: 1.2 });
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Header / Search & Stats Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none sm:flex-row sm:items-center sm:justify-between sm:left-6 sm:right-6">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-md">
          <Filter className="h-4 w-4 text-slate-400 ml-1.5" />
          <input
            type="text"
            placeholder="Search volcano or FL..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-40 sm:w-56 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="text-slate-400 hover:text-white mr-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-[11px] font-semibold text-red-400 px-1.5 whitespace-nowrap">
            {filteredAdvisories.length} Volcanoes Active
          </span>
        </div>

        {/* Map Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-850 hover:text-white transition disabled:opacity-50"
              title="Refresh Darwin VAAC data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-400' : ''}`} />
            </button>
          )}

          <button
            onClick={() => mapInstanceRef.current && fitAllAdvisories(mapInstanceRef.current, advisories)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-850 hover:text-white transition"
            title="Fit view to all active ash plumes"
            aria-label="Fit bounds"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 shadow-xl backdrop-blur-md transition ${
              userCoords ? 'text-blue-400 border-blue-500/40' : 'text-slate-300 hover:text-white'
            }`}
            title="Locate my position (GPS)"
            aria-label="Locate me"
          >
            <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-pulse text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Layer Filter Pill Legend */}
      <div className="absolute top-20 left-4 z-[400] flex flex-wrap gap-1.5 pointer-events-auto sm:left-6">
        <button
          onClick={() => setActiveLayers((p) => ({ ...p, observed: !p.observed }))}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-lg backdrop-blur-md ${
            activeLayers.observed
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Observed</span>
        </button>

        <button
          onClick={() => setActiveLayers((p) => ({ ...p, forecast6h: !p.forecast6h }))}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-lg backdrop-blur-md ${
            activeLayers.forecast6h
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <span>+6h</span>
        </button>

        <button
          onClick={() => setActiveLayers((p) => ({ ...p, forecast12h: !p.forecast12h }))}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-lg backdrop-blur-md ${
            activeLayers.forecast12h
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>+12h</span>
        </button>

        <button
          onClick={() => setActiveLayers((p) => ({ ...p, forecast18h: !p.forecast18h }))}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-lg backdrop-blur-md ${
            activeLayers.forecast18h
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span>+18h</span>
        </button>
      </div>

      {/* Volcano Quick Selector Rail (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-[400] max-w-sm hidden sm:block">
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {filteredAdvisories.map((adv) => {
            const color = getVolcanoColor(adv.volcanoName);
            const isSelected = selectedAdvisory?.id === adv.id;

            return (
              <button
                key={adv.id}
                onClick={() => {
                  setSelectedAdvisory(adv);
                  if (adv.position && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(
                      [adv.position.latitude, adv.position.longitude],
                      8,
                      { duration: 1 }
                    );
                  }
                }}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition border backdrop-blur-md shadow-lg ${
                  isSelected
                    ? 'bg-slate-900 border-red-500/80 ring-1 ring-red-500/50'
                    : 'bg-slate-950/85 border-slate-800/90 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold text-white">{adv.volcanoName}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {adv.primaryFlightLevel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advisory Detail Drawer (Bottom Right / Center on mobile) */}
      {selectedAdvisory && (
        <div className="absolute bottom-4 left-4 right-4 z-[450] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getVolcanoColor(selectedAdvisory.volcanoName) }}
              />
              <div>
                <h3 className="text-base font-black text-white">{selectedAdvisory.volcanoName}</h3>
                <p className="text-[11px] text-slate-400">
                  Advisory #{selectedAdvisory.advisoryNumber} · {selectedAdvisory.area}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAdvisory(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Issued DTG:</span>
              <span className="font-semibold text-slate-200">
                {formatWibDateTime(selectedAdvisory.dtg)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Flight Level (Alt):</span>
              <span className="font-bold text-red-400">
                {selectedAdvisory.primaryFlightLevel}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Movement Vector:</span>
              <span className="font-semibold text-amber-300">
                {selectedAdvisory.primaryMovement}
              </span>
            </div>

            {selectedAdvisory.sourceElevation && (
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Summit Elevation:</span>
                <span className="text-slate-200">{selectedAdvisory.sourceElevation}</span>
              </div>
            )}

            {selectedAdvisory.eruptionDetails && (
              <div className="py-1">
                <span className="text-slate-400 block mb-0.5">Eruption Details:</span>
                <p className="text-slate-200 bg-slate-900/80 rounded-lg p-2 font-mono text-[11px] leading-relaxed">
                  {selectedAdvisory.eruptionDetails}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 pt-2">
            <a
              href={`/volcanoes/${selectedAdvisory.volcanoSlug}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
            >
              <span>Volcano Profile</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </a>

            <a
              href={`/advisories/${selectedAdvisory.id}`}
              className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1 text-[11px] font-semibold text-red-400 border border-red-500/30 hover:bg-red-600/30"
            >
              <span>Full Bulletin</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
