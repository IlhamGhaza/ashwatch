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
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AshMapProps {
  advisories: VolcanoAdvisory[];
  onRefresh?: () => void;
  isLoading?: boolean;
  lastRefreshedAt?: string;
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'just now';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}m ago`;
}

export default function AshMap({ advisories, onRefresh, isLoading, lastRefreshedAt }: AshMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const polygonLayerGroupRef = useRef<LayerGroup | null>(null);
  const markerLayerGroupRef = useRef<LayerGroup | null>(null);
  const userLocationLayerRef = useRef<LayerGroup | null>(null);

  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    setMounted(true);
    setRelativeTime(getRelativeTime(lastRefreshedAt));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastRefreshedAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);

  // Selected volcano advisory (for the bottom-right card)
  const [selectedAdvisory, setSelectedAdvisory] = useState<VolcanoAdvisory | null>(null);

  // Layer visibility toggles (Observed, +6h, +12h, +18h)
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

  // Auto-select Krakatau or first advisory with polygons on initial load
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

  // Filter advisories by search query
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

      // Center comfortably on Western Indonesia (Sumatra, Sunda Strait, Java)
      const map = L.map(mapContainerRef.current, {
        center: [-4.0, 106.0],
        zoom: 5.5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
      });

      // Official OpenStreetMap tile layer (clean light map)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const polyGroup = L.layerGroup().addTo(map);
      const markerGroup = L.layerGroup().addTo(map);
      const userGroup = L.layerGroup().addTo(map);

      polygonLayerGroupRef.current = polyGroup;
      markerLayerGroupRef.current = markerGroup;
      userLocationLayerRef.current = userGroup;
      mapInstanceRef.current = map;

      // Fit bounds to show active volcano positions and nearby ash clouds
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

  // Update Polygons & Markers when advisories, activeLayers, or isMapReady change
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

        // 1. Render Volcano Marker matching Image 2 (Circle disk + Material Volcano icon + white name pill)
        if (advisory.position) {
          const lat = advisory.position.latitude;
          const lng = advisory.position.longitude;

          const markerHtml = `
            <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border" style="border-color: ${volcanoColor}50; box-shadow: 0 0 10px ${volcanoColor}99;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${volcanoColor}">
                  <path d="M18 20H6l4.5-9h3L18 20z"/>
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="8.5" cy="7" r="1.5"/>
                  <circle cx="15.5" cy="7" r="1.5"/>
                </svg>
              </div>
              <div class="mt-1 whitespace-nowrap rounded px-1.5 py-0.5 shadow-sm text-center border border-black/5" style="background-color: rgba(255, 255, 255, 0.95); box-shadow: 0 1px 3px rgba(0,0,0,0.25);">
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

          marker.bindTooltip(
            `
              <div class="text-center">
                <div class="font-bold text-red-400">${advisory.volcanoName}</div>
                <div class="text-[10px] text-slate-200">Alt: ${advisory.primaryFlightLevel}</div>
                <div class="text-[10px] text-amber-300">Mov: ${advisory.primaryMovement}</div>
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

        // 2. Render Ash Polygons with stacked opacities and centered labels matching Image 2
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

          const opacity = getPolygonOpacity(ashPoly.type);

          const polygon = L.polygon(latLngs, {
            color: volcanoColor,
            weight: 2,
            opacity: Math.min(1, opacity + 0.35),
            fillColor: volcanoColor,
            fillOpacity: opacity,
          });

          // Permanent bold center label inside observed/estimated polygons (e.g. FL500 \n W 30 KT) matching Image 2
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

          // Sticky hover tooltip with full layer details
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
  }, [filteredAdvisories, activeLayers, isMapReady]);

  // Fit bounds helper focusing on Indonesia & active plumes
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
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6.5 });
    }
  };

  // Locate User Geolocation
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

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Top Search & Filter Bar (Image 1) */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 pointer-events-auto sm:left-6">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 px-3 py-2 shadow-2xl backdrop-blur-md">
          <Filter className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search volcano or FL..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-40 sm:w-60 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30 whitespace-nowrap">
            {filteredAdvisories.length} Volcanoes Active
          </span>
        </div>
      </div>

      {/* Top Right Controls (Fullscreen, Geolocation, Refresh, Live Badge) */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 pointer-events-auto sm:right-6">
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 shadow-xl backdrop-blur-md text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-bold text-emerald-400">LIVE</span>
          <span className="text-slate-400 font-medium" suppressHydrationWarning>{mounted ? relativeTime : 'just now'}</span>
        </div>

        <button
          onClick={handleToggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-900 hover:text-white transition"
          title="Toggle Fullscreen"
          aria-label="Toggle Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          onClick={handleLocateUser}
          disabled={isLocating}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-blue-400 shadow-xl backdrop-blur-md hover:bg-slate-900 transition"
          title="Locate my position (GPS)"
          aria-label="Locate me"
        >
          <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-pulse text-blue-300' : ''}`} />
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-slate-300 shadow-xl backdrop-blur-md hover:bg-slate-900 hover:text-white transition disabled:opacity-50"
            title={`Refresh Darwin VAAC advisories (Last synced: ${relativeTime})`}
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Layer Filter Pill Legend (Image 1) */}
      <div className="absolute top-16 left-4 z-[400] flex flex-wrap gap-1.5 pointer-events-auto sm:left-6">
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

      {/* Volcano Quick Selector Rail (Bottom Left - Image 1) */}
      <div className="absolute bottom-6 left-4 z-[400] max-w-sm hidden sm:block pointer-events-auto">
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
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
                      6.5,
                      { duration: 1.2 }
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

      {/* Advisory Detail Drawer (Bottom Right - Image 1) */}
      {selectedAdvisory && (
        <div className="absolute bottom-4 left-4 right-4 z-[450] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 pointer-events-auto">
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
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition"
              aria-label="Close detail card"
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
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition"
            >
              <span>Volcano Profile</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </a>

            <a
              href={`/advisories/${selectedAdvisory.id}`}
              className="flex items-center gap-1 rounded-lg bg-red-600/20 px-2.5 py-1 text-[11px] font-semibold text-red-400 border border-red-500/30 hover:bg-red-600/30 transition"
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
