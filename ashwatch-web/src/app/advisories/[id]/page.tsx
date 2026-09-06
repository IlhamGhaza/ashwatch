import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { formatAltitudeCompact, formatMovementHuman, formatFlightLevelHuman } from '@/lib/aviation-format';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Flame,
  Clock,
  Wind,
  Map,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { SITE_URL } from '@/config/site';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getDarwinAdvisories();
  const advisory = data.advisories.find((a) => a.id === id);

  if (!advisory) {
    return { title: 'Advisory Not Found' };
  }

  const title = `${advisory.volcanoName} Advisory #${advisory.advisoryNumber}`;
  const description = `Volcanic Ash Advisory #${advisory.advisoryNumber} for ${advisory.volcanoName}, Indonesia. Altitude: ${advisory.primaryFlightLevel}, movement: ${advisory.primaryMovement}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/advisories/${id}`,
    },
    openGraph: {
      title: `${title} | AshWatch`,
      description,
      url: `${SITE_URL}/advisories/${id}`,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} — AshWatch`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | AshWatch`,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function AdvisoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getDarwinAdvisories();
  const advisory = data.advisories.find((a) => a.id === id);

  if (!advisory) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Recent Advisories', url: '/advisories' },
          { name: `${advisory.volcanoName} #${advisory.advisoryNumber}`, url: `/advisories/${advisory.id}` },
        ]}
      />

      {/* Advisory Structure directly matching tugas.md */}
      <div className="surface-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs text-[#8B95A7] uppercase tracking-wider block mb-1">
              Volcano
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              {advisory.volcanoName}
            </h1>
            <p className="text-xs text-[#8B95A7] mt-1">
              Advisory #{advisory.advisoryNumber} · {advisory.area}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B1A]/20 px-3 py-1 text-xs font-bold text-[#FF8A3D] border border-[#FF6B1A]/30">
              <Flame className="h-3.5 w-3.5" />
              <span>ASH DETECTED</span>
            </span>

            <Link
              href={`/map?lat=${advisory.position?.latitude || -6}&lng=${advisory.position?.longitude || 106}&label=${encodeURIComponent(
                advisory.volcanoName
              )}`}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition mt-2"
            >
              <Map className="h-3.5 w-3.5" />
              <span>View On Interactive Map</span>
            </Link>
          </div>
        </div>

        {/* Current Ash Area & Movement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#0B0F17]/80 p-5 border border-white/5">
            <span className="text-xs text-[#8B95A7] block mb-1">Current ash area</span>
            <span className="text-lg font-bold text-white block">
              {formatAltitudeCompact(advisory.primaryFlightLevel)}
            </span>
            <span className="text-xs text-[#8B95A7] mt-1 block">
              {formatFlightLevelHuman(advisory.primaryFlightLevel)}
            </span>
          </div>

          <div className="rounded-2xl bg-[#0B0F17]/80 p-5 border border-white/5">
            <span className="text-xs text-[#8B95A7] block mb-1">Movement</span>
            <span className="text-lg font-bold text-amber-300 block">
              {advisory.primaryMovement}
            </span>
            <span className="text-xs text-[#8B95A7] mt-1 block">
              {formatMovementHuman(advisory.primaryMovement)}
            </span>
          </div>
        </div>

        {/* Observed & Forecast Layers Breakdown */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#FF6B1A]" />
            <span>Observed & Forecast Horizons ({advisory.polygons.length} Layers)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advisory.polygons.map((poly, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/5 bg-[#0B0F17]/60 p-3.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase">
                    {poly.type === 'observed' ? 'Observed Cloud' : poly.type.replace('forecast', 'Forecast +')}
                  </span>
                  <span className="text-[10px] text-[#FF8A3D] font-mono">
                    {poly.coordinates.length} coords
                  </span>
                </div>
                <div className="text-[#8B95A7]">
                  Alt: <strong className="text-white">{poly.baseFlightLevel || 'SFC'} → {poly.topFlightLevel || '???'}</strong>
                </div>
                {poly.movementDirection && (
                  <div className="text-amber-300 text-[11px]">
                    {poly.movementDirection} {poly.movementSpeed || ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source Attribution */}
        <div className="rounded-2xl bg-[#0B0F17]/50 p-4 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div>
            <span className="text-[#8B95A7] block text-[10px] uppercase">Data Source:</span>
            <span className="font-semibold text-white">Darwin VAAC · Bureau of Meteorology (Australia)</span>
          </div>
          <span className="text-[#8B95A7]">Issued: {formatWibDateTime(advisory.dtg)}</span>
        </div>

        {/* Raw Bulletin Expandable Section (per tugas.md) */}
        <details className="group rounded-2xl border border-white/10 bg-[#0B0F17]/80 p-4 transition">
          <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-[#8B95A7] group-open:text-white">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#FF6B1A]" />
              <span>Raw Bulletin</span>
            </span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded group-open:hidden">
              Click to Expand
            </span>
          </summary>
          <div className="mt-4 pt-3 border-t border-white/10 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
            <p><span className="text-[#8B95A7]">DTG:</span> {advisory.dtgRaw}</p>
            <p><span className="text-[#8B95A7]">VAAC:</span> DARWIN</p>
            <p><span className="text-[#8B95A7]">VOLCANO:</span> {advisory.volcanoName} {advisory.volcanoCode ? `[${advisory.volcanoCode}]` : ''}</p>
            <p><span className="text-[#8B95A7]">AREA:</span> {advisory.area}</p>
            <p><span className="text-[#8B95A7]">INFO SOURCE:</span> {advisory.infoSource || 'HIMAWARI-9 / GROUND'}</p>
            {advisory.sourceElevation && (
              <p><span className="text-[#8B95A7]">SUMMIT ELEV:</span> {advisory.sourceElevation}</p>
            )}
            {advisory.eruptionDetails && (
              <p><span className="text-[#8B95A7]">ERUPTION DETAILS:</span> {advisory.eruptionDetails}</p>
            )}
            {advisory.remarks && (
              <p><span className="text-[#8B95A7]">RMK:</span> {advisory.remarks}</p>
            )}
            <p><span className="text-[#8B95A7]">NEXT ADVISORY:</span> {advisory.nextAdvisory || 'AS REQUIRED'}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
