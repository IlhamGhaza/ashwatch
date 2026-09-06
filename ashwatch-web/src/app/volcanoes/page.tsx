import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Flame, ArrowRight, MapPin, Plane, Wind, Layers, Radio, ExternalLink } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Active Indonesian Volcanoes — Live Darwin VAAC Feed',
  description:
    'Live list of Indonesian volcanoes currently producing volcanic ash advisories (VAA) from the Darwin Volcanic Ash Advisory Centre (BoM Australia).',
  alternates: {
    canonical: '/volcanoes',
  },
};

export default async function VolcanoesPage() {
  const data = await getDarwinAdvisories();
  const volcanoes = data.deduplicated;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Volcanoes', url: '/volcanoes' }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>Direct Darwin VAAC Aviation Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Active Volcanoes in Indonesia
          </h1>
          <p className="mt-2 text-base text-slate-300">
            Real-time list of Indonesian volcanoes currently tracked by the Australian Bureau of Meteorology (BoM) Darwin VAAC. Extracted directly from live public bulletins.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400">
            <span className="font-bold text-sm text-white mr-1.5">{volcanoes.length}</span> Active Volcanoes
          </div>
          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow"
          >
            <span>View on Map</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {volcanoes.map((v) => {
          const color = getVolcanoColor(v.volcanoName);
          const slug = v.volcanoName.toLowerCase();

          return (
            <div
              key={v.id}
              className="glass-panel-interactive group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: color }}
              />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Flame className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white group-hover:text-red-400 transition-colors">
                        {v.volcanoName}
                      </h2>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>{v.area} {v.volcanoCode ? `· #${v.volcanoCode}` : ''}</span>
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400 border border-red-500/30 animate-pulse">
                    Active Plume
                  </span>
                </div>

                {/* Telemetry Metrics */}
                <div className="mt-5 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400">Advisory Number:</span>
                    <span className="font-mono font-semibold text-slate-200">#{v.advisoryNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Plane className="h-3 w-3 text-red-400" />
                      <span>Flight Level:</span>
                    </span>
                    <span className="font-bold text-red-400">{v.primaryFlightLevel}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Wind className="h-3 w-3 text-amber-400" />
                      <span>Movement:</span>
                    </span>
                    <span className="font-semibold text-amber-300">{v.primaryMovement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Layers className="h-3 w-3 text-blue-400" />
                      <span>Polygon Layers:</span>
                    </span>
                    <span className="font-semibold text-slate-300">{v.polygons.length} layer{v.polygons.length > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {v.eruptionDetails && (
                  <p className="mt-4 text-xs font-mono text-slate-300 bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 line-clamp-2">
                    {v.eruptionDetails}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {v.sourceElevation ? `Elevation: ${v.sourceElevation}` : (v.position ? `${v.position.latitude.toFixed(2)}°, ${v.position.longitude.toFixed(2)}°` : 'BoM Live Feed')}
                </span>
                <Link
                  href={`/volcanoes/${slug}`}
                  className="flex items-center gap-1 font-semibold text-red-400 hover:text-white transition group-hover:translate-x-1 transition-transform"
                >
                  <span>Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
