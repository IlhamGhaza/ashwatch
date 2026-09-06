import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { formatAltitudeCompact, formatMovementHuman } from '@/lib/aviation-format';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
  Flame,
  MapPin,
  Map,
  ArrowRight,
  ExternalLink,
  Clock,
  Layers,
  Mountain,
  ChevronRight,
} from 'lucide-react';
import { SITE_URL } from '@/config/site';

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
  const title = `Mount ${volcanoName} Volcanic Ash Map | AshWatch`;
  const description = advisory
    ? `Active volcanic ash map and advisory for Mount ${advisory.volcanoName}, Indonesia. Observed ash altitude: ${formatAltitudeCompact(
        advisory.primaryFlightLevel
      )}, movement: ${formatMovementHuman(advisory.primaryMovement)}.`
    : `Volcanic ash monitoring and map for Mount ${volcanoName} in Indonesia.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/volcanoes/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/volcanoes/${slug}`,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Mount ${volcanoName} Volcanic Ash Map — AshWatch`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}

export default async function VolcanoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getDarwinAdvisories();

  const latestAdvisory = data.deduplicated.find(
    (a) => a.volcanoName.toLowerCase() === slug.toLowerCase() || a.id.toLowerCase() === slug.toLowerCase()
  );

  if (!latestAdvisory) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <Breadcrumbs
          items={[
            { name: 'Active Ash Areas', url: '/volcanoes' },
            { name: slug.toUpperCase(), url: `/volcanoes/${slug}` },
          ]}
        />
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#111827]/60 p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#151C28] text-[#8B95A7] mb-4">
            <Mountain className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            {slug.toUpperCase()}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#8B95A7] max-w-md mx-auto">
            There is currently no active volcanic ash advisory reported for this volcano in the recent Darwin VAAC feed.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/volcanoes"
              className="rounded-xl bg-[#151C28] px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Browse Active Ash Areas
            </Link>
            <Link
              href="/map"
              className="rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF8A3D] transition"
            >
              Open Live Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const history = data.advisories.filter(
    (a) => a.volcanoName.toUpperCase() === latestAdvisory.volcanoName.toUpperCase()
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Active Ash Areas', url: '/volcanoes' },
          { name: latestAdvisory.volcanoName, url: `/volcanoes/${slug}` },
        ]}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B95A7]">
              <MapPin className="h-3.5 w-3.5 text-[#FF6B1A]" />
              <span>{latestAdvisory.area}</span>
              {latestAdvisory.volcanoCode && <span>· #{latestAdvisory.volcanoCode}</span>}
            </div>
            <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">
              Mount {latestAdvisory.volcanoName} Volcanic Ash Map
            </h1>
            <p className="mt-1 text-xs text-[#8B95A7]">
              {latestAdvisory.position
                ? `Coordinates: ${latestAdvisory.position.latitude.toFixed(2)}°, ${latestAdvisory.position.longitude.toFixed(2)}°`
                : ''}
              {latestAdvisory.sourceElevation ? ` · Summit Elevation: ${latestAdvisory.sourceElevation}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/map?lat=${latestAdvisory.position?.latitude || -6}&lng=${latestAdvisory.position?.longitude || 106}&label=${encodeURIComponent(
                latestAdvisory.volcanoName
              )}`}
              className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#FF8A3D] transition"
            >
              <Map className="h-3.5 w-3.5" />
              <span>Inspect on Map</span>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#0B0F17]/80 p-3.5 border border-white/5">
            <span className="text-[10px] text-[#8B95A7] uppercase block">Ash Altitude</span>
            <span className="text-sm font-bold text-white">
              {formatAltitudeCompact(latestAdvisory.primaryFlightLevel)}
            </span>
          </div>
          <div className="rounded-xl bg-[#0B0F17]/80 p-3.5 border border-white/5">
            <span className="text-[10px] text-[#8B95A7] uppercase block">Movement Drift</span>
            <span className="text-sm font-semibold text-amber-300">
              {formatMovementHuman(latestAdvisory.primaryMovement)}
            </span>
          </div>
          <div className="rounded-xl bg-[#0B0F17]/80 p-3.5 border border-white/5">
            <span className="text-[10px] text-[#8B95A7] uppercase block">Last Advisory</span>
            <span className="text-xs font-semibold text-slate-300">
              {formatWibDateTime(latestAdvisory.dtg)}
            </span>
          </div>
        </div>
      </div>

      {/* Advisory History Section */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">
          Recent Advisories for {latestAdvisory.volcanoName} ({history.length})
        </h2>

        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="surface-card rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    Advisory #{h.advisoryNumber}
                  </span>
                  <span className="text-xs text-[#8B95A7]">
                    {formatWibDateTime(h.dtg)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#8B95A7] flex items-center gap-3">
                  <span>Alt: <strong className="text-white">{h.primaryFlightLevel}</strong></span>
                  <span>•</span>
                  <span>Mov: <strong className="text-amber-300">{h.primaryMovement}</strong></span>
                </div>
              </div>

              <Link
                href={`/advisories/${h.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-[#FF6B1A] hover:text-[#FF8A3D] transition self-end sm:self-auto"
              >
                <span>View Bulletin</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
