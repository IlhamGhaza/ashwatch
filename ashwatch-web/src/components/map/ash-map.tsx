'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { VolcanoAdvisory, AshPolygon, PolygonType } from '@/lib/types';
import { getVolcanoColor, getPolygonOpacity } from '@/lib/palette';
import { formatUtcDateTime, formatWibDateTime } from '@/lib/parser/date-utils';
import {
  Crosshair,
  RefreshCw,
  Wind,
  Flame,
  X,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
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
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Clean standard OpenStreetMap basemap
      const map = L.map(mapContainerRef.current, {
        center: [-3.5, 104.0],
        zoom: 5.5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

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

  // Update Polygons & Markers
  useEffect(() => {
    async function updateLayers() {
      const map = mapInstanceRef.current;
      const polyGroup = polygonLayerGroupRef.current;
      const markerGroup = markerLayerGroupRef.current;

      if (!map || !polyGroup || !markerGroup) return;

      const L = (await import('leaflet')).default;

      polyGroup.clearLayers();
      markerGroup.clearLayers();

      advisories.forEach((advisory) => {
        const volcanoColor = getVolcanoColor(advisory.volcanoName);

        // Render Volcano Marker matching Image 2
        if (advisory.position) {
          const lat = advisory.position.latitude;
          const lng = advisory.position.longitude;

          // Find movement if available
          const primaryPoly = advisory.polygons.find((p) => p.coordinates.length > 0);
          const movText = primaryPoly?.movementDirection && primaryPoly?.movementSpeed
            ? `${primaryPoly.movementDirection} ${primaryPoly.movementSpeed}`
            : '';

          const markerHtml = `
            <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border" style="border-color: ${volcanoColor}40; box-shadow: 0 0 10px ${volcanoColor}80;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${volcanoColor}">
                  <path d="M18 20H6l4.5-9h3L18 20z"/>
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="8.5" cy="7" r="1.5"/>
                  <circle cx="15.5" cy="7" r="1.5"/>
                </svg>
              </div>
              <div class="mt-1 whitespace-nowrap rounded px-1.5 py-0.5 shadow-sm text-center border border-black/5" style="background-color: rgba(255, 255, 255, 0.92); box-shadow: 0 1px 3px rgba(0,0,0,0.25);">
                <span style="color: ${volcanoColor}; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; display: block; line-height: 1.1;">
                  ${advisory.volcanoName}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'volcano-pin-marker',
            iconSize: [0, 0],
          });

          const marker = L.marker([lat, lng], { icon: customIcon });

          marker.on('click', () => {
            setSelectedAdvisory(advisory);
            map.flyTo([lat, lng], 7.5, { duration: 1 });
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

          const latLngs: [number, number][] = ashPoly.coordinates.map((c) => [
            c.latitude,
            c.longitude,
          ]);

          const opacity = getPolygonOpacity(ashPoly.type);

          const polygon = L.polygon(latLngs, {
            color: volcanoColor,
            weight: 2,
            opacity: Math.min(1, opacity + 0.35),
            fillColor: volcanoColor,
            fillOpacity: opacity,
          });

          // Permanent center label matching Image 2 for observed polygons
          if (ashPoly.type === 'observed' || ashPoly.type === 'estimated') {
            const fl = ashPoly.topFlightLevel || '';
            const mov = ashPoly.movementDirection && ashPoly.movementSpeed
              ? `${ashPoly.movementDirection} ${ashPoly.movementSpeed}`
              : (ashPoly.movementDirection || '');
            const labelText = fl && mov ? `${fl}<br/>${mov}` : (fl || advisory.volcanoName);

            polygon.bindTooltip(
              `<div class="ash-polygon-center-label">${labelText}</div>`,
              {
                permanent: true,
                direction: 'center',
                className: 'ash-polygon-center-label',
              }
            );
          }

          polygon.on('click', () => {
            setSelectedAdvisory(advisory);
          });

          polyGroup.addLayer(polygon);
        });
      });
    }

    updateLayers();
  }, [advisories]);

  // Fit bounds helper matching Indonesian archipelago view
  const fitAllAdvisories = async (map: LeafletMap, advs: VolcanoAdvisory[]) => {
    const L = (await import('leaflet')).default;
    const points: [number, number][] = [];

    advs.forEach((a) => {
      if (a.position) points.push([a.position.latitude, a.position.longitude]);
      a.polygons.forEach((p) => {
        p.coordinates.forEach((c) => {
          // Clamp points so bounds stay focused on Indonesian archipelago and nearby plume
          const lat = Math.max(-12.0, Math.min(6.5, c.latitude));
          const lng = Math.max(95.0, Math.min(141.0, c.longitude));
          points.push([lat, lng]);
        });
      });
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6.5 });
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
            <div class="relative flex h-7 w-7 items-center justify-center">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></span>
            </div>
          `;

          const userMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              html: userIconHtml,
              className: 'user-location-marker',
              iconSize: [28, 28],
            }),
          }).bindPopup('<b>Your Current Location</b>');

          userGroup.addLayer(userMarker);
          map.flyTo([latitude, longitude], 8, { duration: 1.2 });
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
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Top Header matching Image 2 */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none sm:left-6 sm:right-6">
        {/* Title */}
        <div className="pointer-events-auto rounded-2xl bg-white/95 px-4 py-2.5 shadow-xl border border-slate-200/80 backdrop-blur-md">
          <h1 className="text-lg font-black text-slate-900 leading-tight">
            Volcanic Ash
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Darwin VAAC
          </p>
        </div>

        {/* Action Buttons matching Image 2 */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95"
            title="Locate my position (GPS)"
            aria-label="Locate me"
          >
            <Crosshair className={`h-5 w-5 ${isLocating ? 'animate-pulse text-blue-400' : ''}`} />
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              title="Refresh Darwin VAAC advisories"
              aria-label="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Floating Ash Layers Legend (Bottom Left) matching Image 2 */}
      <div className="absolute bottom-44 left-4 z-[400] sm:bottom-48 sm:left-6 pointer-events-auto">
        <div className="rounded-xl bg-white/95 p-3 shadow-xl border border-slate-200/80 backdrop-blur-md">
          <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
            ASH LAYERS
          </span>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-sm bg-red-500/55 border border-red-500" />
              <span className="font-medium">Observed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-sm bg-red-500/40 border border-red-500/70" />
              <span className="font-medium">Forecast +6h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-sm bg-red-500/28 border border-red-500/50" />
              <span className="font-medium">Forecast +12h</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-sm bg-red-500/18 border border-red-500/30" />
              <span className="font-medium">Forecast +18h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet Drawer matching Image 2 */}
      <div className="absolute bottom-0 left-0 right-0 z-[450] pointer-events-auto flex flex-col items-center">
        <div
          className={`w-full max-w-2xl rounded-t-3xl bg-white/98 shadow-2xl border-t border-slate-200/90 backdrop-blur-md transition-all duration-300 ${
            isSheetExpanded ? 'max-h-72 sm:max-h-80' : 'max-h-16'
          }`}
        >
          {/* Drag Handle & Toggle */}
          <button
            onClick={() => setIsSheetExpanded(!isSheetExpanded)}
            className="w-full flex flex-col items-center pt-2.5 pb-1 focus:outline-none"
            aria-label="Toggle active advisories list"
          >
            <div className="h-1 w-10 rounded-full bg-slate-300" />
          </button>

          {/* Header Row */}
          <div className="px-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  Active Advisories: {advisories.length}
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">
                {advisories[0] ? formatUtcDateTime(advisories[0].dtg).split(' ')[1] : '00:00'} UTC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Source: Bureau of Meteorology — Darwin VAAC
            </p>
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Volcano List Tiles matching VolcanoListTile.dart */}
          {isSheetExpanded && (
            <div className="max-h-52 sm:max-h-60 overflow-y-auto px-4 py-2 divide-y divide-slate-100">
              {advisories.map((adv) => {
                const color = getVolcanoColor(adv.volcanoName);

                return (
                  <button
                    key={adv.id}
                    onClick={() => {
                      setSelectedAdvisory(adv);
                      if (adv.position && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(
                          [adv.position.latitude, adv.position.longitude],
                          7.5,
                          { duration: 1 }
                        );
                      }
                    }}
                    className="w-full flex items-center justify-between py-3 px-2 text-left hover:bg-slate-50 rounded-xl transition"
                    style={{ borderLeft: `3.5px solid ${color}` }}
                  >
                    <div className="flex items-center gap-3 pl-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shadow-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">
                          {adv.volcanoName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                            style={{
                              backgroundColor: `${color}15`,
                              color: color,
                            }}
                          >
                            {adv.primaryFlightLevel}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {adv.noVaExpected
                              ? 'No VA Expected'
                              : adv.vaNotIdentifiable
                              ? 'VA Not Identifiable'
                              : adv.polygons.length > 0
                              ? adv.polygons.map((p) => p.type === 'observed' ? 'Observed' : p.type === 'forecast6h' ? '+6h' : p.type === 'forecast12h' ? '+12h' : '+18h').join(' · ')
                              : 'No polygons'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Advisory Detail Modal (when clicked) */}
      {selectedAdvisory && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full shrink-0 shadow"
                  style={{ backgroundColor: getVolcanoColor(selectedAdvisory.volcanoName) }}
                />
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedAdvisory.volcanoName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Advisory #{selectedAdvisory.advisoryNumber} · {selectedAdvisory.area}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdvisory(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Flight Level (Altitude):</span>
                <span className="font-bold text-red-600 text-sm">
                  {selectedAdvisory.primaryFlightLevel}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Movement Vector:</span>
                <span className="font-bold text-amber-600 text-sm">
                  {selectedAdvisory.primaryMovement}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Issued Timestamp (WIB):</span>
                <span className="font-semibold text-slate-800">
                  {formatWibDateTime(selectedAdvisory.dtg)}
                </span>
              </div>

              {selectedAdvisory.sourceElevation && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Summit Elevation:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedAdvisory.sourceElevation}
                  </span>
                </div>
              )}

              {selectedAdvisory.eruptionDetails && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1 font-semibold">
                    Eruption Details:
                  </span>
                  <p className="bg-slate-50 rounded-xl p-3 font-mono text-[11px] text-slate-800 border border-slate-200/80 leading-relaxed">
                    {selectedAdvisory.eruptionDetails}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-2">
              <a
                href={`/volcanoes/${selectedAdvisory.volcanoSlug}`}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span>Volcano Profile</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>

              <a
                href={`/advisories/${selectedAdvisory.id}`}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition"
              >
                <span>Full Bulletin</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
