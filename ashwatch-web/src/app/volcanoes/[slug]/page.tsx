import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { INDONESIA_VOLCANO_DATABASE } from '@/lib/fixtures';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Flame,
  MapPin,
  Mountain,
  Plane,
  ShieldAlert,
  Map,
  ArrowRight,
  ExternalLink,
  Layers,
  Compass,
} from 'lucide-react';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return INDONESIA_VOLCANO_DATABASE.map((v) => ({
    slug: v.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const volcano = INDONESIA_VOLCANO_DATABASE.find((v) => v.slug === slug);

  if (!volcano) {
    return {
      title: 'Volcano Not Found',
    };
  }

  const title = `${volcano.name} Volcano Volcanic Ash & Airspace Monitoring`;
  const description = `Real-time volcanic ash advisory status, elevation (${volcano.elevation}), coordinates, and aviation dispersion risks for Mount ${volcano.name}, Indonesia.`;

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
  const volcano = INDONESIA_VOLCANO_DATABASE.find((v) => v.slug === slug);

  if (!volcano) {
    notFound();
  }

  const data = await getDarwinAdvisories();
  const latestAdvisory = data.deduplicated.find(
    (a) => a.volcanoName.toUpperCase() === volcano.name.toUpperCase()
  );

  const color = getVolcanoColor(volcano.name);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Volcanoes', url: '/volcanoes' },
          { name: volcano.name, url: `/volcanoes/${volcano.slug}` },
        ]}
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: color }}
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{volcano.location} · {volcano.island}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              Mount {volcano.name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Coordinates: {volcano.coordinates.latitude.toFixed(4)}°, {volcano.coordinates.longitude.toFixed(4)}° · Summit Elevation: {volcano.elevation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {latestAdvisory ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-3.5 py-1 text-xs font-bold text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Active Ash Plume</span>
              </span>
            ) : (
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3.5 py-1 text-xs font-semibold text-slate-300">
                Routine Watch
              </span>
            )}

            <Link
              href={`/map`}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 transition"
            >
              <Map className="h-4 w-4" />
              <span>Locate on Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Context & Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Volcanological Overview</h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {volcano.description}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Plane className="h-5 w-5 text-amber-400" />
              <span>Aviation Significance & Flight Corridors</span>
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              {volcano.aviationSignificance}
            </p>
          </section>

          {/* Active Advisory Card */}
          {latestAdvisory && (
            <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-bold text-white">Latest Darwin VAAC Bulletin</h2>
                </div>
                <span className="text-xs text-red-300 font-mono">
                  Advisory #{latestAdvisory.advisoryNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Observed Flight Level:</span>
                  <span className="font-bold text-red-400 text-sm">{latestAdvisory.primaryFlightLevel}</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Movement Drift Vector:</span>
                  <span className="font-semibold text-amber-300 text-sm">{latestAdvisory.primaryMovement}</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Issued Date Time Group (WIB):</span>
                  <span className="text-slate-200">{formatWibDateTime(latestAdvisory.dtg)}</span>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Next Advisory Update:</span>
                  <span className="text-slate-200">{latestAdvisory.nextAdvisory || 'As required'}</span>
                </div>
              </div>

              {latestAdvisory.eruptionDetails && (
                <div className="mt-4 rounded-xl bg-slate-900/90 p-3 border border-slate-800 text-xs font-mono text-slate-300">
                  <strong className="text-slate-400 block mb-1">ERUPTION DETAILS:</strong>
                  {latestAdvisory.eruptionDetails}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <Link
                  href={`/advisories/${latestAdvisory.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300"
                >
                  <span>Read Full Raw Advisory Bulletin</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Geographic Specs
            </h3>
            <dl className="divide-y divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400">Summit Height:</dt>
                <dd className="font-semibold text-white">{volcano.elevation}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400">Island Area:</dt>
                <dd className="font-semibold text-white">{volcano.island}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400">Latitude:</dt>
                <dd className="font-mono text-white">{volcano.coordinates.latitude.toFixed(4)}°</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400">Longitude:</dt>
                <dd className="font-mono text-white">{volcano.coordinates.longitude.toFixed(4)}°</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400">VAAC Responsibility:</dt>
                <dd className="font-semibold text-white">Darwin (BoM)</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
            <h3 className="text-sm font-bold text-white mb-2">Explore Airspace</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              View this volcano alongside current radar-tracked clouds on the interactive map.
            </p>
            <Link
              href="/map"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              <Map className="h-4 w-4 text-red-500" />
              <span>Open Live Map</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
