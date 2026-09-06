import React from 'react';
import type { Metadata } from 'next';
import { getDarwinAdvisories } from '@/lib/advisories';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Radio } from 'lucide-react';
import { LiveAdvisoriesList } from '@/components/live-advisories-list';

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

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">
            <Radio className="h-4 w-4 animate-pulse" />
            <span>Live Aviation Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Recent Darwin VAAC Advisories
          </h1>
          <p className="mt-2 text-base text-slate-300 max-w-2xl">
            Standardized Volcanic Ash Advisory (VAA) bulletins issued by the Australian Bureau of
            Meteorology Darwin VAAC for Indonesian airspace. Real-time updates every 3 minutes.
          </p>
        </div>
      </div>

      {/* Live Advisories List with auto-polling & search */}
      <LiveAdvisoriesList
        initialAdvisories={data.advisories}
        initialUpdatedAt={data.updatedAt}
      />
    </div>
  );
}
