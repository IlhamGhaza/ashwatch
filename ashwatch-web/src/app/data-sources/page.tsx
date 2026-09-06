import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Database, Satellite, ExternalLink, ShieldCheck, Radio, Globe } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'Data Sources & Meteorological Telemetry — Darwin VAAC',
  description:
    'Detailed overview of AshWatch data feeds, including Australian Bureau of Meteorology Darwin VAAC, JMA Himawari-9 satellite imaging, and ICAO aviation standards.',
  alternates: {
    canonical: '/data-sources',
  },
};

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Data Sources', url: '/data-sources' }]} />

      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Data Sources & Telemetry
        </h1>
        <p className="mt-4 text-base text-slate-300 leading-relaxed">
          AshWatch relies on public, authoritative aviation meteorological bulletins issued by international
          monitoring agencies. Learn how telemetry is captured, verified, and mapped.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {/* Source 1: Darwin VAAC */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bureau of Meteorology — Darwin VAAC</h2>
                <span className="text-xs text-slate-400">Australian Government Bureau of Meteorology</span>
              </div>
            </div>
            <a
              href="https://www.bom.gov.au/products/Volc_ash_recent.shtml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              <span>Official Feed</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            Darwin VAAC is one of nine worldwide centres designated by ICAO to monitor and forecast
            the dispersion of volcanic ash clouds. Its area of responsibility spans from 10°S to the Equator
            and encompasses all active Indonesian volcanic centers.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-950/60 p-4 border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ingestion Endpoint</h3>
            <code className="text-xs text-red-300 font-mono break-all">
              https://www.bom.gov.au/products/Volc_ash_recent.shtml
            </code>
          </div>
        </section>

        {/* Source 2: Satellite Telemetry */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Satellite className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Satellite Sensors (Himawari-9)</h2>
              <span className="text-xs text-slate-400">Japan Meteorological Agency (JMA)</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            Darwin VAAC utilizes multispectral infrared imaging from the Himawari-9 geostationary satellite
            positioned at 140.7°E. By calculating split-window brightness temperature differences (BTD between
            11 µm and 12 µm channels), meteorologists differentiate silicate volcanic ash clouds from standard
            water-vapor clouds.
          </p>
        </section>

        {/* Source 3: Ground Observatories */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MAGMA Indonesia & PVMBG</h2>
              <span className="text-xs text-slate-400">Pusat Vulkanologi dan Mitigasi Bencana Geologi (ESDM)</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            Ground-truth seismic, visual webcam, and visual eruption reports from Indonesian volcano observatories
            are synchronized with Darwin VAAC to establish eruption commencement times, plume heights above ground
            level (AGL), and initial drift vectors.
          </p>
        </section>
      </div>
    </div>
  );
}
