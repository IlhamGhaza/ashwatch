import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ShieldAlert, ExternalLink, Code2, Heart, Award, User } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'About AshWatch — Project Mission & Engineering',
  description:
    'Learn about AshWatch, an open-source project converting Darwin VAAC volcanic ash bulletins into interactive geospatial intelligence for Indonesian airspace.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'About', url: '/about' }]} />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          About AshWatch
        </h1>
        <p className="mt-4 text-lg text-slate-300 leading-relaxed">
          AshWatch was created to solve a critical usability gap in volcanic hazard monitoring:
          transforming raw, telex-era aviation weather bulletins into intuitive, real-time
          geospatial visualizations for Indonesian airspace.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {/* Mission & Background */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">The Challenge</h2>
          <p className="text-sm leading-relaxed text-slate-300 mb-4">
            Indonesia contains more active volcanoes than any other country in the world. When Krakatau,
            Semeru, or Lewotolok erupt, high-altitude volcanic ash poses severe hazards to aircraft engines
            and flight safety. The Darwin Volcanic Ash Advisory Centre (VAAC), managed by the Australian
            Bureau of Meteorology (BoM), publishes bulletins containing multi-altitude coordinates.
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            However, these advisories are formatted as plain alphanumeric text (ICAO Annex 3 format).
            Visualizing multi-layer flight levels (e.g., <code className="text-xs text-red-400">SFC/FL200</code> moving East
            and <code className="text-xs text-amber-400">SFC/FL500</code> moving West) requires mental mapping or specialized
            flight planning software. AshWatch bridges this divide by delivering instantaneous, browser-accessible maps.
          </p>
        </section>

        {/* Engineering & Architecture */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Architecture & Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
              <strong className="text-white block mb-1">Full Server-Side Rendering (SSR/SSG)</strong>
              <p className="text-xs text-slate-400">
                Built with Next.js App Router for crawlable semantic HTML, fast Core Web Vitals, and edge caching.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
              <strong className="text-white block mb-1">Resilient Data Ingestion Engine</strong>
              <p className="text-xs text-slate-400">
                Server-side proxy ingesting Australian BoM telemetry directly, bypassing CORS barriers with fallback caching.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
              <strong className="text-white block mb-1">High-Precision Aviation Parser</strong>
              <p className="text-xs text-slate-400">
                Custom normalization algorithm parsing non-standard continuation lines, DDMM/DDDMM coordinates, and movement vectors.
              </p>
            </div>
            <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
              <strong className="text-white block mb-1">Vercel Edge Ready</strong>
              <p className="text-xs text-slate-400">
                Zero-config deployment with automated sitemaps, robots.txt, dynamic OpenGraph generation, and JSON-LD schema.
              </p>
            </div>
          </div>
        </section>

        {/* Creator Profile - Ilham Ghaza */}
        <section className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/20 p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/20">
                <User className="h-7 w-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Creator & Lead Developer
                </span>
                <h2 className="text-2xl font-black text-white">Ilham Ghaza</h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                  Software engineer & open-source developer behind AshWatch. Follow and explore projects on GitHub.
                </p>
              </div>
            </div>

            <a
              href="https://github.com/IlhamGhaza"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition hover:-translate-y-0.5"
            >
              <span>Visit @IlhamGhaza on GitHub</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* Safety & Compliance Disclaimer - Section 23 of tugas.md */}
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-amber-300">
                Important Aviation & Emergency Disclaimer
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
                AshWatch is an independent visualization and research tool. It is <strong>NOT</strong> an official
                government meteorological office, air navigation service provider (ANSP), or civil aviation authority.
                Information displayed by AshWatch must never be utilized as the primary or sole source for flight dispatch,
                airway routing, emergency evacuation, or safety-critical decisions.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
                Aviation operators, pilots, and travelers must consult official certified sources, including
                AirNav Indonesia NOTAMs, ASHTAMs, SIGMETs, and direct BoM Darwin VAAC bulletins.
              </p>
            </div>
          </div>
        </section>

        {/* Open Source & Links */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Open Source & Community</h3>
            <p className="text-xs text-slate-400 mt-1">
              AshWatch is distributed under the MIT License. Contributions and feedback are welcome.
            </p>
          </div>
          <a
            href={SITE_CONFIG.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
          >
            <Code2 className="h-4 w-4 text-red-400" />
            <span>GitHub Repository</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </section>
      </div>
    </div>
  );
}
