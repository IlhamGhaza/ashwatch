import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { formatAltitudeCompact, formatMovementHuman } from '@/lib/aviation-format';
import { JsonLd, getFaqJsonLd } from '@/components/json-ld';
import { CheckMyAreaCard } from '@/components/check-my-area-card';
import { IndonesiaMiniMap } from '@/components/indonesia-mini-map';
import { SITE_CONFIG, SITE_URL } from '@/config/site';
import {
  Map,
  MapPin,
  Flame,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
  ShieldAlert,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Wind,
} from 'lucide-react';

export const revalidate = 300; // Revalidate every 5 minutes

// Metadata according to Section 4 of tugas-seo.md
export const metadata: Metadata = {
  title: 'Volcanic Ash Map Indonesia | AshWatch',
  description:
    'Check volcanic ash spread across Indonesia with AshWatch. View active ash areas, volcanic ash forecasts, volcanoes, and check whether your location is affected.',
  alternates: {
    canonical: `${SITE_URL}`,
  },
  openGraph: {
    title: 'Volcanic Ash Map Indonesia | AshWatch',
    description:
      'Check volcanic ash spread across Indonesia with AshWatch. View active ash areas, volcanic ash forecasts, volcanoes, and check whether your location is affected.',
    url: `${SITE_URL}`,
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
    title: 'Volcanic Ash Map Indonesia | AshWatch',
    description:
      'Check volcanic ash spread across Indonesia with AshWatch. View active ash areas, forecasts, and check whether your location is affected.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const FAQ_ITEMS = [
  {
    question: 'What does the orange area mean?',
    answer:
      'The orange and translucent polygons indicate the predicted dispersion path of volcanic ash at future time intervals (+6 hours, +12 hours, and +18 hours). Neutral gray-white polygons represent currently observed ash clouds.',
  },
  {
    question: 'How do I know if my location is affected?',
    answer:
      'Use the "Check My Area" tool above, click on the map, or tap "Use My Location". AshWatch immediately evaluates whether your coordinates fall inside any observed or forecast ash polygons.',
  },
  {
    question: 'What is observed ash?',
    answer:
      'Observed ash is the active volcanic ash cloud currently detected by satellite sensors (such as Himawari-9) and ground observatories at the time the advisory was issued.',
  },
  {
    question: 'What does +6h / +12h / +18h mean?',
    answer:
      'These represent future forecast horizons modeled by Darwin VAAC atmospheric dispersion simulations, showing where the ash cloud is expected to drift in 6, 12, and 18 hours.',
  },
  {
    question: 'Why can ash move away from the volcano?',
    answer:
      'High-altitude winds carry fine volcanic ash particles hundreds of kilometers across provinces or sea straits, often moving in directions different from surface winds.',
  },
  {
    question: 'Is AshWatch an official warning system?',
    answer:
      'No. AshWatch is an independent public visualization tool using publicly available volcanic ash information from Darwin VAAC. It is not an official government service or aviation authority.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'AshWatch synchronizes with the Australian Bureau of Meteorology Darwin VAAC feed every 3 to 10 minutes whenever new volcanic ash advisories are published.',
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
      'AshWatch provides general geographic awareness. Always consult your airline, airport operator, AirNav Indonesia, or local civil disaster authorities (BPBD / PVMBG) for official travel and safety decisions.',
  },
];

export default async function HomePage() {
  const data = await getDarwinAdvisories();
  const faqSchema = getFaqJsonLd(FAQ_ITEMS);

  return (
    <>
      <JsonLd data={faqSchema} />

      <div className="relative overflow-hidden bg-[#0B0F17] text-[#F5F7FA]">
        {/* Subtle Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#FF6B1A]/10 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />

        {/* 1. HERO SECTION (Strictly per Sections 4 & 5 of tugas-seo.md) */}
        <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-14 sm:px-6 lg:px-8 lg:pt-16 lg:pb-18">
          <div className="text-center max-w-3xl mx-auto">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/80 px-3.5 py-1.5 text-xs font-semibold text-[#FF8A3D] backdrop-blur-md mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B1A] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B1A]" />
              </span>
              <span>{data.totalActiveVolcanoes} Active Volcanic Ash Areas Monitored</span>
            </div>

            {/* Main H1 - Exact string from tugas-seo.md */}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl sm:leading-[1.15]">
              Check Volcanic Ash <span className="text-[#FF6B1A]">Near You</span>
            </h1>

            {/* Supporting Copy - Exact string from tugas-seo.md */}
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#8B95A7] max-w-2xl mx-auto">
              View the latest volcanic ash spread across Indonesia and check whether your area is
              inside an observed or forecast ash zone.
            </p>

            {/* Hero CTAs */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#check-area"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8A3D] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#FF6B1A]/20 transition hover:brightness-110 hover:-translate-y-0.5 sm:w-auto"
              >
                <MapPin className="h-4 w-4" />
                <span>Check My Area</span>
              </a>

              <Link
                href="/map"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111827]/90 px-6 py-3.5 text-sm font-semibold text-[#F5F7FA] backdrop-blur-sm transition hover:bg-[#151C28] hover:border-[#FF6B1A]/40 sm:w-auto"
              >
                <Map className="h-4 w-4 text-[#8B95A7]" />
                <span>Explore Ash Map</span>
              </Link>
            </div>

            {/* SEO-Friendly Introduction directly from tugas-seo.md Section 5 */}
            <p className="mt-8 text-xs sm:text-sm text-[#8B95A7]/90 leading-relaxed max-w-2xl mx-auto border-t border-white/5 pt-5">
              AshWatch is a volcanic ash map for Indonesia that helps people visualize current ash areas
              and forecasts from active volcanoes. Search for a location or use your current position to see
              whether it overlaps an observed or forecast volcanic ash area (peta sebaran abu vulkanik).
            </p>
          </div>

          {/* Hero Visual: Authentic OpenStreetMap preview map of Indonesia */}
          <div className="mt-10 max-w-5xl mx-auto">
            <IndonesiaMiniMap advisories={data.deduplicated} />
          </div>

          {/* Core Feature: Interactive "Check My Area" Card */}
          <div id="check-area" className="mt-10 max-w-3xl mx-auto scroll-mt-20">
            <CheckMyAreaCard advisories={data.deduplicated} />
          </div>
        </section>

        {/* 2. LIVE ASH CONDITIONS SECTION */}
        <section className="border-t border-white/10 bg-[#111827]/40 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Real-Time Conditions
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Current Volcanic Ash Areas
                </h2>
                <p className="text-xs sm:text-sm text-[#8B95A7] mt-1">
                  <strong className="text-white">{data.totalActiveVolcanoes} active areas</strong> across Indonesia · Sourced from Darwin VAAC
                </p>
              </div>

              <Link
                href="/map"
                className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#FF8A3D] transition shrink-0 self-start sm:self-auto"
              >
                <Map className="h-3.5 w-3.5" />
                <span>Open Live Map</span>
              </Link>
            </div>

            {/* Compact List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.deduplicated.map((adv) => (
                <div
                  key={adv.id}
                  className="surface-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white tracking-wide">
                          {adv.volcanoName}
                        </h3>
                        <span className="text-[11px] text-[#8B95A7]">{adv.area}</span>
                      </div>
                      <span className="rounded-full bg-[#FF6B1A]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#FF8A3D] border border-[#FF6B1A]/30">
                        Ash detected
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#8B95A7]">Altitude:</span>
                        <span className="font-semibold text-white">
                          {formatAltitudeCompact(adv.primaryFlightLevel)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-[#8B95A7]">Movement:</span>
                        <span className="text-amber-300 font-semibold">
                          {formatMovementHuman(adv.primaryMovement)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-[#8B95A7]">
                      {adv.polygons.length} ash layer{adv.polygons.length > 1 ? 's' : ''}
                    </span>
                    <Link
                      href={`/map?lat=${adv.position?.latitude || -6}&lng=${adv.position?.longitude || 106}&label=${encodeURIComponent(
                        adv.volcanoName
                      )}`}
                      className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition"
                    >
                      <span>View on Map</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. RICH SEO CONTENT SECTIONS (Strictly per Section 6 of tugas-seo.md) */}
        <section className="border-t border-white/10 py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* H2: What Is Volcanic Ash? */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Scientific Overview
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  What Is Volcanic Ash?
                </h2>
                <div className="mt-4 space-y-3 text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
                  <p>
                    Volcanic ash (abu vulkanik) consists of microscopic, pulverized rock fragments,
                    minerals, and volcanic glass expelled violently into the atmosphere during explosive
                    eruptions. Unlike soft wood ash from a campfire, volcanic ash particles are extremely hard,
                    abrasive, and chemically reactive.
                  </p>
                  <p>
                    Once launched into the air, high-altitude winds carry ash clouds across hundreds or thousands
                    of kilometers. This is why ash can affect cities, islands, and airspace located far away
                    from the erupting volcano summit.
                  </p>
                </div>
              </div>

              <div className="surface-card rounded-2xl p-6 border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wind className="h-4 w-4 text-[#FF8A3D]" />
                  <span>How Ash Spreads Across Indonesia</span>
                </h3>
                <p className="text-xs text-[#8B95A7] leading-relaxed">
                  Indonesia sits directly along the Pacific Ring of Fire. Regional monsoons and upper-troposphere
                  winds dictate the direction and speed of ash dispersal, often carrying plumes across major
                  airports such as Jakarta (CGK), Bali (DPS), Surabaya (SUB), and Lombok (LOP).
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-slate-300">Sumatra</span>
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-slate-300">Java</span>
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-slate-300">Bali & Nusa Tenggara</span>
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-slate-300">Maluku</span>
                  <span className="rounded-md bg-white/5 px-2.5 py-1 text-slate-300">Sulawesi</span>
                </div>
              </div>
            </div>

            {/* H2: Volcanic Ash Map Indonesia */}
            <div className="surface-card rounded-3xl p-6 sm:p-10 border border-white/10">
              <div className="max-w-3xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Geographic Visualization
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Volcanic Ash Map Indonesia
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
                  The AshWatch interactive map gives travelers, residents, and observers a clear, geographic
                  view of current and projected volcanic ash clouds in Indonesia. Rather than reading dense telex
                  bulletins, users can visually inspect:
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
                  <strong className="text-white block mb-1">Observed Cloud Boundaries</strong>
                  <p className="text-[#8B95A7]">
                    Neutral gray-white translucent polygons showing where ash is actively observed right now.
                  </p>
                </div>
                <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
                  <strong className="text-white block mb-1">Dispersion Forecasts</strong>
                  <p className="text-[#8B95A7]">
                    Progressive orange layers predicting ash movement at +6, +12, and +18 hours.
                  </p>
                </div>
                <div className="rounded-xl bg-[#0B0F17]/70 p-4 border border-white/5">
                  <strong className="text-white block mb-1">Volcano Coordinates</strong>
                  <p className="text-[#8B95A7]">
                    Exact summit positions, primary flight level altitudes, and wind drift vectors.
                  </p>
                </div>
              </div>
            </div>

            {/* H2: Check If Your Area Is Affected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Step-by-Step Tool
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Check If Your Area Is Affected
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
                  AshWatch makes checking your location quick and effortless:
                </p>
                <ol className="mt-4 space-y-2.5 text-xs text-[#8B95A7]">
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] font-bold text-[10px]">
                      1
                    </span>
                    <span>Search for your city, town, or airport, or tap &ldquo;Use My Location&rdquo; (GPS).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] font-bold text-[10px]">
                      2
                    </span>
                    <span>AshWatch automatically tests your coordinates against active ash polygon boundaries.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B1A]/20 text-[#FF6B1A] font-bold text-[10px]">
                      3
                    </span>
                    <span>
                      Receive an immediate, understandable result: <strong className="text-emerald-400">CLEAR</strong>,{' '}
                      <strong className="text-[#FF6B1A]">ASH AREA</strong>, or{' '}
                      <strong className="text-amber-400">FORECAST OVERLAP</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>CASE 1: CLEAR</span>
                  </div>
                  <p className="text-[11px] text-[#8B95A7] mt-1">
                    No active ash detected in this area. Shows distance in km to the nearest ash cloud.
                  </p>
                </div>

                <div className="rounded-xl border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B1A]">
                    <AlertTriangle className="h-4 w-4" />
                    <span>CASE 2: ASH AREA</span>
                  </div>
                  <p className="text-[11px] text-[#8B95A7] mt-1">
                    Location is currently inside an observed ash cloud. Shows altitude, movement, and volcano.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Clock className="h-4 w-4" />
                    <span>CASE 3: FORECAST OVERLAP</span>
                  </div>
                  <p className="text-[11px] text-[#8B95A7] mt-1">
                    Currently outside observed ash, but future forecast model (+6h, +12h, or +18h) overlaps.
                  </p>
                </div>
              </div>
            </div>

            {/* H2: Active Volcanoes in Indonesia */}
            <div className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10">
              <div className="max-w-2xl mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                  Monitoring Network
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  Active Volcanoes in Indonesia
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
                  AshWatch visualizes public ash advisories associated with active Indonesian volcanic summits,
                  including Krakatau (Sunda Strait), Semeru (East Java), Lewotolok (Flores), Ibu (Halmahera),
                  Dukono (Halmahera), and Marapi (West Sumatra).
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/volcanoes"
                  className="flex items-center gap-2 rounded-xl bg-[#151C28] px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition border border-white/5"
                >
                  <Flame className="h-4 w-4 text-[#FF6B1A]" />
                  <span>View All Active Ash Areas</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8B95A7]" />
                </Link>

                <Link
                  href="/advisories"
                  className="flex items-center gap-2 rounded-xl bg-[#151C28] px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition border border-white/5"
                >
                  <span>Read Recent Advisories</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#8B95A7]" />
                </Link>
              </div>
            </div>

            {/* H2: How to Read the Ash Map */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                Map Guide
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                How to Read the Ash Map
              </h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="rounded-2xl bg-[#111827] p-5 border border-white/5">
                  <span className="h-3 w-3 rounded-full bg-slate-200 block mb-2" />
                  <strong className="text-white block mb-1">Observed Ash</strong>
                  <p className="text-[#8B95A7]">
                    Current active cloud detected by satellites at bulletin issuance time.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#111827] p-5 border border-white/5">
                  <span className="h-3 w-3 rounded-full bg-[#FF8A3D] block mb-2" />
                  <strong className="text-white block mb-1">Forecast +6h to +18h</strong>
                  <p className="text-[#8B95A7]">
                    Projected dispersion path over 6, 12, and 18 hours with progressive opacity.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#111827] p-5 border border-white/5">
                  <span className="text-amber-300 font-mono font-bold block mb-2">FL070 - FL500</span>
                  <strong className="text-white block mb-1">Altitude (Flight Level)</strong>
                  <p className="text-[#8B95A7]">
                    Vertical height of the ash cloud expressed in hundreds of feet above sea level.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#111827] p-5 border border-white/5">
                  <span className="text-[#FF6B1A] font-mono font-bold block mb-2">MOV NW 05KT</span>
                  <strong className="text-white block mb-1">Movement Direction</strong>
                  <p className="text-[#8B95A7]">
                    Wind drift direction (compass heading) and velocity in knots.
                  </p>
                </div>
              </div>
            </div>

            {/* H2: Is AshWatch an Official Government Service? */}
            <div className="rounded-3xl border border-white/10 bg-[#111827]/60 p-6 sm:p-8">
              <div className="flex items-start gap-3.5">
                <ShieldAlert className="h-5 w-5 text-[#FF8A3D] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Is AshWatch an Official Government Service?
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
                    AshWatch is an independent visualization tool using publicly available volcanic ash information
                    from the Darwin Volcanic Ash Advisory Centre (VAAC), managed by the Australian Bureau of Meteorology.
                    It is not an official government agency, civil protection authority, or certified aviation flight dispatch system.
                  </p>
                  <p className="mt-2 text-xs text-[#8B95A7] leading-relaxed">
                    Always consult official certified sources such as AirNav Indonesia, PVMBG/MAGMA Indonesia,
                    local BPBD disaster agencies, and your airline for travel decisions or evacuation instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FAQ SECTION */}
        <section className="border-t border-white/10 bg-[#111827]/40 py-14 sm:py-20" id="faq">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6B1A]">
                Help & Answers
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#8B95A7]">
                Practical information on how to interpret the volcanic ash map and check your area.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-xl border border-white/10 bg-[#0B0F17]/80 p-4 transition hover:border-white/20 open:border-[#FF6B1A]/40 open:bg-[#111827]"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-xs sm:text-sm font-bold text-white group-open:text-[#FF8A3D]">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#FF6B1A] shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <span className="ml-3 text-[#8B95A7] transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <div className="mt-3 text-xs leading-relaxed text-[#8B95A7] border-t border-white/5 pt-3">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 5. COMPACT DISCLAIMER */}
        <section className="border-t border-white/10 py-8 bg-[#0B0F17]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <p className="text-xs text-[#8B95A7]">
              AshWatch visualizes public volcanic ash advisories from Darwin VAAC.
              It is not an official safety or evacuation service.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
