import React from 'react';
import type { Metadata } from 'next';
import { getDarwinAdvisories } from '@/lib/advisories';
import { MapWrapper } from '@/components/map/map-wrapper';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: 'Live Volcanic Ash Map — Indonesia Airspace',
  description:
    'Interactive OpenStreetMap tracking real-time Darwin VAAC volcanic ash advisories, flight levels, and ash cloud polygons across Indonesia.',
  alternates: {
    canonical: '/map',
  },
  openGraph: {
    title: 'Live Volcanic Ash Map — Indonesia Airspace | AshWatch',
    description:
      'Explore active Indonesian volcanic ash advisories, multi-altitude flight levels, and dispersion forecasts on an interactive map.',
    url: `${SITE_CONFIG.siteUrl}/map`,
  },
};

export const revalidate = 120; // Revalidate every 2 minutes

export default async function MapPage() {
  const data = await getDarwinAdvisories();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a1628]">
      <MapWrapper
        advisories={data.deduplicated}
        updatedAt={data.updatedAt}
        source={data.source}
        totalActive={data.totalActiveVolcanoes}
      />
    </div>
  );
}
