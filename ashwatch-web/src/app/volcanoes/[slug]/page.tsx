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
  MapPin,
  Mountain,
  Plane,
  Wind,
  Map,
  ArrowRight,
  ExternalLink,
  Layers,
  Clock,
  Radio,
  FileText,
} from 'lucide-react';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDarwinAdvisories();
  const advisory = data.deduplicated.find(
    (a) => a.volcanoName.toLowerCase() === slug.toLowerCase() || a.id.toLowerCase() === slug.toLowerCase()
  );

  const volcanoName = advisory ? advisory.volcanoName : slug.toUpperCase();

  const title = `${volcanoName} Volcano Volcanic Ash & Airspace Monitoring`;
  const description = advisory
    ? `Live Darwin VAAC Volcanic Ash Advisory #${advisory.advisoryNumber} for Mount ${advisory.volcanoName}. Primary flight level ${advisory.primaryFlightLevel}, movement ${advisory.primaryMovement}.`
    : `Aviation monitoring for Mount ${volcanoName} in Indonesia.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/volcanoes/${slug}`,
    },
    openGraph: {
      title: `${title} | AshWatch`,
      description,
      url: `${SITE_URL}/volcanoes/${slug}`,
    },
  };
}

export default async function VolcanoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getDarwinAdvisories();

  // Look up in live BoM advisories
  const latestAdvisory = data.deduplicated.find(
    (a) => a.volcanoName.toLowerCase() === slug.toLowerCase() || a.id.toLowerCase() === slug.toLowerCase()
  );

  if (!latestAdvisory) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <Breadcrumbs
          items={[
            { name: 'Volcanoes', url: '/volcanoes' },
            { name: slug.toUpperCase(), url: `/volcanoes/${slug}` },
          ]}
        />
        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-12 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-4">
            <Mountain className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            {slug.toUpperCase()}
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
            Darwin VAAC is not currently tracking an active volcanic ash advisory for this summit in the recent BoM feed.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/volcanoes"
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Browse Active Volcanoes
            </Link>
            <Link
              href="/map"
              className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition"
            >
              Launch Live Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // All bulletins for this volcano in the 7-day feed
  const history = data.advisories.filter(
    (a) => a.volcanoName.toUpperCase() === latestAdvisory.volcanoName.toUpperCase()
  );

  const color = getVolcanoColor(latestAdvisory.volcanoName);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Volcanoes', url: '/volcanoes' },
          { name: latestAdvisory.volcanoName, url: `/volcanoes/${slug}` },
        ]}
      />

      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: color }}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{latestAdvisory.area} {latestAdvisory.volcanoCode ? `· ICAO #${latestAdvisory.volcanoCode}` : ''}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              Mount {latestAdvisory.volcanoName}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {latestAdvisory.position
                ? `Coordinates: ${latestAdvisory.position.latitude.toFixed(4)}°, ${latestAdvisory.position.longitude.toFixed(4)}°`
                : ''}
              {latestAdvisory.sourceElevation ? ` · Summit Elevation: ${latestAdvisory.sourceElevation}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-3.5 py-1 text-xs font-bold text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>Active Ash Plume</span>
            </span>

            <Link
              href="/map"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 transition"
            >
              <Map className="h-4 w-4" />
              <span>View On Map</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-red-400" />
              <span>Flight Level</span>
            </span>
            <p className="mt-1 text-lg font-bold text-red-400">
              {latestAdvisory.primaryFlightLevel}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-amber-400" />
              <span>Movement</span>
            </span>
            <p className="mt-1 text-lg font-bold text-amber-300">
              {latestAdvisory.primaryMovement}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Polygons</span>
            </span>
            <p className="mt-1 text-lg font-bold text-white">
              {latestAdvisory.polygons.length} layers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Latest Bulletin</span>
            </span>
            <p className="mt-1 text-xs font-bold text-slate-200" suppressHydrationWarning>
              {formatWibDateTime(latestAdvisory.dtg)}
            </p>
          </div>
        </div>

        {latestAdvisory.eruptionDetails && (
          <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Eruption Details
            </span>
            <p className="font-mono text-slate-200 leading-relaxed">
              {latestAdvisory.eruptionDetails}
            </p>
          </div>
        )}
      </div>

      {/* Advisory Bulletins History */}
      <div className="mt-10">
        <h2 className="text-xl font-black text-white mb-4">
          Recent Bulletins from Darwin VAAC ({history.length})
        </h2>

        <div className="space-y-3">
          {history.map((adv) => (
            <div
              key={adv.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-sm gap-3 hover:border-slate-700 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm">
                    Advisory #{adv.advisoryNumber}
                  </span>
                  <span className="text-xs text-slate-400" suppressHydrationWarning>
                    · {formatWibDateTime(adv.dtg)} ({formatUtcDateTime(adv.dtg)})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-red-400 font-semibold">{adv.primaryFlightLevel}</span>
                  <span>•</span>
                  <span className="text-amber-300">{adv.primaryMovement}</span>
                  <span>•</span>
                  <span>{adv.polygons.length} polygon layers</span>
                </div>
              </div>

              <Link
                href={`/advisories/${adv.id}`}
                className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-white transition self-end sm:self-center"
              >
                <span>Inspect Bulletin</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
