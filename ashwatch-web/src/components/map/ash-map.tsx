'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import Link from 'next/link';
import { VolcanoAdvisory, AshPolygon, LatLng } from '@/lib/types';
import { LAYER_COLORS } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { formatAltitudeCompact, formatMovementHuman, formatFlightLevelHuman } from '@/lib/aviation-format';
import { checkLocationAshStatus, LocationCheckResult } from '@/lib/geo-checker';
import { searchIndonesiaPlaces, IndonesiaPlace } from '@/lib/indonesia-places';
import {
  Crosshair,
  Maximize2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  Flame,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface AshMapProps {
  advisories: VolcanoAdvisory[];
  onRefresh?: () => void;
  isLoading?: boolean;
  lastRefreshedAt?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  initialLabel?: string | null;
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

export default function AshMap({
  advisories,
  onRefresh,
  isLoading,
  lastRefreshedAt,
  initialLat,
  initialLng,
  initialLabel,
}: AshMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const polygonLayerGroupRef = useRef<LayerGroup | null>(null);
  const markerLayerGroupRef = useRef<LayerGroup | null>(null);
  const userLocationLayerRef = useRef<LayerGroup | null>(null);

  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Selected advisory
  const [selectedAdvisory, setSelectedAdvisory] = useState<VolcanoAdvisory | null>(null);

  // User location check result
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [userLocationLabel, setUserLocationLabel] = useState<string>('');
  const [checkResult, setCheckResult] = useState<LocationCheckResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IndonesiaPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Layer toggles
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    observed: true,
    forecast6h: true,
    forecast12h: true,
    forecast18h: true,
  });

  // Mobile bottom sheet state
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRelativeTime(getRelativeTime(lastRefreshedAt));
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(lastRefreshedAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [lastRefreshedAt]);

  // Click outside to close search suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query matches
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      const matches = searchIndonesiaPlaces(text);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Perform area check on location
  const checkLocation = useCallback(
    (loc: LatLng, label: string) => {
      setUserLocation(loc);
      setUserLocationLabel(label);
      const res = checkLocationAshStatus(loc, advisories, label);
      setCheckResult(res);
      setMobileSheetExpanded(true);

      // Add user marker on map
      const map = mapInstanceRef.current;
      const userGroup = userLocationLayerRef.current;
      if (map && userGroup) {
        userGroup.clearLayers();
        import('leaflet').then((LModule) => {
          const L = LModule.default;
          const statusBg =
            res.status === 'ASH_AREA'
              ? '#FF6B1A'
              : res.status === 'FORECAST_OVERLAP'
              ? '#F59E0B'
              : '#10B981';

          const markerHtml = `
            <div class="relative flex h-8 w-8 items-center justify-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
              <span class="user-gps-ring" style="background-color: ${statusBg}40; border: 1.5px solid ${statusBg};"></span>
              <div class="relative flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-lg border-2" style="border-color: ${statusBg};">
                <div class="h-2 w-2 rounded-full" style="background-color: ${statusBg};"></div>
              </div>
            </div>
          `;

          const userMarker = L.marker([loc.latitude, loc.longitude], {
            icon: L.divIcon({
              html: markerHtml,
              className: 'user-pin-wrapper',
              iconSize: [0, 0],
            }),
          });

          userGroup.addLayer(userMarker);
          map.flyTo([loc.latitude, loc.longitude], 7.5, { duration: 1.2 });
        });
      }
    },
    [advisories]
  );

  // Select place from autocomplete
  const handleSelectPlace = (place: IndonesiaPlace) => {
    setSearchQuery(place.name);
    setShowSuggestions(false);
    checkLocation(place.coordinates, place.name);
  };

  // Locate User via GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc: LatLng = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        const label = 'My Location (GPS)';
        setSearchQuery(label);
        checkLocation(loc, label);
      },
      (err) => {
        setIsLocating(false);
        alert(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Please search your city instead.'
            : 'Unable to retrieve location. Please search manually.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Initialize Leaflet Map using OpenStreetMap as Provider
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Center comfortably on Indonesian archipelago
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
      });

      // STRICT REQUIREMENT: Base map must remain OpenStreetMap (OSM)
      const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'osm-tile-img',
      });
      osmLayer.addTo(map);

      const polyGroup = L.layerGroup().addTo(map);
      const markerGroup = L.layerGroup().addTo(map);
      const userGroup = L.layerGroup().addTo(map);

      polygonLayerGroupRef.current = polyGroup;
      markerLayerGroupRef.current = markerGroup;
      userLocationLayerRef.current = userGroup;
      mapInstanceRef.current = map;

      // Click anywhere on map to select and check that location
      map.on('click', (e) => {
        const clickedLoc: LatLng = {
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        };
        const coordLabel = `${clickedLoc.latitude.toFixed(2)}°, ${clickedLoc.longitude.toFixed(2)}°`;
        setSearchQuery(coordLabel);
        checkLocation(clickedLoc, coordLabel);
      });

      // Fit bounds to all active advisories
      fitAllAdvisories(map, advisories);
      setIsMapReady(true);

      // Handle initial location if passed via props / URL
      if (initialLat && initialLng) {
        checkLocation(
          { latitude: initialLat, longitude: initialLng },
          initialLabel || 'Selected Area'
        );
      }
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

  // Update Ash Polygons & Volcano Markers when layers or advisories change
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

      advisories.forEach((advisory) => {
        // 1. Volcano summit marker (Clean dark disc + subtle orange accent)
        if (advisory.position) {
          const lat = advisory.position.latitude;
          const lng = advisory.position.longitude;

          // For very close neighbors (e.g. Dukono vs Ibu), stagger label placement
          const isDukono = advisory.volcanoName.toUpperCase() === 'DUKONO';
          const labelHtml = `
            <div class="${isDukono ? 'mb-1 order-first' : 'mt-1 order-last'} whitespace-nowrap rounded-md px-1.5 py-0.5 text-center bg-[#0B0F17]/95 border border-white/10 shadow-md">
              <span style="color: #F5F7FA; font-size: 9.5px; font-weight: 700; display: block; line-height: 1.1;">
                ${advisory.volcanoName}
              </span>
            </div>
          `;

          const markerHtml = `
            <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
              ${isDukono ? labelHtml : ''}
              <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] shadow-lg border border-[#FF6B1A]/80">
                <span class="pulse-marker-ring" style="background-color: #FF6B1A30; border: 1px solid #FF6B1A80;"></span>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#FF6B1A">
                  <path d="M18 20H6l4.5-9h3L18 20z"/>
                  <circle cx="12" cy="5" r="2"/>
                </svg>
              </div>
              ${!isDukono ? labelHtml : ''}
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
                <div class="font-bold text-[#FF6B1A]">${advisory.volcanoName}</div>
                <div class="text-[10px] text-[#F5F7FA]">${advisory.primaryFlightLevel}</div>
                <div class="text-[10px] text-[#8B95A7]">${advisory.primaryMovement}</div>
              </div>
            `,
            { direction: 'top', offset: [0, -14], className: 'leaflet-tooltip' }
          );

          marker.on('click', () => {
            setSelectedAdvisory(advisory);
            setMobileSheetExpanded(true);
            map.flyTo([lat, lng], 6.5, { duration: 1.2 });
          });

          markerGroup.addLayer(marker);
        }

        // 2. Render Ash Polygons
        // Sort order: +18h, +12h, +6h, observed/estimated on top
        const sortedPolygons = [...advisory.polygons].sort((a, b) => {
          const order: Record<string, number> = {
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

          // Check layer visibility toggles
          if (ashPoly.type === 'observed' && !activeLayers.observed) return;
          if (ashPoly.type === 'estimated' && !activeLayers.observed) return;
          if (ashPoly.type === 'forecast6h' && !activeLayers.forecast6h) return;
          if (ashPoly.type === 'forecast12h' && !activeLayers.forecast12h) return;
          if (ashPoly.type === 'forecast18h' && !activeLayers.forecast18h) return;

          const latLngs: [number, number][] = ashPoly.coordinates.map((c) => [
            c.latitude,
            c.longitude,
          ]);

          const style = LAYER_COLORS[ashPoly.type] || LAYER_COLORS.observed;

          const polygon = L.polygon(latLngs, {
            color: style.stroke,
            weight: ashPoly.type === 'observed' ? 1.8 : 1.2,
            opacity: ashPoly.type === 'observed' ? 0.9 : 0.6,
            fillColor: style.fill,
            fillOpacity: style.opacity,
          });

          // Permanent center label inside observed/estimated polygons (Flight Level & Movement only)
          if (ashPoly.type === 'observed' || ashPoly.type === 'estimated') {
            const fl = ashPoly.topFlightLevel || '';
            const mov =
              ashPoly.movementDirection && ashPoly.movementSpeed
                ? `${ashPoly.movementDirection} ${ashPoly.movementSpeed}`
                : ashPoly.movementDirection || '';

            if (fl || mov) {
              const labelContent = `
                <div class="ash-polygon-center-label">
                  <div>${fl}${mov ? ` · ${mov}` : ''}</div>
                </div>
              `;
              const center = polygon.getBounds().getCenter();
              
              // If polygon center is very close to volcano summit, offset it toward plume body to avoid covering the volcano pin
              let labelLat = center.lat;
              let labelLng = center.lng;
              if (advisory.position) {
                const distLat = Math.abs(labelLat - advisory.position.latitude);
                const distLng = Math.abs(labelLng - advisory.position.longitude);
                if (distLat < 0.7 && distLng < 0.7) {
                  // Offset slightly into the cloud
                  labelLat += 0.35;
                  labelLng += 0.35;
                }
              }

              const centerMarker = L.marker([labelLat, labelLng], {
                icon: L.divIcon({
                  html: labelContent,
                  className: 'ash-polygon-center-label-wrapper',
                  iconSize: [0, 0],
                }),
                interactive: false,
              });
              polyGroup.addLayer(centerMarker);
            }
          }

          // Tooltip on polygon
          const altText = ashPoly.topFlightLevel
            ? `${ashPoly.baseFlightLevel || 'SFC'} → ${ashPoly.topFlightLevel}`
            : advisory.primaryFlightLevel;

          polygon.bindTooltip(
            `
              <div class="text-center">
                <div class="font-bold text-white">${advisory.volcanoName} [${ashPoly.type.toUpperCase()}]</div>
                <div class="text-[10px] text-[#FF8A3D]">${altText}</div>
                ${ashPoly.movementDirection ? `<div class="text-[10px] text-[#8B95A7]">${ashPoly.movementDirection} ${ashPoly.movementSpeed || ''}</div>` : ''}
              </div>
            `,
            { sticky: true, className: 'leaflet-tooltip' }
          );

          polygon.on('click', () => {
            setSelectedAdvisory(advisory);
            setMobileSheetExpanded(true);
          });

          polyGroup.addLayer(polygon);
        });
      });
    }

    updateLayers();
  }, [advisories, activeLayers, isMapReady]);

  // Fit bounds helper focusing on Indonesia
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
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0F17]">
      {/* Map Canvas with OpenStreetMap dark transformation */}
      <div ref={mapContainerRef} className="h-full w-full osm-dark-tiles" />

      {/* Floating Compact Top Header */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none sm:left-6 sm:right-6">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Location Search Input with Instant Autocomplete */}
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0B0F17]/90 px-3 py-2 shadow-xl backdrop-blur-md">
              <Search className="h-3.5 w-3.5 text-[#8B95A7]" />
              <input
                type="text"
                placeholder="Search city, airport, place..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                className="w-36 sm:w-56 bg-transparent text-xs text-[#F5F7FA] placeholder-[#8B95A7] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#8B95A7] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1.5 w-64 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl backdrop-blur-xl">
                {suggestions.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPlace(p)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-[#151C28]"
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#FF6B1A]" />
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-[#8B95A7]">{p.province}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Right Controls: GPS, Layers, Refresh, Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Live Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0F17]/90 px-3 py-2 text-xs shadow-xl backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-bold text-emerald-400">LIVE</span>
            <span className="text-[#8B95A7] font-medium" suppressHydrationWarning>
              {mounted ? relativeTime : 'just now'}
            </span>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B0F17]/90 px-3 text-xs font-semibold text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] hover:border-[#FF6B1A]/40 transition disabled:opacity-50"
            title="Locate via GPS"
            aria-label="Locate me via GPS"
          >
            <Crosshair className={`h-4 w-4 text-[#FF6B1A] ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">GPS</span>
          </button>

          {/* Layers Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B0F17]/90 px-3 text-xs font-semibold text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] transition"
              title="Toggle Map Layers"
              aria-label="Toggle Layers"
            >
              <Layers className="h-4 w-4 text-[#8B95A7]" />
              <span className="hidden sm:inline">Layers</span>
            </button>

            {/* Layers Menu Popover */}
            {showLayersMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#111827] p-2.5 shadow-2xl backdrop-blur-xl space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B95A7] px-1 mb-1">
                  Ash Dispersion Layers
                </div>
                <button
                  onClick={() => setActiveLayers((p) => ({ ...p, observed: !p.observed }))}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeLayers.observed
                      ? 'bg-white/10 text-white'
                      : 'text-[#8B95A7] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200 border border-white" />
                    <span>Observed Ash</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Current</span>
                </button>

                <button
                  onClick={() => setActiveLayers((p) => ({ ...p, forecast6h: !p.forecast6h }))}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeLayers.forecast6h
                      ? 'bg-[#FF8A3D]/15 text-[#FF8A3D]'
                      : 'text-[#8B95A7] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF8A3D]" />
                    <span>Forecast +6h</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveLayers((p) => ({ ...p, forecast12h: !p.forecast12h }))}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeLayers.forecast12h
                      ? 'bg-[#FF8A3D]/15 text-[#FF8A3D]'
                      : 'text-[#8B95A7] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF8A3D]/70" />
                    <span>Forecast +12h</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveLayers((p) => ({ ...p, forecast18h: !p.forecast18h }))}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeLayers.forecast18h
                      ? 'bg-[#FF8A3D]/15 text-[#FF8A3D]'
                      : 'text-[#8B95A7] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF8A3D]/40" />
                    <span>Forecast +18h</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F17]/90 text-[#8B95A7] shadow-xl backdrop-blur-md hover:text-white transition"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating User Location Status Pill (Directly from tugas.md section) */}
      {checkResult && (
        <div className="absolute top-16 left-4 z-[400] max-w-xs pointer-events-auto sm:left-6 animate-in fade-in slide-in-from-top-3">
          <div className="rounded-2xl border border-white/10 bg-[#111827]/95 p-3.5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8B95A7]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      checkResult.status === 'ASH_AREA'
                        ? '#FF6B1A'
                        : checkResult.status === 'FORECAST_OVERLAP'
                        ? '#F59E0B'
                        : '#10B981',
                  }}
                />
                <span>YOUR LOCATION</span>
              </div>
              <button
                onClick={() => setCheckResult(null)}
                className="text-[#8B95A7] hover:text-white text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2">
              <div
                className="text-xs font-black tracking-wide"
                style={{
                  color:
                    checkResult.status === 'ASH_AREA'
                      ? '#FF6B1A'
                      : checkResult.status === 'FORECAST_OVERLAP'
                      ? '#F59E0B'
                      : '#10B981',
                }}
              >
                {checkResult.statusLabel}
              </div>
              <div className="text-[11px] text-[#F5F7FA] font-medium mt-0.5">
                {checkResult.status === 'CLEAR' && (
                  <span>
                    No active ash detected in this area.
                    {checkResult.nearestAshDistanceKm > 0 && (
                      <span className="block text-[#8B95A7] text-[10px] mt-0.5">
                        Nearest: ~{checkResult.nearestAshDistanceKm} km ({checkResult.nearestVolcanoName})
                      </span>
                    )}
                  </span>
                )}
                {checkResult.status === 'ASH_AREA' && (
                  <span>
                    Inside {checkResult.affectedVolcano} ash area ({checkResult.flightLevel})
                  </span>
                )}
                {checkResult.status === 'FORECAST_OVERLAP' && (
                  <span>
                    Forecast {checkResult.forecastHorizon} overlaps ({checkResult.affectedVolcano})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Zoom & Map Nav Controls */}
      <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-1.5 pointer-events-auto sm:right-6">
        <button
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F17]/90 text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] transition"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F17]/90 text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] transition"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop Left Rail: Quick Volcano Selector */}
      <div className="absolute bottom-6 left-4 z-[400] max-w-xs hidden md:block pointer-events-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B95A7] mb-1.5 px-1">
          Active Ash Areas ({advisories.length})
        </div>
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1 pb-1">
          {advisories.map((adv) => {
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
                    ? 'bg-[#151C28] border-[#FF6B1A] ring-1 ring-[#FF6B1A]/40'
                    : 'bg-[#0B0F17]/85 border-white/10 hover:bg-[#151C28]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
                  <span className="text-xs font-bold text-white">{adv.volcanoName}</span>
                </div>
                <span className="text-[10px] font-semibold text-[#8B95A7] bg-white/5 px-1.5 py-0.5 rounded">
                  {adv.primaryFlightLevel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Volcano / Advisory Drawer (Desktop: Bottom Right, Mobile: Bottom Sheet) */}
      {selectedAdvisory && (
        <div className="absolute bottom-4 left-4 right-4 z-[450] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border border-white/10 bg-[#111827]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B1A]/15 text-[#FF6B1A]">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{selectedAdvisory.volcanoName}</h3>
                <p className="text-[11px] text-[#8B95A7]">
                  Advisory #{selectedAdvisory.advisoryNumber} · {selectedAdvisory.area}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAdvisory(null)}
              className="rounded-lg p-1 text-[#8B95A7] hover:bg-white/10 hover:text-white transition"
              aria-label="Close card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Ash Altitude:</span>
              <span className="font-bold text-[#FF6B1A]">
                {selectedAdvisory.primaryFlightLevel} ({formatAltitudeCompact(selectedAdvisory.primaryFlightLevel)})
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Movement:</span>
              <span className="font-semibold text-amber-300">
                {formatMovementHuman(selectedAdvisory.primaryMovement)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Issued DTG:</span>
              <span className="font-semibold text-[#F5F7FA]">
                {formatWibDateTime(selectedAdvisory.dtg)}
              </span>
            </div>

            {selectedAdvisory.eruptionDetails && (
              <div className="py-1">
                <span className="text-[#8B95A7] block mb-0.5">Eruption Details:</span>
                <p className="text-slate-200 bg-[#0B0F17]/80 rounded-lg p-2 font-mono text-[11px] leading-relaxed">
                  {selectedAdvisory.eruptionDetails}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <Link
              href={`/volcanoes/${selectedAdvisory.volcanoSlug}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6B1A] hover:text-[#FF8A3D] transition"
            >
              <span>Volcano Profile</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/advisories/${selectedAdvisory.id}`}
              className="flex items-center gap-1 rounded-lg bg-[#FF6B1A]/20 px-2.5 py-1 text-[11px] font-semibold text-[#FF6B1A] border border-[#FF6B1A]/30 hover:bg-[#FF6B1A]/30 transition"
            >
              <span>Full Bulletin</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
