import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Map, Database, ShieldAlert, Code2, ExternalLink, User } from 'lucide-react';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  title: 'About AshWatch | Indonesia Volcanic Ash Map',
  description:
    'Learn about AshWatch, a public volcanic ash visualization tool for checking ash spread and affected areas across Indonesia.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: 'About AshWatch | Indonesia Volcanic Ash Map',
    description:
      'Learn about AshWatch, a public volcanic ash visualization tool for checking ash spread and affected areas across Indonesia.',
    url: `${SITE_URL}/about`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'About AshWatch — Indonesia Volcanic Ash Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About AshWatch | Indonesia Volcanic Ash Map',
    description:
      'Learn about AshWatch, a public volcanic ash visualization tool for checking ash spread and affected areas across Indonesia.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'About', url: '/about' }]} />

      <div className="max-w-2xl mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          About AshWatch
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#8B95A7] leading-relaxed">
          AshWatch helps people visualize volcanic ash spread across Indonesia and check whether
          a location overlaps an active or forecast ash area.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#8B95A7]">
        {/* Core Description */}
        <section className="surface-card rounded-2xl p-6 border border-white/10 space-y-3">
          <h2 className="text-base font-bold text-white">Simple, Accessible Volcanic Ash Awareness</h2>
          <p className="leading-relaxed">
            Indonesia is home to more than 130 active volcanoes. When eruptions occur, volcanic ash clouds
            can drift across provinces and islands. Historically, official advisories are published as
            plain alphanumeric telex bulletins. AshWatch turns this public data into an interactive, visual
            map so anyone can answer: <strong className="text-white">&ldquo;Is my area currently affected?&rdquo;</strong>
          </p>
        </section>

        {/* How It Works (Compact per tugas.md) */}
        <section className="surface-card rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
              <strong className="text-white block mb-1">1. Darwin VAAC & BMKG / PVMBG</strong>
              <p className="text-xs">
                Data is ingested from official bulletins issued by the Darwin Volcanic Ash Advisory
                Centre (ICAO mandate), with Indonesian meteorological context from BMKG and ground data from PVMBG.
              </p>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
              <strong className="text-white block mb-1">2. Ash Polygon Parsing</strong>
              <p className="text-xs">
                Atmospheric boundaries for observed ash and dispersion forecasts (+6h, +12h, +18h)
                are translated into geographic layers.
              </p>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
              <strong className="text-white block mb-1">3. OpenStreetMap Visualization</strong>
              <p className="text-xs">
                Interactive map rendering utilizes OpenStreetMap as its trusted, open geographic base.
              </p>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
              <strong className="text-white block mb-1">4. Independent Project</strong>
              <p className="text-xs">
                AshWatch is an independent open-source project. It is not an official government agency
                or airline dispatch system.
              </p>
            </div>
          </div>
        </section>

        {/* Creator & Open Source */}
        <section className="surface-card rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF6B1A]/20 text-[#FF6B1A]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Created by Ilham Ghazali</h3>
              <p className="text-xs text-[#8B95A7]">Open-source software engineer & developer.</p>
            </div>
          </div>

          <a
            href={SITE_CONFIG.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#151C28] px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition self-start sm:self-auto"
          >
            <Code2 className="h-3.5 w-3.5 text-[#FF6B1A]" />
            <span>GitHub Repository</span>
            <ExternalLink className="h-3 w-3 text-[#8B95A7]" />
          </a>
        </section>

        {/* Compact Disclaimer */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/80 p-4 text-xs text-[#8B95A7] flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-[#FF8A3D] shrink-0 mt-0.5" />
          <p>
            AshWatch visualizes public volcanic ash advisories from Darwin VAAC.
            It is not an official safety or evacuation service.
          </p>
        </div>
      </div>
    </div>
  );
}
