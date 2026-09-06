import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { INDONESIA_VOLCANO_DATABASE } from '@/lib/fixtures';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Flame, Mountain, ArrowRight, MapPin, Layers } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'Indonesian Volcano Directory — Airspace Monitoring',
  description:
    'Comprehensive directory of monitored active volcanoes across the Indonesian archipelago, including Krakatau, Semeru, Lewotolok, Ibu, and Dukono.',
  alternates: {
    canonical: '/volcanoes',
  },
};

export default async function VolcanoesPage() {
  const data = await getDarwinAdvisories();
  const activeNames = new Set(data.deduplicated.map((a) => a.volcanoName.toUpperCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Volcanoes', url: '/volcanoes' }]} />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Monitored Volcanoes in Indonesia
        </h1>
        <p className="mt-3 text-base text-slate-300">
          Indonesia features over 130 active volcanic structures along the Sunda and Banda arcs.
          AshWatch actively tracks volcanic ash advisories issued by Darwin VAAC for these major centers.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {INDONESIA_VOLCANO_DATABASE.map((v) => {
          const isActive = activeNames.has(v.name.toUpperCase());
          const color = getVolcanoColor(v.name);

          return (
            <Link
              key={v.slug}
              href={`/volcanoes/${v.slug}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg backdrop-blur-sm transition hover:border-red-500/50 hover:bg-slate-900/90 hover:-translate-y-1"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color }}
              />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Flame className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                        {v.name}
                      </h2>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{v.location}</span>
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/30 animate-pulse">
                      Active Plume
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                      Monitored
                    </span>
                  )}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-300 line-clamp-3">
                  {v.description}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Summit: <strong className="text-slate-200">{v.elevation}</strong></span>
                <span className="flex items-center gap-1 font-semibold text-red-400 group-hover:translate-x-1 transition-transform">
                  <span>View Volcano</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
