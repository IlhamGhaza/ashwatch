'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import { VolcanoAdvisory, AshPolygon, PolygonType } from '@/lib/types';
import { getVolcanoColor, getPolygonOpacity } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import {
  Crosshair,
  Maximize2,
  RefreshCw,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Radio,
  Layers,
  Navigation,
} from 'lucide-react';

interface AshMapProps {
  advisories: VolcanoAdvisory[];
  onRefresh?: () => void;
  isLoading?: boolean;
  updatedAt: string;
  source: 'bom' | 'fallback';
  totalActive: number;
}

export default function AshMap({
  advisories,
  onRefresh,
  isLoading,
  updatedAt,
  source,
  totalActive,
}: AshMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const polygonLayerGroupRef = useRef<LayerGroup | null>(null);
  const markerLayerGroupRef = useRef<LayerGroup | null>(null);
  const userLocationLayerRef = useRef<LayerGroup | null>(null);

  const [selectedAdvisory, setSelectedAdvisory] = useState<VolcanoAdvisory | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

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
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Auto-select first advisory with polygons
  useEffect(() => {
    if (!selectedAdvisory && advisories.length > 0) {
      const krakatau = advisories.find(
        (a) => a.volcanoName.toUpperCase() === 'KRAKATAU'
      );
      const target =
        krakatau ||
        advisories.find((a) => a.polygons.some((p) => p.coordinates.length >= 3)) ||
        advisories[0];
      setSelectedAdvisory(target);
    }
  }, [advisories, selectedAdvisory]);

  // Filter advisories
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

  // Format UTC time for display
  const utcTime = useMemo(() => {
    try {
      const d = new Date(updatedAt);
      return d.toISOString().slice(11, 16) + ' UTC';
    } catch {
      return '--:-- UTC';
    }
  }, [updatedAt]);

  // Initialize Leaflet Map with dark tiles
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [-4.0, 106.0],
        zoom: 5.5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Dark Matter — clean dark tiles for aviation monitoring
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
          maxZoom: 20,
          subdomains: 'abcd',
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

      fitAllAdvisories(map, advisories);
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      setIsMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Polygons & Markers
  useEffect(() => {
    if (!isMapReady) return;

    async function updateLayers() {
      const map = mapInstanceRef.current;
      const polyGroup = polygonLayerGroupRef.current;
      const markerGroup = markerLayerGroupRef.current;

      if (!map || !polyGroup || !markerGroup) return;

      const L = (await import('leaflet')).default;

      polyGroup.clearLayers();
      markerGroup.clearLayers();

      filteredAdvisories.forEach((advisory) => {
        const volcanoColor = getVolcanoColor(advisory.volcanoName);

        // Volcano marker — clean circle with subtle glow
        if (advisory.position) {
          const lat = advisory.position.latitude;
          const lng = advisory.position.longitude;

          const markerHtml = `
            <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
              <div style="
                width: 28px; height: 28px;
                border-radius: 50%;
                background: ${volcanoColor};
                border: 2px solid rgba(255,255,255,0.85);
                box-shadow: 0 0 12px ${volcanoColor}80, 0 0 24px ${volcanoColor}40;
                display: flex; align-items: center; justify-content: center;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M18 20H6l4.5-9h3L18 20z"/>
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="8.5" cy="7" r="1.5"/>
                  <circle cx="15.5" cy="7" r="1.5"/>
                </svg>
              </div>
              <div style="
                margin-top: 3px;
                padding: 1px 6px;
                border-radius: 3px;
                background: rgba(10, 22, 40, 0.88);
                border: 1px solid rgba(26, 45, 74, 0.5);
                white-space: nowrap;
                text-align: center;
              ">
                <span style="color: #e8edf5; font-size: 9px; font-weight: 700; letter-spacing: 0.4px;">${advisory.volcanoName}</span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: 'volcano-pin-marker',
            iconSize: [0, 0],
          });

          const marker = L.marker([lat, lng], { icon: customIcon });

          marker.bindTooltip(
            `
              <div class="text-center">
                <div class="font-bold" style="color: ${volcanoColor}">${advisory.volcanoName}</div>
                <div style="font-size: 10px; color: #c4d4e8;">Alt: ${advisory.primaryFlightLevel}</div>
                <div style="font-size: 10px; color: #f59e0b;">Mov: ${advisory.primaryMovement}</div>
              </div>
            `,
            { direction: 'top', offset: [0, -16], className: 'leaflet-tooltip' }
          );

          marker.on('click', () => {
            setSelectedAdvisory(advisory);
            map.flyTo([lat, lng], 6.5, { duration: 1.2 });
          });

          markerGroup.addLayer(marker);
        }

        // Ash Polygons
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

          if (ashPoly.type === 'observed' && !activeLayers.observed) return;
          if (ashPoly.type === 'estimated' && !activeLayers.observed) return;
          if (ashPoly.type === 'forecast6h' && !activeLayers.forecast6h) return;
          if (ashPoly.type === 'forecast12h' && !activeLayers.forecast12h) return;
          if (ashPoly.type === 'forecast18h' && !activeLayers.forecast18h) return;

          const latLngs: [number, number][] = ashPoly.coordinates.map((c) => [
            c.latitude,
            c.longitude,
          ]);

          const opacity = getPolygonOpacity(ashPoly.type);

          const polygon = L.polygon(latLngs, {
            color: volcanoColor,
            weight: 1.5,
            opacity: Math.min(1, opacity + 0.3),
            fillColor: volcanoColor,
            fillOpacity: opacity,
          });

          // Center label for observed/estimated
          if (ashPoly.type === 'observed' || ashPoly.type === 'estimated') {
            const fl = ashPoly.topFlightLevel || '';
            const mov =
              ashPoly.movementDirection && ashPoly.movementSpeed
                ? `${ashPoly.movementDirection} ${ashPoly.movementSpeed}`
                : (ashPoly.movementDirection || '');

            let labelHtml = '';
            if (fl && mov) {
              labelHtml = `<div class="ash-polygon-center-label">${fl}<br/>${mov}</div>`;
            } else if (fl) {
              labelHtml = `<div class="ash-polygon-center-label">${fl}</div>`;
            }

            if (labelHtml) {
              const center = polygon.getBounds().getCenter();
              const centerMarker = L.marker(center, {
                icon: L.divIcon({
                  html: labelHtml,
                  className: 'ash-polygon-center-label-wrapper',
                  iconSize: [0, 0],
                }),
                interactive: false,
              });
              polyGroup.addLayer(centerMarker);
            }
          }

          // Tooltip
          const flLabel = ashPoly.topFlightLevel
            ? `${ashPoly.baseFlightLevel || 'SFC'} → ${ashPoly.topFlightLevel}`
            : advisory.primaryFlightLevel;
          const movLabel = ashPoly.movementDirection
            ? `${ashPoly.movementDirection} ${ashPoly.movementSpeed || ''}`
            : '';

          polygon.bindTooltip(
            `
              <div class="text-center">
                <div class="font-bold" style="color: ${volcanoColor}">${advisory.volcanoName} [${ashPoly.type.toUpperCase()}]</div>
                <div style="font-size: 10px; color: #c4d4e8;">Alt: ${flLabel}</div>
                ${movLabel ? `<div style="font-size: 10px; color: #f59e0b;">Mov: ${movLabel}</div>` : ''}
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
  }, [filteredAdvisories, activeLayers, isMapReady]);

  // Fit bounds
  const fitAllAdvisories = async (map: LeafletMap, advs: VolcanoAdvisory[]) => {
    const L = (await import('leaflet')).default;
    const points: [number, number][] = [];

    advs.forEach((a) => {
      if (a.position) points.push([a.position.latitude, a.position.longitude]);
      a.polygons.forEach((p) => {
        p.coordinates.forEach((c) => {
          const lat = Math.max(-12.0, Math.min(6.5, c.latitude));
          const lng = Math.max(95.0, Math.min(141.0, c.longitude));
          points.push([lat, lng]);
        });
      });
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6.5 });
    }
  };

  // Geolocation
  const handleLocateUser = async () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
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

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Layer type label helper
  const getLayerTypes = (adv: VolcanoAdvisory): string[] => {
    const types = new Set<string>();
    adv.polygons.forEach((p) => {
      if (p.type === 'observed' || p.type === 'estimated') types.add('Observed');
      if (p.type === 'forecast6h') types.add('+6h');
      if (p.type === 'forecast12h') types.add('+12h');
      if (p.type === 'forecast18h') types.add('+18h');
    });
    return Array.from(types);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a1628]">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* ─── Top Left: Source Badge ─── */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-auto">
        <div className="telemetry-panel px-3 py-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${source === 'bom' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex h-2 w-2 rounded-full ${source === 'bom' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-slate-300 uppercase">
              {source === 'bom' ? 'Darwin VAAC' : 'Fallback'}
            </span>
          </div>
          <div className="h-3 w-px bg-[#1a2d4a]" />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-[#5a7396]" />
            <span className="text-[10px] font-mono font-semibold text-slate-400">{utcTime}</span>
          </div>
          <div className="h-3 w-px bg-[#1a2d4a]" />
          <span className="text-[10px] font-bold text-orange-400">
            {totalActive} Active
          </span>
        </div>
      </div>

      {/* ─── Top Right: Controls ─── */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg telemetry-panel text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        )}

        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          className="flex h-9 w-9 items-center justify-center rounded-lg telemetry-panel text-slate-400 hover:text-white transition"
          title="Locate me (GPS)"
          aria-label="Locate me"
        >
          <Navigation className={`h-4 w-4 ${isLocating ? 'animate-pulse text-blue-400' : ''}`} />
        </button>

        <button
          onClick={handleToggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-lg telemetry-panel text-slate-400 hover:text-white transition"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Bottom Left: Ash Layers Legend ─── */}
      <div className="absolute bottom-[calc(theme(spacing.4)+220px)] sm:bottom-4 left-4 z-[400] pointer-events-auto">
        <div className="telemetry-panel px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="h-3 w-3 text-[#5a7396]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a7396]">Ash Layers</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveLayers((p) => ({ ...p, observed: !p.observed }))}
              className={`flex items-center gap-2 text-[11px] font-medium transition ${
                activeLayers.observed ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              <span className={`h-3 w-5 rounded-sm ${activeLayers.observed ? 'bg-orange-500' : 'bg-slate-700'}`} />
              <span>Observed</span>
            </button>

            <button
              onClick={() => setActiveLayers((p) => ({ ...p, forecast6h: !p.forecast6h }))}
              className={`flex items-center gap-2 text-[11px] font-medium transition ${
                activeLayers.forecast6h ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              <span className={`h-3 w-5 rounded-sm ${activeLayers.forecast6h ? 'bg-orange-400/70' : 'bg-slate-700'}`} />
              <span>Forecast +6h</span>
            </button>

            <button
              onClick={() => setActiveLayers((p) => ({ ...p, forecast12h: !p.forecast12h }))}
              className={`flex items-center gap-2 text-[11px] font-medium transition ${
                activeLayers.forecast12h ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              <span className={`h-3 w-5 rounded-sm ${activeLayers.forecast12h ? 'bg-orange-300/50' : 'bg-slate-700'}`} />
              <span>Forecast +12h</span>
            </button>

            <button
              onClick={() => setActiveLayers((p) => ({ ...p, forecast18h: !p.forecast18h }))}
              className={`flex items-center gap-2 text-[11px] font-medium transition ${
                activeLayers.forecast18h ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              <span className={`h-3 w-5 rounded-sm ${activeLayers.forecast18h ? 'bg-orange-200/35' : 'bg-slate-700'}`} />
              <span>Forecast +18h</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bottom Panel: Advisory List + Detail ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-[450] pointer-events-auto">
        <div className="telemetry-panel mx-0 sm:mx-4 sm:mb-4 rounded-t-xl sm:rounded-xl overflow-hidden" style={{ borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          {/* Panel Header */}
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-orange-500 status-pulse" />
                <span className="text-sm font-bold text-white">
                  Active Advisories: {filteredAdvisories.length}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{utcTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                Source: {source === 'bom' ? 'Bureau of Meteorology — Darwin VAAC' : 'Fallback Data'}
              </span>
              {isPanelExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              )}
            </div>
          </button>

          {/* Search bar */}
          {isPanelExpanded && (
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Filter volcano or FL..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full rounded-md bg-[#0a1628] border border-[#1a2d4a] px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/40 transition"
              />
            </div>
          )}

          {/* Advisory List */}
          {isPanelExpanded && (
            <div className="max-h-48 overflow-y-auto border-t border-[#1a2d4a]">
              {filteredAdvisories.map((adv) => {
                const color = getVolcanoColor(adv.volcanoName);
                const isSelected = selectedAdvisory?.id === adv.id;
                const layerTypes = getLayerTypes(adv);

                return (
                  <button
                    key={adv.id}
                    onClick={() => {
                      setSelectedAdvisory(adv);
                      if (adv.position && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(
                          [adv.position.latitude, adv.position.longitude],
                          6.5,
                          { duration: 1.2 }
                        );
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition border-b border-[#1a2d4a]/50 ${
                      isSelected
                        ? 'bg-orange-500/[0.06]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                      />
                      <div>
                        <span className="text-xs font-bold text-white">{adv.volcanoName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-orange-400 bg-orange-500/10 px-1.5 py-0 rounded">
                            {adv.primaryFlightLevel}
                          </span>
                          {layerTypes.map((lt) => (
                            <span
                              key={lt}
                              className="text-[9px] text-slate-500 bg-[#0a1628] px-1 rounded"
                            >
                              {lt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition ${isSelected ? 'text-orange-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Advisory Detail */}
          {isPanelExpanded && selectedAdvisory && (
            <div className="border-t border-orange-500/20 bg-orange-500/[0.03] px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: getVolcanoColor(selectedAdvisory.volcanoName),
                      boxShadow: `0 0 8px ${getVolcanoColor(selectedAdvisory.volcanoName)}60`,
                    }}
                  />
                  <h3 className="text-sm font-bold text-white">{selectedAdvisory.volcanoName}</h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    #{selectedAdvisory.advisoryNumber}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAdvisory(null)}
                  className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white transition"
                  aria-label="Dismiss detail"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
                <div>
                  <span className="telemetry-label">Issued DTG</span>
                  <p className="telemetry-value mt-0.5">{formatWibDateTime(selectedAdvisory.dtg)}</p>
                </div>
                <div>
                  <span className="telemetry-label">Flight Level</span>
                  <p className="telemetry-value telemetry-accent mt-0.5">{selectedAdvisory.primaryFlightLevel}</p>
                </div>
                <div>
                  <span className="telemetry-label">Movement</span>
                  <p className="telemetry-value mt-0.5" style={{ color: '#f59e0b' }}>{selectedAdvisory.primaryMovement}</p>
                </div>
                <div>
                  <span className="telemetry-label">Area</span>
                  <p className="telemetry-value mt-0.5">{selectedAdvisory.area}</p>
                </div>
              </div>

              {selectedAdvisory.eruptionDetails && (
                <div className="mt-2">
                  <span className="telemetry-label">Eruption Details</span>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono leading-relaxed bg-[#0a1628] rounded px-2 py-1.5 border border-[#1a2d4a]">
                    {selectedAdvisory.eruptionDetails}
                  </p>
                </div>
              )}

              <div className="mt-2.5 flex items-center gap-3">
                <a
                  href={`/volcanoes/${selectedAdvisory.volcanoSlug}`}
                  className="text-[11px] font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                >
                  <span>Volcano Profile</span>
                  <ChevronRight className="h-3 w-3" />
                </a>
                <a
                  href={`/advisories/${selectedAdvisory.id}`}
                  className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20"
                >
                  <span>Full Bulletin</span>
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
