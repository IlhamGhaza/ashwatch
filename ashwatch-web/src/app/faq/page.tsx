import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd, getFaqJsonLd } from '@/components/json-ld';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) — Volcanic Ash & Darwin VAAC',
  description:
    'Comprehensive answers to questions about volcanic ash hazards, Darwin VAAC advisories, flight levels, and AshWatch mapping.',
  alternates: {
    canonical: '/faq',
  },
};

const FAQ_LIST = [
  {
    question: 'What is volcanic ash?',
    answer:
      'Volcanic ash consists of tiny jagged particles of pulverized rock, minerals, and volcanic glass expelled into the atmosphere during explosive volcanic eruptions. Ash is abrasive, dense, electrically conductive, and does not dissolve in water.',
  },
  {
    question: 'What is a volcanic ash advisory (VAA)?',
    answer:
      'A Volcanic Ash Advisory (VAA) is an internationally standardized aeronautical meteorological bulletin issued by a Volcanic Ash Advisory Centre (VAAC). It describes current observed ash clouds and provides +6, +12, and +18-hour dispersion forecasts with coordinates, altitudes, and movement vectors.',
  },
  {
    question: 'What is Darwin VAAC?',
    answer:
      'The Darwin Volcanic Ash Advisory Centre is one of nine worldwide regional centers designated by ICAO. Operated by the Australian Bureau of Meteorology in Darwin, it is responsible for monitoring volcanic ash across Australia, Papua New Guinea, and the Indonesian archipelago.',
  },
  {
    question: 'How does AshWatch display volcanic ash?',
    answer:
      'AshWatch parses the raw coordinate sequences (DDMM/DDDMM) and flight level parameters from Darwin VAAC bulletins and translates them into responsive, multi-altitude colored polygons on an interactive OpenStreetMap.',
  },
  {
    question: 'Does AshWatch provide official aviation safety information?',
    answer:
      'No. AshWatch is an independent open-source visualization project. It does not provide certified operational flight clearances or official safety determinations. Pilots, airlines, and aviation personnel must refer to official NOTAMs, ASHTAMs, and AirNav Indonesia bulletins.',
  },
  {
    question: 'Which volcanoes are shown on AshWatch?',
    answer:
      'AshWatch displays all Indonesian volcanoes that have active or recent volcanic ash advisories recorded by Darwin VAAC, including Krakatau, Semeru, Lewotolok, Ibu, Dukono, Marapi, and Merapi.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'AshWatch synchronizes with the Darwin VAAC bulletin feed every 10 minutes. The interactive map includes an on-demand refresh trigger for real-time validation.',
  },
  {
    question: 'What does "Flight Level" (e.g. FL060, FL500) mean?',
    answer:
      'A Flight Level (FL) represents altitude above standard sea level in hundreds of feet. For instance, FL060 equals 6,000 feet, while FL500 represents 50,000 feet—stratospheric heights reached by violent explosive eruptions.',
  },
  {
    question: 'Why do ash polygons have different opacities on the map?',
    answer:
      'AshWatch applies decreasing opacity to convey forecast uncertainty over time: Observed/Estimated ash clouds have the highest opacity (55%), followed by +6h (40%), +12h (28%), and +18h (18%).',
  },
];

export default function FaqPage() {
  const faqSchema = getFaqJsonLd(FAQ_LIST);

  return (
    <>
      <JsonLd data={faqSchema} />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ name: 'FAQ', url: '/faq' }]} />

        <div className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed">
            Detailed insights into volcanic ash science, aviation safety protocols, Darwin VAAC
            operations, and AshWatch engineering.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {FAQ_LIST.map((item, idx) => (
            <article
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700"
            >
              <h2 className="text-lg font-bold text-white flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span>{item.question}</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 pl-8">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
