import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime, formatUtcDateTime } from '@/lib/parser/date-utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Flame, Clock, Plane, Wind, ArrowRight, Radio, ExternalLink } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Recent Volcanic Ash Advisories — Darwin VAAC Indonesia',
  description:
    'Comprehensive archive and live feed of Darwin VAAC Volcanic Ash Advisories (VAA) for Indonesian volcanoes with flight levels, DTG, and wind drift.',
  alternates: {
    canonical: '/advisories',
  },
};

export default async function AdvisoriesPage() {
  const data = await getDarwinAdvisories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Advisories', url: '/advisories' }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>Live Aviation Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Recent Darwin VAAC Advisories
          </h1>
          <p className="mt-2 text-base text-slate-300 max-w-2xl">
            Browse standardized Volcanic Ash Advisory (VAA) bulletins issued by the Australian Bureau of
            Meteorology Darwin VAAC for Indonesian airspace.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Last Synced: <strong className="text-slate-200">{formatWibDateTime(data.updatedAt)}</strong>
        </div>
      </div>

      {/* Advisories Grid / List */}
      <div className="mt-10 space-y-4">
        {data.advisories.map((adv) => {
          const color = getVolcanoColor(adv.volcanoName);

          return (
            <div
              key={adv.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 transition hover:border-red-500/40 hover:bg-slate-900/80"
            >
              <div
                className="absolute top-0 bottom-0 left-0 w-1.5"
                style={{ backgroundColor: color }}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-2 sm:pl-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-white group-hover:text-red-400 transition-colors">
                      {adv.volcanoName}
                    </h2>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                      Advisory #{adv.advisoryNumber}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {adv.area}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{formatWibDateTime(adv.dtg)} ({formatUtcDateTime(adv.dtg)})</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Plane className="h-3.5 w-3.5 text-red-400" />
                      <span className="font-bold text-red-400">{adv.primaryFlightLevel}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Wind className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-amber-300">{adv.primaryMovement}</span>
                    </span>
                  </div>

                  {adv.eruptionDetails && (
                    <p className="mt-2 text-xs font-mono text-slate-300 bg-slate-950/60 rounded-lg p-2 max-w-2xl">
                      {adv.eruptionDetails}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/advisories/${adv.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition shadow"
                  >
                    <span>Inspect Bulletin</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
