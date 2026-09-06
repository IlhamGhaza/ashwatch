'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { VolcanoAdvisory, LatLng } from '@/lib/types';
import { checkLocationAshStatus, LocationCheckResult } from '@/lib/geo-checker';
import { searchIndonesiaPlaces, IndonesiaPlace } from '@/lib/indonesia-places';
import {
  MapPin,
  Crosshair,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

interface CheckMyAreaCardProps {
  advisories: VolcanoAdvisory[];
  initialLocation?: LatLng | null;
  initialLocationName?: string;
  onLocationSelected?: (loc: LatLng, name: string) => void;
  compact?: boolean;
}

export function CheckMyAreaCard({
  advisories,
  initialLocation,
  initialLocationName,
  onLocationSelected,
  compact = false,
}: CheckMyAreaCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialLocationName || '');
  const [suggestions, setSuggestions] = useState<IndonesiaPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [result, setResult] = useState<LocationCheckResult | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // If initial location provided, evaluate it
  useEffect(() => {
    if (initialLocation && advisories.length > 0) {
      const res = checkLocationAshStatus(initialLocation, advisories, initialLocationName);
      setResult(res);
    }
  }, [initialLocation, initialLocationName, advisories]);

  // Click outside listener for suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setGeoError(null);
    if (text.trim().length >= 2) {
      const matches = searchIndonesiaPlaces(text);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectPlace = (place: IndonesiaPlace) => {
    setQuery(place.name);
    setShowSuggestions(false);
    const res = checkLocationAshStatus(place.coordinates, advisories, place.name);
    setResult(res);
    if (onLocationSelected) {
      onLocationSelected(place.coordinates, place.name);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userLoc: LatLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const label = 'My Location (GPS)';
        setQuery(label);
        const res = checkLocationAshStatus(userLoc, advisories, label);
        setResult(res);

        if (onLocationSelected) {
          onLocationSelected(userLoc, label);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can search your city above.');
        } else {
          setGeoError('Unable to retrieve your location. Please search manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setGeoError(null);
  };

  return (
    <div
      className={`surface-card rounded-2xl p-5 sm:p-6 shadow-2xl transition border border-white/10 ${
        compact ? 'p-4' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF6B1A]/15 text-[#FF6B1A] border border-[#FF6B1A]/30">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Check My Area
            </h2>
            <p className="text-[11px] text-[#8B95A7]">
              Determine if your location overlaps active or forecast volcanic ash
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={handleReset}
            className="text-[11px] text-[#8B95A7] hover:text-white flex items-center gap-1 transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Search and GPS controls */}
      <div className="mt-3 relative" ref={dropdownRef}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A7]" />
            <input
              type="text"
              placeholder="Search city, airport, or place (e.g. Jakarta, Bali, Surabaya)..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2) setShowSuggestions(true);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#0B0F17]/90 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#F5F7FA] placeholder-[#8B95A7] focus:border-[#FF6B1A] focus:outline-none transition"
            />
          </div>

          <button
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#151C28] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] hover:bg-[#1f2937] hover:border-[#FF6B1A]/40 transition disabled:opacity-60 shrink-0"
            title="Locate via GPS"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#FF6B1A]" />
            ) : (
              <Crosshair className="h-4 w-4 text-[#FF6B1A]" />
            )}
            <span>Use My Location</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl backdrop-blur-xl">
            {suggestions.map((place, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPlace(place)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-[#151C28]"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#FF6B1A]" />
                  <span className="font-semibold text-white">{place.name}</span>
                </div>
                <span className="text-[10px] text-[#8B95A7]">{place.province}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {geoError && (
        <p className="mt-2 text-xs text-amber-400/90 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{geoError}</span>
        </p>
      )}

      {/* RESULT CARD - Follows exact CASE 1, CASE 2, CASE 3 specifications from tugas.md */}
      {result && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* CASE 1: CLEAR */}
          {result.status === 'CLEAR' && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>CLEAR</span>
                </div>
                <span className="text-[11px] text-[#8B95A7]">
                  {result.locationName || 'Selected Location'}
                </span>
              </div>

              <h3 className="mt-2.5 text-sm font-bold text-white">
                No active volcanic ash detected in this area.
              </h3>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8B95A7]">
                <div className="rounded-lg bg-[#0B0F17]/60 p-2.5 border border-white/5">
                  <span className="text-[10px] uppercase block text-[#8B95A7]">Nearest Ash Area:</span>
                  <span className="font-semibold text-[#F5F7FA]">
                    {result.nearestAshDistanceKm > 0
                      ? `~${result.nearestAshDistanceKm} km away`
                      : 'None within range'}
                  </span>
                </div>
                <div className="rounded-lg bg-[#0B0F17]/60 p-2.5 border border-white/5">
                  <span className="text-[10px] uppercase block text-[#8B95A7]">Nearest Volcano:</span>
                  <span className="font-semibold text-[#F5F7FA]">{result.nearestVolcanoName}</span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-[#8B95A7]">
                Forecast: <span className="text-slate-300">No intersection with your selected location.</span>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Link
                  href={`/map?lat=${result.coordinates.latitude}&lng=${result.coordinates.longitude}&label=${encodeURIComponent(
                    result.locationName || 'Selected Area'
                  )}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition"
                >
                  <span>View on Map</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* CASE 2: ASH AREA */}
          {result.status === 'ASH_AREA' && (
            <div className="rounded-xl border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 p-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-[#FF6B1A] px-2.5 py-1 text-xs font-black text-white shadow-md shadow-[#FF6B1A]/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                  <span>ASH AREA</span>
                </div>
                <span className="text-[11px] font-semibold text-[#FF8A3D]">
                  {result.locationName || 'Selected Location'}
                </span>
              </div>

              <h3 className="mt-2.5 text-sm font-bold text-white">
                This location is currently inside an active volcanic ash area.
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-[#F5F7FA]">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Volcano:</span>
                  <strong className="text-white">{result.affectedVolcano}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Status:</span>
                  <span className="font-bold text-[#FF6B1A]">Observed</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Ash Altitude:</span>
                  <span className="font-semibold text-white">
                    {result.flightLevel} ({result.humanAltitude})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Movement:</span>
                  <span className="text-amber-300 font-semibold">{result.humanMovement}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8B95A7]">Valid:</span>
                  <span className="text-slate-300">{result.validTime}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-[10px] text-[#8B95A7]">
                  Consult official local authorities for safety actions.
                </span>
                <Link
                  href={`/map?lat=${result.coordinates.latitude}&lng=${result.coordinates.longitude}&label=${encodeURIComponent(
                    result.locationName || 'Ash Area'
                  )}`}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FF6B1A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#FF8A3D] transition shadow-md"
                >
                  <span>Inspect on Live Map</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* CASE 3: FORECAST ASH */}
          {result.status === 'FORECAST_OVERLAP' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                  <Clock className="h-3.5 w-3.5" />
                  <span>FORECAST ASH</span>
                </div>
                <span className="text-[11px] text-[#8B95A7]">
                  {result.locationName || 'Selected Location'}
                </span>
              </div>

              <h3 className="mt-2.5 text-sm font-bold text-white">
                This location is currently outside observed ash, but a forecast ash area overlaps this location.
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-[#F5F7FA]">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Forecast Horizon:</span>
                  <strong className="text-amber-300">{result.forecastHorizon}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Volcano:</span>
                  <strong className="text-white">{result.affectedVolcano}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#8B95A7]">Ash Altitude:</span>
                  <span className="font-semibold text-white">{result.humanAltitude}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#8B95A7]">Movement:</span>
                  <span className="text-amber-200">{result.humanMovement}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Link
                  href={`/map?lat=${result.coordinates.latitude}&lng=${result.coordinates.longitude}&label=${encodeURIComponent(
                    result.locationName || 'Forecast Ash'
                  )}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition"
                >
                  <span>View Forecast on Map</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
