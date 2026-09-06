'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Map as LeafletMap } from 'leaflet';
import { VolcanoAdvisory } from '@/lib/types';
import { LAYER_COLORS } from '@/lib/palette';
import { Map, ArrowRight, Loader2 } from 'lucide-react';

interface IndonesiaMiniMapProps {
  advisories: VolcanoAdvisory[];
}

export function IndonesiaMiniMap({ advisories }: IndonesiaMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapContainerRef.current || mapInstanceRef.current) return;

    let isCancelled = false;

    async function initMiniMap() {
      const L = (await import('leaflet')).default;
      if (isCancelled || !mapContainerRef.current) return;

      // Initialize non-interactive preview map focused on Indonesia
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 4.8,
        minZoom: 3,
        maxZoom: 6,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      });

      // Genuine OpenStreetMap tiles with dark transformation
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'osm-tile-img',
      }).addTo(map);

      const polyGroup = L.layerGroup().addTo(map);
      const markerGroup = L.layerGroup().addTo(map);

      // Render actual polygons and volcano markers
      advisories.forEach((adv) => {
        // Volcano marker
        if (adv.position) {
          const lat = adv.position.latitude;
          const lng = adv.position.longitude;
          const markerHtml = `
            <div class="flex flex-col items-center select-none" style="transform: translate(-50%, -50%);">
              <div class="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#111827] shadow-lg border border-[#FF6B1A]">
                <span class="pulse-marker-ring" style="background-color: #FF6B1A30; border: 1px solid #FF6B1A80;"></span>
                <div class="h-2 w-2 rounded-full bg-[#FF6B1A]"></div>
              </div>
              <div class="mt-0.5 whitespace-nowrap rounded px-1.5 py-0.2 text-center bg-[#0B0F17]/90 border border-white/10 shadow-sm">
                <span style="color: #F5F7FA; font-size: 8.5px; font-weight: 700; display: block; line-height: 1;">
                  ${adv.volcanoName}
                </span>
              </div>
            </div>
          `;

          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: markerHtml,
              className: 'mini-volcano-marker',
              iconSize: [0, 0],
            }),
            interactive: false,
          });
          markerGroup.addLayer(marker);
        }

        // Ash Polygons
        adv.polygons.forEach((poly) => {
          if (poly.coordinates.length < 3) return;
          const latLngs: [number, number][] = poly.coordinates.map((c) => [c.latitude, c.longitude]);
          const style = LAYER_COLORS[poly.type] || LAYER_COLORS.observed;

          const polygon = L.polygon(latLngs, {
            color: style.stroke,
            weight: poly.type === 'observed' ? 1.5 : 1.0,
            opacity: poly.type === 'observed' ? 0.9 : 0.5,
            fillColor: style.fill,
            fillOpacity: style.opacity,
            interactive: false,
          });
          polyGroup.addLayer(polygon);
        });
      });

      mapInstanceRef.current = map;
    }

    initMiniMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, advisories]);

  return (
    <Link
      href="/map"
      className="group relative block w-full rounded-3xl border border-white/10 bg-[#111827]/80 p-4 sm:p-5 shadow-2xl backdrop-blur-xl overflow-hidden hover:border-[#FF6B1A]/40 transition duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-[#8B95A7]">
          <span className="h-2 w-2 rounded-full bg-[#FF6B1A] animate-pulse"></span>
          <span className="font-semibold text-white">Live Volcanic Ash Map Preview</span>
          <span className="hidden sm:inline">· OpenStreetMap Indonesia</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] group-hover:text-[#FF8A3D] transition">
          <span>Explore Live Map</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full rounded-2xl bg-[#0B0F17] border border-white/5 overflow-hidden osm-dark-tiles">
        {mounted ? (
          <div ref={mapContainerRef} className="h-full w-full pointer-events-none" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#8B95A7]">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6B1A]" />
          </div>
        )}

        {/* Bottom subtle CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/30 to-transparent p-3 sm:p-4 flex items-center justify-between pointer-events-none">
          <span className="text-[11px] text-[#8B95A7] font-medium hidden sm:inline">
            Click anywhere on preview to launch full interactive map
          </span>
          <div className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-3.5 py-1.5 text-xs font-bold text-white shadow-lg group-hover:bg-[#FF8A3D] transition ml-auto">
            <Map className="h-3.5 w-3.5" />
            <span>Launch Full Map</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
