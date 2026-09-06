import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { formatAltitudeCompact, formatMovementHuman } from '@/lib/aviation-format';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Flame, ArrowRight, ChevronRight, Map } from 'lucide-react';

import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Active Volcanoes & Ash Areas Indonesia | AshWatch',
  description:
    'View active Indonesian volcanoes with current volcanic ash areas, movement, and forecast information.',
  alternates: {
    canonical: `${SITE_URL}/volcanoes`,
  },
  openGraph: {
    title: 'Active Volcanoes & Ash Areas Indonesia | AshWatch',
    description:
      'View active Indonesian volcanoes with current volcanic ash areas, movement, and forecast information.',
    url: `${SITE_URL}/volcanoes`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Active Volcanoes & Ash Areas Indonesia — AshWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Active Volcanoes & Ash Areas Indonesia | AshWatch',
    description:
      'View active Indonesian volcanoes with current volcanic ash areas, movement, and forecast information.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default async function VolcanoesPage() {
  const data = await getDarwinAdvisories();
  const volcanoes = data.deduplicated;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Active Ash Areas', url: '/volcanoes' }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-1">
            <span className="h-2 w-2 rounded-full bg-[#FF6B1A] animate-pulse"></span>
            <span>Live Ash Telemetry</span>
          </div>
          {/* Page title strictly according to tugas.md */}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Active Ash Areas
          </h1>
          {/* Subtitle strictly according to tugas.md */}
          <p className="mt-2 text-xs sm:text-sm text-[#8B95A7]">
            Volcanoes currently producing or associated with volcanic ash advisories.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-semibold text-[#8B95A7]">
            <span className="font-bold text-white mr-1">{volcanoes.length}</span> Active Plumes
          </div>
          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF8A3D] transition shadow-md"
          >
            <Map className="h-3.5 w-3.5" />
            <span>View All on Map</span>
          </Link>
        </div>
      </div>

      {/* Compact Cards Grid (Strictly per tugas.md) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {volcanoes.map((v) => {
          const slug = v.volcanoName.toLowerCase();

          return (
            <div
              key={v.id}
              className="surface-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-wide">
                      {v.volcanoName}
                    </h2>
                    <span className="text-xs text-[#8B95A7]">{v.area}</span>
                  </div>

                  <span className="rounded-full bg-[#FF6B1A]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FF8A3D] border border-[#FF6B1A]/30">
                    Ash detected
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8B95A7]">Ash Altitude:</span>
                    <span className="font-bold text-white">
                      {formatAltitudeCompact(v.primaryFlightLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8B95A7]">Movement:</span>
                    <span className="text-amber-300 font-semibold">
                      {formatMovementHuman(v.primaryMovement)}
                    </span>
                  </div>
                </div>

                {v.eruptionDetails && (
                  <p className="mt-3 text-xs font-mono text-slate-300 bg-[#0B0F17]/70 border border-white/5 rounded-lg p-2.5 line-clamp-2">
                    {v.eruptionDetails}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <Link
                  href={`/volcanoes/${slug}`}
                  className="text-xs text-[#8B95A7] hover:text-white transition"
                >
                  Volcano details
                </Link>

                <Link
                  href={`/map?lat=${v.position?.latitude || -6}&lng=${v.position?.longitude || 106}&label=${encodeURIComponent(
                    v.volcanoName
                  )}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition group"
                >
                  <span>View on Map</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
