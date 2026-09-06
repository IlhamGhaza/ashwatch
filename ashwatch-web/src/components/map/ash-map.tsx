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
  getMagmaVolcanoStatus,
  MAGMA_LEVEL_CONFIG,
  getAllMonitoredVolcanoes,
  MonitoredVolcanoItem,
  MagmaLevel,
} from '@/lib/magma-status';
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
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Minus,
  Flame,
  Mountain,
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

  // Selected advisory or monitored volcano
  const [selectedAdvisory, setSelectedAdvisory] = useState<VolcanoAdvisory | null>(null);
  const allMonitored = useMemo(() => getAllMonitoredVolcanoes(), []);
  const [selectedMonitored, setSelectedMonitored] = useState<MonitoredVolcanoItem | null>(null);
  // Multi-select for 4 MAGMA ESDM / PVMBG volcano alert levels (default: all levels active)
  const [selectedLevels, setSelectedLevels] = useState<MagmaLevel[]>([1, 2, 3, 4]);
  const [leftRailTab, setLeftRailTab] = useState<'ALL' | 'ASH'>('ALL');

  const toggleLevel = (level: MagmaLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const isAllLevelsSelected = selectedLevels.length === 4;

  const toggleAllLevels = () => {
    if (selectedLevels.length === 4) {
      setSelectedLevels([]);
    } else {
      setSelectedLevels([1, 2, 3, 4]);
    }
  };

  // Counts for each of the 4 MAGMA ESDM levels
  const countLevel4 = useMemo(() => allMonitored.filter((v) => v.level === 4).length, [allMonitored]);
  const countLevel3 = useMemo(() => allMonitored.filter((v) => v.level === 3).length, [allMonitored]);
  const countLevel2 = useMemo(() => allMonitored.filter((v) => v.level === 2).length, [allMonitored]);
  const countLevel1 = useMemo(() => allMonitored.filter((v) => v.level === 1).length, [allMonitored]);

  // Filtered monitored volcanoes based on active multi-selected levels
  const filteredMonitored = useMemo(() => {
    return allMonitored.filter((v) => selectedLevels.includes(v.level));
  }, [allMonitored, selectedLevels]);

  // User location check result
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [userLocationLabel, setUserLocationLabel] = useState<string>('');
  const [checkResult, setCheckResult] = useState<LocationCheckResult | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Search autocomplete (both places and volcanoes)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IndonesiaPlace[]>([]);
  const [volcanoSuggestions, setVolcanoSuggestions] = useState<MonitoredVolcanoItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Layer toggles
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    observed: true,
    forecast6h: true,
    forecast12h: true,
    forecast18h: true,
    allVolcanoes: true,
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

  // Update search query matches (both volcanoes and Indonesian places)
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      const q = text.trim().toLowerCase();
      const placeMatches = searchIndonesiaPlaces(text);
      setSuggestions(placeMatches);

      const vMatches = allMonitored.filter(
        (v) =>
          v.volcanoName.toLowerCase().includes(q) ||
          v.area.toLowerCase().includes(q) ||
          v.island.toLowerCase().includes(q)
      );
      setVolcanoSuggestions(vMatches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setVolcanoSuggestions([]);
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

  // Select volcano from autocomplete
  const handleSelectVolcano = (volcano: MonitoredVolcanoItem) => {
    setSearchQuery(volcano.volcanoName);
    setShowSuggestions(false);
    setSelectedMonitored(volcano);

    const matchingAdv = advisories.find((adv) => {
      const advNorm = adv.volcanoName.toUpperCase().replace(/^GUNUNG\s+|^G\.\s+|^MT\.\s+/i, '').trim();
      const vNorm = volcano.volcanoName.toUpperCase().replace(/^GUNUNG\s+|^G\.\s+|^MT\.\s+/i, '').trim();
      return advNorm === vNorm || advNorm.includes(vNorm) || vNorm.includes(advNorm);
    });
    setSelectedAdvisory(matchingAdv || null);
    setMobileSheetExpanded(true);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [volcano.position.latitude, volcano.position.longitude],
        7.5,
        { duration: 1.2 }
      );
    }
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

  // Update Ash Polygons & Volcano Markers when layers, advisories, or filters change
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

      // Track plotted volcano names so we do not duplicate
      const plottedVolcanoNames = new Set<string>();

      // Filter monitored volcanoes based on active selectedLevels and activeLayers.allVolcanoes
      const volcanoesToPlot = allMonitored.filter((v) => {
        if (!selectedLevels.includes(v.level)) {
          return false;
        }
        return true;
      });

      // 1. Render Monitored Volcanoes (All 4 Levels of MAGMA ESDM)
      volcanoesToPlot.forEach((volcano) => {
        const lat = volcano.position.latitude;
        const lng = volcano.position.longitude;

        // Check if this volcano has an active Darwin VAAC ash advisory
        const matchingAdvisory = advisories.find((adv) => {
          const advNorm = adv.volcanoName.toUpperCase().replace(/^GUNUNG\s+|^G\.\s+|^MT\.\s+/i, '').trim();
          const vNorm = volcano.volcanoName.toUpperCase().replace(/^GUNUNG\s+|^G\.\s+|^MT\.\s+/i, '').trim();
          return advNorm === vNorm || advNorm.includes(vNorm) || vNorm.includes(advNorm);
        });

        // If user unchecked allVolcanoes in the layers menu, only show volcanoes that have active advisories
        if (!activeLayers.allVolcanoes && !matchingAdvisory) {
          return;
        }

        plottedVolcanoNames.add(volcano.volcanoName.toUpperCase());

        const hasActiveAsh = Boolean(matchingAdvisory);
        const isDukono = volcano.volcanoName.toUpperCase().includes('DUKONO');
        const statusMeta = MAGMA_LEVEL_CONFIG[volcano.level];
        const statusColor = statusMeta.color;

        // Label Badge
        const labelHtml = `
          <div class="${isDukono ? 'mb-1 order-first' : 'mt-1.5 order-last'} whitespace-nowrap rounded-lg px-2 py-1 text-center bg-[#0B0F17]/95 border border-white/15 shadow-xl backdrop-blur-md">
            <div class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full" style="background-color: ${statusColor}; box-shadow: 0 0 6px ${statusColor};"></span>
              <span style="color: #F5F7FA; font-size: 9.5px; font-weight: 800; line-height: 1;">
                ${volcano.volcanoName}
              </span>
              <span style="font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; background: ${statusMeta.badgeBg}; color: ${statusMeta.badgeText}; border: 1px solid ${statusMeta.badgeBorder};">
                ${statusMeta.name}
              </span>
              ${hasActiveAsh ? `<span style="font-size: 7.5px; font-weight: 900; padding: 1px 3.5px; border-radius: 3px; background: rgba(255, 107, 26, 0.25); color: #FF8A3D; border: 1px solid rgba(255, 107, 26, 0.4);">ABU</span>` : ''}
            </div>
          </div>
        `;

        // Marker Pin: Pulsing animation if active ash; solid crisp summit pin if seismic ground monitored
        const markerHtml = `
          <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
            ${isDukono ? labelHtml : ''}
            <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] shadow-lg border" style="border-color: ${statusColor};">
              ${hasActiveAsh ? `<span class="pulse-marker-ring" style="background-color: ${statusMeta.ringColor}; border: 1px solid ${statusColor};"></span>` : ''}
              ${hasActiveAsh ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${statusColor}">
                  <path d="M18 20H6l4.5-9h3L18 20z"/>
                  <circle cx="12" cy="5" r="2"/>
                </svg>
              ` : `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
                </svg>
              `}
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

        // Tooltip
        const tooltipHtml = hasActiveAsh && matchingAdvisory
          ? `
            <div class="text-center p-1">
              <div class="font-black text-white text-xs tracking-wide">${volcano.volcanoName}</div>
              <div class="inline-flex items-center gap-1 my-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style="background: ${statusMeta.badgeBg}; color: ${statusMeta.badgeText}; border: 1px solid ${statusMeta.badgeBorder};">
                <span>Status PVMBG:</span>
                <span>${statusMeta.roman} (${statusMeta.name})</span>
              </div>
              <div class="text-[10px] text-[#FF8A3D] font-bold">ABU AKTIF: ${formatAltitudeCompact(matchingAdvisory.primaryFlightLevel)}</div>
              <div class="text-[10px] text-[#8B95A7]">${formatMovementHuman(matchingAdvisory.primaryMovement)}</div>
            </div>
          `
          : `
            <div class="text-center p-1">
              <div class="font-black text-white text-xs tracking-wide">${volcano.volcanoName} (${volcano.elevation})</div>
              <div class="inline-flex items-center gap-1 my-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style="background: ${statusMeta.badgeBg}; color: ${statusMeta.badgeText}; border: 1px solid ${statusMeta.badgeBorder};">
                <span>Status PVMBG:</span>
                <span>${statusMeta.roman} (${statusMeta.name})</span>
              </div>
              <div class="text-[10px] text-slate-300 font-medium">${volcano.area}</div>
              <div class="text-[9px] text-[#8B95A7] mt-0.5">Pemantauan Seismik Ground PVMBG</div>
            </div>
          `;

        marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -14], className: 'leaflet-tooltip' });

        marker.on('click', () => {
          if (matchingAdvisory) {
            setSelectedAdvisory(matchingAdvisory);
            setSelectedMonitored(volcano);
          } else {
            setSelectedAdvisory(null);
            setSelectedMonitored(volcano);
          }
          setMobileSheetExpanded(true);
          map.flyTo([lat, lng], 7, { duration: 1.2 });
        });

        markerGroup.addLayer(marker);
      });

      // Also render any advisory that wasn't covered in allMonitored (safety fallback)
      advisories.forEach((advisory) => {
        const advName = advisory.volcanoName.toUpperCase();
        if (plottedVolcanoNames.has(advName)) return;
        if (!advisory.position) return;

        const lat = advisory.position.latitude;
        const lng = advisory.position.longitude;
        const magmaStatus = getMagmaVolcanoStatus(advisory.volcanoName);

        if (!selectedLevels.includes(magmaStatus.level)) return;

        const markerHtml = `
          <div class="flex flex-col items-center cursor-pointer select-none" style="transform: translate(-50%, -50%);">
            <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] shadow-lg border" style="border-color: ${magmaStatus.color};">
              <span class="pulse-marker-ring" style="background-color: ${magmaStatus.ringColor}; border: 1px solid ${magmaStatus.color};"></span>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${magmaStatus.color}">
                <path d="M18 20H6l4.5-9h3L18 20z"/>
                <circle cx="12" cy="5" r="2"/>
              </svg>
            </div>
            <div class="mt-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-center bg-[#0B0F17]/95 border border-white/15 shadow-xl backdrop-blur-md">
              <div class="flex items-center gap-1.5">
                <span class="h-1.5 w-1.5 rounded-full" style="background-color: ${magmaStatus.color};"></span>
                <span style="color: #F5F7FA; font-size: 9.5px; font-weight: 800;">${advisory.volcanoName}</span>
                <span style="font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 4px; background: ${magmaStatus.badgeBg}; color: ${magmaStatus.badgeText}; border: 1px solid ${magmaStatus.badgeBorder};">
                  ${magmaStatus.levelName}
                </span>
                <span style="font-size: 7.5px; font-weight: 900; padding: 1px 3.5px; border-radius: 3px; background: rgba(255, 107, 26, 0.25); color: #FF8A3D; border: 1px solid rgba(255, 107, 26, 0.4);">ABU</span>
              </div>
            </div>
          </div>
        `;

        const marker = L.marker([lat, lng], {
          icon: L.divIcon({ html: markerHtml, className: 'volcano-pin-marker', iconSize: [0, 0] }),
        });

        marker.on('click', () => {
          setSelectedAdvisory(advisory);
          setSelectedMonitored(null);
          setMobileSheetExpanded(true);
          map.flyTo([lat, lng], 6.5, { duration: 1.2 });
        });

        markerGroup.addLayer(marker);
      });

      // 2. Render Ash Polygons
      // Sort order: +18h, +12h, +6h, observed/estimated on top
      const sortedPolygons = advisories.flatMap((adv) =>
        adv.polygons.map((poly) => ({ advisory: adv, poly }))
      ).sort((a, b) => {
        const order: Record<string, number> = {
          forecast18h: 0,
          forecast12h: 1,
          forecast6h: 2,
          estimated: 3,
          observed: 4,
        };
        return (order[a.poly.type] ?? 0) - (order[b.poly.type] ?? 0);
      });

      sortedPolygons.forEach(({ advisory, poly: ashPoly }) => {
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
            
            // If polygon center is very close to volcano summit, offset it toward plume body
            let labelLat = center.lat;
            let labelLng = center.lng;
            if (advisory.position) {
              const distLat = Math.abs(labelLat - advisory.position.latitude);
              const distLng = Math.abs(labelLng - advisory.position.longitude);
              if (distLat < 0.7 && distLng < 0.7) {
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
          const matchingMonitored = allMonitored.find(
            (m) => m.volcanoName.toUpperCase() === advisory.volcanoName.toUpperCase()
          );
          setSelectedMonitored(matchingMonitored || null);
          setMobileSheetExpanded(true);
        });

        polyGroup.addLayer(polygon);
      });
    }

    updateLayers();
  }, [advisories, activeLayers, isMapReady, allMonitored, selectedLevels]);

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
                placeholder="Cari kota, bandara, atau lokasi..."
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

            {/* Suggestions Dropdown (Both Volcanoes and Places) */}
            {showSuggestions && (suggestions.length > 0 || volcanoSuggestions.length > 0) && (
              <div className="absolute top-full left-0 mt-1.5 w-72 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl backdrop-blur-xl divide-y divide-white/5">
                {/* Volcano Matches */}
                {volcanoSuggestions.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                      Gunung Api Terpantau (PVMBG)
                    </div>
                    {volcanoSuggestions.map((v) => (
                      <button
                        key={v.volcanoSlug}
                        onClick={() => handleSelectVolcano(v)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-[#151C28]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: v.color }}
                          />
                          <span className="font-semibold text-white">{v.volcanoName}</span>
                        </div>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{
                            backgroundColor: v.badgeBg,
                            color: v.badgeText,
                            border: `1px solid ${v.badgeBorder}`,
                          }}
                        >
                          {v.levelName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Indonesian Cities and Places Matches */}
                {suggestions.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8B95A7]">
                      Kota & Lokasi Indonesia
                    </div>
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
              {mounted ? relativeTime : 'baru saja'}
            </span>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B0F17]/90 px-3 text-xs font-semibold text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] hover:border-[#FF6B1A]/40 transition disabled:opacity-50"
            title="Deteksi Lokasi GPS"
            aria-label="Deteksi lokasi saya via GPS"
          >
            <Crosshair className={`h-4 w-4 text-[#FF6B1A] ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">GPS</span>
          </button>

          {/* Layers Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLayersMenu(!showLayersMenu)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#0B0F17]/90 px-3 text-xs font-semibold text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] transition"
              title="Lapisan Peta"
              aria-label="Lapisan Peta"
            >
              <Layers className="h-4 w-4 text-[#8B95A7]" />
              <span className="hidden sm:inline">Lapisan</span>
            </button>

            {/* Layers Menu Popover */}
            {showLayersMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#111827] p-3 shadow-2xl backdrop-blur-xl space-y-2.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B95A7] px-1 mb-1">
                    Lapisan Sebaran Abu
                  </div>
                  <div className="space-y-1">
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
                        <span>Abu Teramati</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Saat ini</span>
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
                        <span>Prakiraan +6j</span>
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
                        <span>Prakiraan +12j</span>
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
                        <span>Prakiraan +18j</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Lapisan Gunung Api (4 Level PVMBG) */}
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B95A7] px-1 mb-1 flex items-center justify-between">
                    <span>Gunung Api Terpantau</span>
                    <button
                      onClick={() => setActiveLayers((p) => ({ ...p, allVolcanoes: !p.allVolcanoes }))}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${
                        activeLayers.allVolcanoes
                          ? 'bg-[#FF6B1A]/20 text-[#FF8A3D]'
                          : 'bg-white/5 text-[#8B95A7]'
                      }`}
                    >
                      {activeLayers.allVolcanoes ? 'Aktif' : 'Abu Saja'}
                    </button>
                  </div>

                  {/* Filter 4 Tingkat Aktivitas MAGMA ESDM (Multi-Select) */}
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={toggleAllLevels}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        isAllLevelsSelected
                          ? 'bg-white/15 text-white'
                          : 'text-[#8B95A7] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                            isAllLevelsSelected
                              ? 'bg-white/30 border-white/60 text-white'
                              : selectedLevels.length > 0
                              ? 'bg-white/10 border-white/30 text-white'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {isAllLevelsSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          {!isAllLevelsSelected && selectedLevels.length > 0 && (
                            <span className="h-1.5 w-1.5 rounded-sm bg-white" />
                          )}
                        </div>
                        <span>Semua Status</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isAllLevelsSelected
                          ? allMonitored.length
                          : `${filteredMonitored.length}/${allMonitored.length}`}
                      </span>
                    </button>

                    <button
                      onClick={() => toggleLevel(4)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        selectedLevels.includes(4)
                          ? 'bg-[#EF4444]/25 text-[#F87171] border border-[#EF4444]/40'
                          : 'text-[#8B95A7] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                            selectedLevels.includes(4)
                              ? 'bg-[#EF4444] border-[#EF4444] text-white'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {selectedLevels.includes(4) && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedLevels.includes(4) ? 'bg-[#EF4444]' : 'bg-[#EF4444]/40'
                          }`}
                        />
                        <span>Level IV: Awas</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#F87171]">{countLevel4}</span>
                    </button>

                    <button
                      onClick={() => toggleLevel(3)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        selectedLevels.includes(3)
                          ? 'bg-[#FF6B1A]/25 text-[#FF8A3D] border border-[#FF6B1A]/40'
                          : 'text-[#8B95A7] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                            selectedLevels.includes(3)
                              ? 'bg-[#FF6B1A] border-[#FF6B1A] text-white'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {selectedLevels.includes(3) && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedLevels.includes(3) ? 'bg-[#FF6B1A]' : 'bg-[#FF6B1A]/40'
                          }`}
                        />
                        <span>Level III: Siaga</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#FF8A3D]">{countLevel3}</span>
                    </button>

                    <button
                      onClick={() => toggleLevel(2)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        selectedLevels.includes(2)
                          ? 'bg-[#F59E0B]/25 text-[#FBBF24] border border-[#F59E0B]/40'
                          : 'text-[#8B95A7] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                            selectedLevels.includes(2)
                              ? 'bg-[#F59E0B] border-[#F59E0B] text-slate-950'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {selectedLevels.includes(2) && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedLevels.includes(2) ? 'bg-[#F59E0B]' : 'bg-[#F59E0B]/40'
                          }`}
                        />
                        <span>Level II: Waspada</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#FBBF24]">{countLevel2}</span>
                    </button>

                    <button
                      onClick={() => toggleLevel(1)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition ${
                        selectedLevels.includes(1)
                          ? 'bg-[#10B981]/25 text-[#34D399] border border-[#10B981]/40'
                          : 'text-[#8B95A7] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition ${
                            selectedLevels.includes(1)
                              ? 'bg-[#10B981] border-[#10B981] text-white'
                              : 'border-white/20 bg-transparent'
                          }`}
                        >
                          {selectedLevels.includes(1) && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            selectedLevels.includes(1) ? 'bg-[#10B981]' : 'bg-[#10B981]/40'
                          }`}
                        />
                        <span>Level I: Normal</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#34D399]">{countLevel1}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F17]/90 text-[#8B95A7] shadow-xl backdrop-blur-md hover:text-white transition"
            title="Layar Penuh"
            aria-label="Layar Penuh"
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
                <span>LOKASI ANDA</span>
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
                {checkResult.status === 'CLEAR'
                  ? 'AMAN DARI ABU'
                  : checkResult.status === 'ASH_AREA'
                  ? 'WILAYAH ABU AKTIF'
                  : 'PRAKIRAAN SEBARAN ABU'}
              </div>
              <div className="text-[11px] text-[#F5F7FA] font-medium mt-0.5">
                {checkResult.status === 'CLEAR' && (
                  <span>
                    Tidak ada sebaran abu vulkanik aktif di area ini.
                    {checkResult.nearestAshDistanceKm > 0 && (
                      <span className="block text-[#8B95A7] text-[10px] mt-0.5">
                        Terdekat: ~{checkResult.nearestAshDistanceKm} km ({checkResult.nearestVolcanoName})
                      </span>
                    )}
                  </span>
                )}
                {checkResult.status === 'ASH_AREA' && (
                  <span>
                    Berada di dalam sebaran abu {checkResult.affectedVolcano} ({checkResult.flightLevel})
                  </span>
                )}
                {checkResult.status === 'FORECAST_OVERLAP' && (
                  <span>
                    Prakiraan {checkResult.forecastHorizon} melintasi lokasi ini ({checkResult.affectedVolcano})
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
          title="Perbesar"
          aria-label="Perbesar"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F17]/90 text-[#F5F7FA] shadow-xl backdrop-blur-md hover:bg-[#151C28] transition"
          title="Perkecil"
          aria-label="Perkecil"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Desktop Left Rail: Quick Volcano Selector with 4 Levels Filter */}
      <div className="absolute bottom-6 left-4 z-[400] w-80 hidden md:block pointer-events-auto">
        <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/95 p-3 shadow-2xl backdrop-blur-xl">
          {/* Tabs: Semua Gunung vs Abu Aktif */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 mb-2">
            <button
              onClick={() => setLeftRailTab('ALL')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                leftRailTab === 'ALL'
                  ? 'bg-[#151C28] text-white border border-white/10 shadow-sm'
                  : 'text-[#8B95A7] hover:text-white'
              }`}
            >
              <Mountain className="h-3.5 w-3.5 text-[#FF6B1A]" />
              <span>Semua Gunung ({filteredMonitored.length})</span>
            </button>
            <button
              onClick={() => setLeftRailTab('ASH')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                leftRailTab === 'ASH'
                  ? 'bg-[#151C28] text-white border border-white/10 shadow-sm'
                  : 'text-[#8B95A7] hover:text-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Abu Aktif ({advisories.length})</span>
            </button>
          </div>

          {/* Level Filter Chips when leftRailTab === 'ALL' (Multi-Select) */}
          {leftRailTab === 'ALL' && (
            <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 text-[10px]">
              <button
                onClick={toggleAllLevels}
                className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap ${
                  isAllLevelsSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-[#8B95A7] hover:text-white'
                }`}
                title={isAllLevelsSelected ? 'Hapus semua pilihan level' : 'Pilih semua level'}
              >
                Semua ({allMonitored.length})
              </button>
              <button
                onClick={() => toggleLevel(4)}
                className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedLevels.includes(4)
                    ? 'bg-[#EF4444] text-white shadow-sm ring-1 ring-[#EF4444]/60'
                    : 'bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/25 opacity-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>IV Awas ({countLevel4})</span>
              </button>
              <button
                onClick={() => toggleLevel(3)}
                className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedLevels.includes(3)
                    ? 'bg-[#FF6B1A] text-white shadow-sm ring-1 ring-[#FF6B1A]/60'
                    : 'bg-[#FF6B1A]/15 text-[#FF8A3D] hover:bg-[#FF6B1A]/25 opacity-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>III Siaga ({countLevel3})</span>
              </button>
              <button
                onClick={() => toggleLevel(2)}
                className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedLevels.includes(2)
                    ? 'bg-[#F59E0B] text-slate-950 font-black shadow-sm ring-1 ring-[#F59E0B]/60'
                    : 'bg-[#F59E0B]/15 text-[#FBBF24] hover:bg-[#F59E0B]/25 opacity-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>II Waspada ({countLevel2})</span>
              </button>
              <button
                onClick={() => toggleLevel(1)}
                className={`px-2 py-1 rounded-md font-bold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedLevels.includes(1)
                    ? 'bg-[#10B981] text-white shadow-sm ring-1 ring-[#10B981]/60'
                    : 'bg-[#10B981]/15 text-[#34D399] hover:bg-[#10B981]/25 opacity-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>I Normal ({countLevel1})</span>
              </button>
            </div>
          )}

          {/* Volcano Items List */}
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
            {leftRailTab === 'ASH' ? (
              advisories.map((adv) => {
                const isSelected = selectedAdvisory?.id === adv.id;
                const magmaStatus = getMagmaVolcanoStatus(adv.volcanoName);
                return (
                  <button
                    key={adv.id}
                    onClick={() => {
                      setSelectedAdvisory(adv);
                      const matchingMon = allMonitored.find(
                        (m) => m.volcanoName.toUpperCase() === adv.volcanoName.toUpperCase()
                      );
                      setSelectedMonitored(matchingMon || null);
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
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: magmaStatus.color }}
                      />
                      <span className="text-xs font-bold text-white truncate">{adv.volcanoName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          backgroundColor: magmaStatus.badgeBg,
                          color: magmaStatus.badgeText,
                          border: `1px solid ${magmaStatus.badgeBorder}`,
                        }}
                      >
                        {magmaStatus.levelName}
                      </span>
                      <span className="text-[10px] font-semibold text-[#8B95A7] bg-white/5 px-1.5 py-0.5 rounded">
                        {adv.primaryFlightLevel}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : filteredMonitored.length === 0 ? (
              <div className="py-6 px-3 text-center rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs font-medium text-[#8B95A7]">Tidak ada level yang dipilih</p>
                <button
                  onClick={() => setSelectedLevels([1, 2, 3, 4])}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#FF6B1A]/20 px-2.5 py-1 text-[11px] font-bold text-[#FF8A3D] hover:bg-[#FF6B1A]/30 transition"
                >
                  Pilih Semua Level
                </button>
              </div>
            ) : (
              filteredMonitored.map((volc) => {
                const isSelected = selectedMonitored?.volcanoSlug === volc.volcanoSlug;
                const hasAsh = advisories.some(
                  (a) =>
                    a.volcanoName.toUpperCase() === volc.volcanoName.toUpperCase() ||
                    a.volcanoName.toUpperCase().includes(volc.volcanoName.toUpperCase()) ||
                    volc.volcanoName.toUpperCase().includes(a.volcanoName.toUpperCase())
                );

                return (
                  <button
                    key={volc.volcanoSlug}
                    onClick={() => {
                      const matchingAdv = advisories.find(
                        (a) =>
                          a.volcanoName.toUpperCase() === volc.volcanoName.toUpperCase() ||
                          a.volcanoName.toUpperCase().includes(volc.volcanoName.toUpperCase()) ||
                          volc.volcanoName.toUpperCase().includes(a.volcanoName.toUpperCase())
                      );
                      setSelectedAdvisory(matchingAdv || null);
                      setSelectedMonitored(volc);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(
                          [volc.position.latitude, volc.position.longitude],
                          7,
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
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: volc.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{volc.volcanoName}</span>
                          {hasAsh && (
                            <span className="text-[8px] font-black px-1 py-0.2 rounded bg-[#FF6B1A]/20 text-[#FF8A3D] border border-[#FF6B1A]/40">
                              ABU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8B95A7] truncate block">{volc.area}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          backgroundColor: volc.badgeBg,
                          color: volc.badgeText,
                          border: `1px solid ${volc.badgeBorder}`,
                        }}
                      >
                        {volc.levelName}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selected Volcano / Advisory Drawer (Desktop: Bottom Right, Mobile: Bottom Sheet) */}
      {selectedAdvisory && (() => {
        const magmaStatus = getMagmaVolcanoStatus(selectedAdvisory.volcanoName);
        return (
          <div className="absolute bottom-4 left-4 right-4 z-[450] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border border-white/10 bg-[#111827]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: magmaStatus.badgeBg, color: magmaStatus.badgeText }}
                >
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-white">{selectedAdvisory.volcanoName}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: magmaStatus.badgeBg,
                        color: magmaStatus.badgeText,
                        border: `1px solid ${magmaStatus.badgeBorder}`,
                      }}
                    >
                      {magmaStatus.levelRoman} · {magmaStatus.levelName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B95A7]">
                    Buletin #{selectedAdvisory.advisoryNumber} · {selectedAdvisory.area}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAdvisory(null);
                  setSelectedMonitored(null);
                }}
                className="rounded-lg p-1 text-[#8B95A7] hover:bg-white/10 hover:text-white transition"
                aria-label="Tutup panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* MAGMA ESDM Activity Status Card */}
            <div
              className="mt-3 rounded-xl border p-3"
              style={{ backgroundColor: magmaStatus.badgeBg, borderColor: magmaStatus.badgeBorder }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: magmaStatus.badgeText }}
                >
                  Status Aktivitas MAGMA ESDM
                </span>
                <span
                  className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm"
                  style={{ backgroundColor: magmaStatus.color, color: '#0B0F17' }}
                >
                  {magmaStatus.levelName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
                {magmaStatus.description}
              </p>
              <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-1.5 text-[11px]">
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  style={{ color: magmaStatus.badgeText }}
                />
                <span className="text-slate-300">
                  <strong className="text-white">Radius Bahaya:</strong> {magmaStatus.recommendation}
                </span>
              </div>
            </div>

            {/* Ash Telemetry details */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B95A7]">Ketinggian Abu:</span>
                <span className="font-bold text-[#FF6B1A]">
                  {selectedAdvisory.primaryFlightLevel} ({formatAltitudeCompact(selectedAdvisory.primaryFlightLevel)})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B95A7]">Pergerakan:</span>
                <span className="font-semibold text-amber-300">
                  {formatMovementHuman(selectedAdvisory.primaryMovement)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B95A7]">Waktu Terbit:</span>
                <span className="font-semibold text-[#F5F7FA]">
                  {formatWibDateTime(selectedAdvisory.dtg)}
                </span>
              </div>

              {selectedAdvisory.eruptionDetails && (
                <div className="py-1">
                  <span className="text-[#8B95A7] block mb-0.5">Detail Erupsi:</span>
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
                <span>Profil Gunung Api</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <a
                  href={magmaStatus.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#8B95A7] hover:text-white transition"
                  title="Lihat data di situs resmi MAGMA ESDM"
                >
                  <span>MAGMA ESDM</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>

                <Link
                  href={`/advisories/${selectedAdvisory.id}`}
                  className="flex items-center gap-1 rounded-lg bg-[#FF6B1A]/20 px-2.5 py-1 text-[11px] font-semibold text-[#FF6B1A] border border-[#FF6B1A]/30 hover:bg-[#FF6B1A]/30 transition"
                >
                  <span>Buletin Lengkap</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Selected Monitored Volcano Drawer (when no active ash advisory is selected) */}
      {!selectedAdvisory && selectedMonitored && (
        <div className="absolute bottom-4 left-4 right-4 z-[450] sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border border-white/10 bg-[#111827]/95 p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: selectedMonitored.badgeBg, color: selectedMonitored.badgeText }}
              >
                <Mountain className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-white">{selectedMonitored.volcanoName}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      backgroundColor: selectedMonitored.badgeBg,
                      color: selectedMonitored.badgeText,
                      border: `1px solid ${selectedMonitored.badgeBorder}`,
                    }}
                  >
                    {selectedMonitored.levelRoman} · {selectedMonitored.levelName}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B95A7]">
                  {selectedMonitored.area} · Elevasi: {selectedMonitored.elevation}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMonitored(null)}
              className="rounded-lg p-1 text-[#8B95A7] hover:bg-white/10 hover:text-white transition"
              aria-label="Tutup panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* MAGMA ESDM Activity Status Card */}
          <div
            className="mt-3 rounded-xl border p-3"
            style={{ backgroundColor: selectedMonitored.badgeBg, borderColor: selectedMonitored.badgeBorder }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: selectedMonitored.badgeText }}
              >
                Status Aktivitas MAGMA ESDM
              </span>
              <span
                className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm"
                style={{ backgroundColor: selectedMonitored.color, color: '#0B0F17' }}
              >
                {selectedMonitored.levelName}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-200 leading-relaxed font-medium">
              {selectedMonitored.description}
            </p>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-1.5 text-[11px]">
              <AlertTriangle
                className="h-3.5 w-3.5 shrink-0 mt-0.5"
                style={{ color: selectedMonitored.badgeText }}
              />
              <span className="text-slate-300">
                <strong className="text-white">Radius Bahaya:</strong> {selectedMonitored.recommendation}
              </span>
            </div>
          </div>

          {/* Telemetry & Ground Monitoring Details */}
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Status Pemantauan:</span>
              <span className="font-semibold text-emerald-400">Pemantauan Ground PVMBG</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Sebaran Abu Vulkanik:</span>
              <span className="font-semibold text-slate-300">Tidak ada abu aktif di udara</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Wilayah Pulau:</span>
              <span className="font-semibold text-[#F5F7FA]">{selectedMonitored.island}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[#8B95A7]">Koordinat Kawah:</span>
              <span className="font-mono text-[#8B95A7]">
                {selectedMonitored.position.latitude.toFixed(3)}°, {selectedMonitored.position.longitude.toFixed(3)}°
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <Link
              href={`/volcanoes/${selectedMonitored.volcanoSlug}`}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#FF6B1A] hover:text-[#FF8A3D] transition"
            >
              <span>Profil Gunung Api</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <a
              href={selectedMonitored.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/15 transition border border-white/10"
              title="Buka portal resmi MAGMA Indonesia ESDM"
            >
              <span>Portal MAGMA ESDM</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
