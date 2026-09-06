import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Database, Globe, Map, ExternalLink, Radio } from 'lucide-react';

import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  title: 'Volcanic Ash Data Sources | AshWatch',
  description:
    'Learn where AshWatch gets volcanic ash and volcano information, including Darwin VAAC, BMKG, MAGMA Indonesia / PVMBG, and OpenStreetMap.',
  alternates: {
    canonical: `${SITE_URL}/data-sources`,
  },
  openGraph: {
    title: 'Volcanic Ash Data Sources | AshWatch',
    description:
      'Learn where AshWatch gets volcanic ash and volcano information, including Darwin VAAC, BMKG, MAGMA Indonesia / PVMBG, and OpenStreetMap.',
    url: `${SITE_URL}/data-sources`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Volcanic Ash Data Sources — AshWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volcanic Ash Data Sources | AshWatch',
    description:
      'Learn where AshWatch gets volcanic ash and volcano information, including Darwin VAAC, BMKG, MAGMA Indonesia / PVMBG, and OpenStreetMap.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Data Sources', url: '/data-sources' }]} />

      <div className="max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Data Sources
        </h1>
        <p className="mt-3 text-sm text-[#8B95A7]">
          AshWatch visualizes public bulletins from authoritative regional agencies without modifying the underlying data.
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary Source: Darwin VAAC */}
        <div className="surface-card rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B1A]/20 text-[#FF6B1A]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Primary Source
                </span>
                <h2 className="text-lg font-bold text-white">Bureau of Meteorology · Darwin VAAC</h2>
              </div>
            </div>

            <a
              href="https://www.bom.gov.au/products/Volc_ash_recent.shtml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-[#FF6B1A] hover:text-[#FF8A3D] transition self-start sm:self-auto"
            >
              <span>View Official BoM Feed</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
            Operated by the Australian Bureau of Meteorology in Darwin, this centre is designated by ICAO
            to monitor volcanic ash across the Indonesian archipelago, Papua New Guinea, and Australia.
            AshWatch ingests and parses their publicly published Volcanic Ash Advisories (VAA).
          </p>
        </div>

        {/* Secondary Source: BMKG */}
        <div className="surface-card rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Aviation Weather & Satellite Observation
                </span>
                <h2 className="text-lg font-bold text-white">BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)</h2>
              </div>
            </div>

            <a
              href="https://aviation.bmkg.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition self-start sm:self-auto"
            >
              <span>Aviation Meteorology Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
            As Indonesia&apos;s national meteorological agency, BMKG monitors regional atmospheric conditions,
            tracks high-altitude wind currents, operates Himawari-9 geostationary satellite reception
            (including Volcanic Ash RGB products), and coordinates official VA SIGMETs across Jakarta (WIIF)
            and Ujung Pandang (WAAF) Flight Information Regions.
          </p>
        </div>

        {/* Tertiary Source: MAGMA Indonesia */}
        <div className="surface-card rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Ground & Seismic Monitoring
                </span>
                <h2 className="text-lg font-bold text-white">MAGMA Indonesia / PVMBG</h2>
              </div>
            </div>

            <a
              href="https://magma.esdm.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition self-start sm:self-auto"
            >
              <span>Visit Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
            Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) di bawah Badan Geologi Kementerian ESDM menyediakan
            laporan resmi status tingkat aktivitas gunung api di Indonesia (Level I Normal, Level II Waspada, Level III Siaga,
            Level IV Awas) serta rekomendasi radius bahaya. Status aktivitas ini diintegrasikan dan divisualisasikan langsung
            pada pin gunung api, tooltip, dan panel rincian di peta interaktif AshWatch.
          </p>
        </div>

        {/* Base Map: OpenStreetMap */}
        <div className="surface-card rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Base Map Provider
                </span>
                <h2 className="text-lg font-bold text-white">OpenStreetMap</h2>
              </div>
            </div>

            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition self-start sm:self-auto"
            >
              <span>Copyright & Contributors</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <p className="text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
            All map tiles and geospatial reference points are rendered via OpenStreetMap contributors.
          </p>
        </div>
      </div>
    </div>
  );
}
