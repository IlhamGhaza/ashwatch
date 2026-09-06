import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime, formatUtcDateTime } from '@/lib/parser/date-utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Flame,
  Clock,
  Plane,
  Wind,
  Map,
  Compass,
  FileText,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

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

  const title = `VAA ${advisory.volcanoName} #${advisory.advisoryNumber} — Darwin VAAC`;
  const description = `Volcanic Ash Advisory #${advisory.advisoryNumber} for ${advisory.volcanoName}, Indonesia: Flight Level ${advisory.primaryFlightLevel}, movement ${advisory.primaryMovement}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/advisories/${id}`,
    },
    openGraph: {
      title: `${title} | AshWatch`,
      description,
      url: `${SITE_URL}/advisories/${id}`,
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

  const color = getVolcanoColor(advisory.volcanoName);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Advisories', url: '/advisories' },
          { name: `${advisory.volcanoName} #${advisory.advisoryNumber}`, url: `/advisories/${advisory.id}` },
        ]}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: color }}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-400 border border-red-500/30">
                ICAO VAA Bulletin
              </span>
              <span>{advisory.area} · VAAC DARWIN</span>
            </div>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              {advisory.volcanoName}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Advisory Nr: <strong className="text-white">{advisory.advisoryNumber}</strong> ·
              DTG: <strong className="text-white">{advisory.dtgRaw}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 transition"
            >
              <Map className="h-4 w-4" />
              <span>View On Live Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400 block mb-1">Flight Level Altitude</span>
          <span className="text-xl font-black text-red-400">{advisory.primaryFlightLevel}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400 block mb-1">Movement Drift Vector</span>
          <span className="text-xl font-black text-amber-300">{advisory.primaryMovement}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400 block mb-1">Date Time Group (WIB)</span>
          <span className="text-sm font-bold text-slate-200">{formatWibDateTime(advisory.dtg)}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400 block mb-1">Next Scheduled Advisory</span>
          <span className="text-sm font-bold text-slate-200">{advisory.nextAdvisory || 'As required'}</span>
        </div>
      </div>

      {/* Polygon & Section Breakdown */}
      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-red-400" />
            <span>Parsed Polygon Segments ({advisory.polygons.length} Layers)</span>
          </h2>

          <div className="space-y-4">
            {advisory.polygons.map((poly, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold uppercase text-slate-300">
                      Layer {idx + 1}: {poly.type}
                    </span>
                    <span className="text-xs text-red-400 font-bold">
                      {poly.baseFlightLevel || 'SFC'} → {poly.topFlightLevel || '???'}
                    </span>
                  </div>
                  {poly.movementDirection && (
                    <span className="text-xs text-amber-300 font-semibold">
                      Wind: {poly.movementDirection} {poly.movementSpeed || ''}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Polygon Coordinates ({poly.coordinates.length} vertices):
                  </span>
                  {poly.coordinates.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-slate-300">
                      {poly.coordinates.map((c, ci) => (
                        <span key={ci} className="rounded bg-slate-900 px-2 py-0.5 border border-slate-800">
                          {c.latitude.toFixed(4)}°, {c.longitude.toFixed(4)}°
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      No coordinates (negative advisory or VA not identifiable)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Eruption & Source Details */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Aviation Bulletin Attributes</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
              <dt className="text-slate-400 mb-1">Information Source:</dt>
              <dd className="font-semibold text-white">{advisory.infoSource || 'HIMAWARI-9 / SATELLITE'}</dd>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
              <dt className="text-slate-400 mb-1">Source Elevation:</dt>
              <dd className="font-semibold text-white">{advisory.sourceElevation || 'N/A'}</dd>
            </div>
            {advisory.eruptionDetails && (
              <div className="sm:col-span-2 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 font-mono">
                <dt className="text-slate-400 mb-1">Eruption Details:</dt>
                <dd className="text-slate-200">{advisory.eruptionDetails}</dd>
              </div>
            )}
            {advisory.remarks && (
              <div className="sm:col-span-2 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 font-mono">
                <dt className="text-slate-400 mb-1">Remarks (RMK):</dt>
                <dd className="text-slate-200">{advisory.remarks}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}
