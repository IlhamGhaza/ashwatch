import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd, getFaqJsonLd } from '@/components/json-ld';
import { HelpCircle } from 'lucide-react';

import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  title: 'Volcanic Ash Map FAQ | AshWatch',
  description:
    'Learn how to read the AshWatch volcanic ash map, understand observed and forecast ash areas, and check whether your location is affected.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'Volcanic Ash Map FAQ | AshWatch',
    description:
      'Learn how to read the AshWatch volcanic ash map, understand observed and forecast ash areas, and check whether your location is affected.',
    url: `${SITE_URL}/faq`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Volcanic Ash Map FAQ — AshWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Volcanic Ash Map FAQ | AshWatch',
    description:
      'Learn how to read the AshWatch volcanic ash map, understand observed and forecast ash areas, and check whether your location is affected.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const FAQ_LIST = [
  {
    question: 'What does the orange area mean?',
    answer:
      'The orange translucent polygons show the forecast dispersion path of volcanic ash at future intervals (+6h, +12h, and +18h). Neutral gray-white areas represent currently observed ash.',
  },
  {
    question: 'How do I know if my location is affected?',
    answer:
      'Click "Check My Area" in the navigation bar or on the map, use the GPS button, or search for your city. AshWatch automatically checks if your location falls inside any active or forecast ash polygons.',
  },
  {
    question: 'What is observed ash?',
    answer:
      'Observed ash is the active volcanic ash cloud currently detected by satellites and meteorological observatories at the time the bulletin was issued.',
  },
  {
    question: 'What does +6h / +12h / +18h mean?',
    answer:
      'These represent future forecast timeframes. Atmospheric models estimate where the ash cloud will drift in 6, 12, and 18 hours based on regional wind patterns.',
  },
  {
    question: 'Why can ash move away from the volcano?',
    answer:
      'High-altitude winds (often between 10,000 and 50,000 feet) blow volcanic ash plumes across hundreds of kilometers, often in directions different from wind on the ground.',
  },
  {
    question: 'Is AshWatch an official warning system?',
    answer:
      'No. AshWatch is an independent public visualization platform. It does not provide official civil defense warnings, flight clearances, or emergency evacuation orders.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'AshWatch synchronizes with the Darwin VAAC bulletin feed every 3 to 10 minutes. You can also press the refresh button on the map to check for new data immediately.',
  },
  {
    question: 'Where does AshWatch get its volcanic ash data?',
    answer:
      'AshWatch ingests official Volcanic Ash Advisories (VAA) from the Darwin Volcanic Ash Advisory Centre (operated by the Australian Bureau of Meteorology under ICAO mandate for Indonesia). Contextual volcano monitoring references PVMBG (MAGMA Indonesia), with meteorological and satellite surveillance aligned with BMKG.',
  },
  {
    question: 'What is the role of Darwin VAAC, BMKG, and PVMBG?',
    answer:
      'PVMBG monitors seismic and physical volcanic activity directly on Indonesian terrain. BMKG monitors national weather, tracks Himawari-9 satellite ash imagery, and issues domestic aviation SIGMETs. Darwin VAAC is the international ICAO-designated center responsible for modeling atmospheric ash dispersion and cloud boundary forecasts across Indonesian airspace.',
  },
  {
    question: 'Can I use this to decide whether it is safe to travel?',
    answer:
      'AshWatch is designed for situational awareness only. For official travel advisories, flight status, and safety decisions, always consult your airline, airport authorities, or official civil protection agencies.',
  },
];

export default function FaqPage() {
  const faqSchema = getFaqJsonLd(FAQ_LIST);

  return (
    <>
      <JsonLd data={faqSchema} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ name: 'FAQ', url: '/faq' }]} />

        <div className="max-w-2xl mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Volcanic Ash Map FAQ
          </h1>
          <p className="mt-3 text-sm text-[#8B95A7]">
            Answers to common questions on how to read the volcanic ash map, forecast zones, and check your area.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_LIST.map((item, idx) => (
            <article
              key={idx}
              className="surface-card rounded-2xl p-5 border border-white/10 transition hover:border-white/20"
            >
              <h2 className="text-sm sm:text-base font-bold text-white flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-[#FF6B1A] shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#8B95A7] pl-6 leading-relaxed">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
