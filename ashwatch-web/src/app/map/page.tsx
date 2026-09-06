import React from 'react';
import type { Metadata } from 'next';
import { getDarwinAdvisories } from '@/lib/advisories';
import { MapWrapper } from '@/components/map/map-wrapper';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  title: 'Volcanic Ash Map Indonesia | Live Ash Spread | AshWatch',
  description:
    'Explore the volcanic ash map of Indonesia and check whether a location is inside an observed or forecast volcanic ash area.',
  alternates: {
    canonical: `${SITE_URL}/map`,
  },
  openGraph: {
    title: 'Volcanic Ash Map Indonesia | Live Ash Spread | AshWatch',
    description:
      'Explore the volcanic ash map of Indonesia and check whether a location is inside an observed or forecast volcanic ash area.',
    url: `${SITE_URL}/map`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Volcanic Ash Map Indonesia — AshWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volcanic Ash Map Indonesia | Live Ash Spread | AshWatch',
    description:
      'Explore the volcanic ash map of Indonesia and check whether a location is inside an observed or forecast volcanic ash area.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default async function MapPage() {
  const data = await getDarwinAdvisories();

  return (
    <div className="relative h-[calc(100vh-61px)] w-full overflow-hidden bg-[#0B0F17]">
      <h1 className="sr-only">Volcanic Ash Map Indonesia</h1>
      <p className="sr-only">
        Explore current volcanic ash areas and forecasts across Indonesia. Search or select a location to check whether it overlaps an ash zone.
      </p>
      <MapWrapper advisories={data.deduplicated} initialUpdatedAt={data.updatedAt} />
    </div>
  );
}
