import React from 'react';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { JsonLd, getFaqJsonLd } from '@/components/json-ld';
import {
  Map,
  Flame,
  Wind,
  Layers,
  Plane,
  ShieldCheck,
  ChevronRight,
  Radio,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Database,
  Eye,
  Activity,
} from 'lucide-react';

export const revalidate = 300; // Revalidate every 5 minutes

const FAQ_ITEMS = [
  {
    question: 'What is volcanic ash and why is it dangerous to aviation?',
    answer:
      'Volcanic ash consists of microscopic rock, mineral, and volcanic glass fragments expelled during explosive volcanic eruptions. Unlike soft chimney ash, volcanic ash is abrasive, hard, and melts at jet engine operating temperatures (~1,100°C), fusing into glass that can cause engine stalls, sandblast cockpits, and clog airspeed pitot sensors.',
  },
  {
    question: 'What is a Volcanic Ash Advisory (VAA)?',
    answer:
      'A Volcanic Ash Advisory (VAA) is a standardized aviation meteorological bulletin issued by one of nine global Volcanic Ash Advisory Centres (VAAC). It outlines current observed ash clouds (OBS VA CLD) and forecasts dispersion horizons at +6, +12, and +18 hours with flight level altitudes and movement vectors.',
  },
  {
    question: 'What is the Darwin VAAC and its area of responsibility?',
    answer:
      'The Darwin Volcanic Ash Advisory Centre is operated by the Australian Bureau of Meteorology (BoM) under the ICAO International Airways Volcano Watch (IAVW). Its designated area of responsibility encompasses Australia, Papua New Guinea, and the entire Indonesian archipelago.',
  },
  {
    question: 'How does AshWatch display and map volcanic ash clouds?',
    answer:
      'AshWatch parses the raw aeronautical coordinate strings (DDMM/DDDMM) and flight level tiers directly from Darwin VAAC bulletins. It converts these polygons into multi-altitude geographic layers on OpenStreetMap with decreasing opacity for forecast periods (+6h, +12h, +18h).',
  },
  {
    question: 'Does AshWatch provide official aviation safety determinations?',
    answer:
      'No. AshWatch is an independent visualization and academic monitoring tool. It is not an official aviation safety authority. Certified flight dispatchers, pilots, and airlines must consult official NOTAMs, ASHTAMs, SIGMETs, and direct BoM/AirNav Indonesia bulletins.',
  },
  {
    question: 'Which Indonesian volcanoes are monitored by AshWatch?',
    answer:
      'AshWatch tracks all active volcanoes in Indonesia that generate volcanic ash advisories from Darwin VAAC, including Krakatau, Semeru, Lewotolok, Ibu, Dukono, Marapi, Merapi, and others across Sumatra, Java, the Sunda Arc, and Maluku.',
  },
  {
    question: 'How often is data updated on AshWatch?',
    answer:
      'AshWatch checks and synchronizes with Darwin VAAC public bulletins every 2 minutes. The interactive map provides manual instant refresh controls, while server-side pages use revalidation caching to guarantee fast page loads.',
  },
];

export default async function HomePage() {
  const data = await getDarwinAdvisories();
  const faqSchema = getFaqJsonLd(FAQ_ITEMS);

  return (
    <>
      <JsonLd data={faqSchema} />

      <div className="relative overflow-hidden bg-[#0a1628] text-[#e8edf5]">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[800px] -translate-x-1/2 rounded-full bg-orange-600/8 blur-[140px]" />
        <div className="pointer-events-none absolute top-96 -right-40 h-[400px] w-[500px] rounded-full bg-amber-600/6 blur-[120px]" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
          <div className="text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/8 px-3.5 py-1.5 text-xs font-semibold text-orange-400 backdrop-blur-md mb-8">
              <Radio className="h-3.5 w-3.5 animate-pulse text-orange-500" />
              <span>Direct Darwin VAAC Aviation Ingestion</span>
              <span className="h-1 w-1 rounded-full bg-orange-500" />
              <span className="text-slate-300">
                {data.totalActiveVolcanoes} Active Plumes Monitored
              </span>
            </div>

            {/* Main H1 */}
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
              Real-Time <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent">Volcanic Ash Map</span> for Indonesia
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#7a9ec4] sm:text-lg">
              AshWatch helps monitor and visualize volcanic ash advisories and volcanic activity
              across Indonesia. Track multi-altitude ash cloud dispersion boundaries, flight levels, and
              wind movement vectors directly from Australian Bureau of Meteorology Darwin VAAC bulletins.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/map"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-orange-600/20 transition hover:bg-orange-500 hover:shadow-orange-600/35 hover:-translate-y-0.5 sm:w-auto"
              >
                <Map className="h-5 w-5" />
                <span>Launch Interactive Map</span>
              </Link>

              <Link
                href="/volcanoes"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1a2d4a] bg-[#0f1d32]/80 px-6 py-3.5 text-base font-semibold text-slate-300 backdrop-blur-sm transition hover:bg-[#152540] hover:text-white sm:w-auto"
              >
                <span>Browse Monitored Volcanoes</span>
                <ChevronRight className="h-4 w-4 text-[#5a7396]" />
              </Link>
            </div>
          </div>

          {/* Active Advisories Cards */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Current Active Volcano Plumes
                </h2>
              </div>
              <span className="text-xs text-[#5a7396]">
                Updated: {formatWibDateTime(data.updatedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.deduplicated.slice(0, 4).map((adv) => {
                const color = getVolcanoColor(adv.volcanoName);
                return (
                  <Link
                    key={adv.id}
                    href={`/advisories/${adv.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-5 shadow-lg backdrop-blur-sm transition hover:border-orange-500/40 hover:bg-[#0f1d32]/90 hover:-translate-y-1"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#5a7396]">
                          {adv.area}
                        </span>
                        <h3 className="mt-1 text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                          {adv.volcanoName}
                        </h3>
                      </div>
                      <span className="rounded-md bg-[#0a1628] px-2 py-0.5 text-[11px] font-mono font-semibold text-[#5a7396] border border-[#1a2d4a]">
                        #{adv.advisoryNumber}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-[#5a7396]">Flight Level:</span>
                        <span className="font-bold text-orange-400">{adv.primaryFlightLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5a7396]">Movement:</span>
                        <span className="font-semibold text-amber-400">{adv.primaryMovement}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#1a2d4a]/80 pt-3 text-[11px] text-[#5a7396]">
                      <span>{adv.polygons.length} polygon layers</span>
                      <span className="flex items-center gap-1 text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section: What is AshWatch? */}
        <section className="border-t border-[#1a2d4a]/60 bg-[#0f1d32]/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Purpose & Innovation
                </span>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  What is AshWatch?
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-[#7a9ec4]">
                  <p>
                    AshWatch is an open-access volcanic ash intelligence platform engineered specifically
                    to decode, parse, and visually present aviation volcanic ash advisories across Indonesia
                    on an interactive geospatial map.
                  </p>
                  <p>
                    Historically, official Volcanic Ash Advisory (VAA) bulletins are transmitted in archaic,
                    monospaced alphanumeric telex text designed for teleprinters. AshWatch replaces
                    dense coordinate strings with clear, multi-altitude polygons, enabling pilots,
                    geologists, researchers, and dispatchers to instantly grasp ash cloud propagation.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>Zero Data Fabrication</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Database className="h-5 w-5 text-blue-400" />
                    <span>Real-Time BoM Telemetry</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Plane className="h-5 w-5 text-amber-400" />
                    <span>ICAO Flight Level Aligned</span>
                  </div>
                </div>
              </div>

              {/* Feature Box */}
              <div className="rounded-3xl border border-[#1a2d4a] bg-gradient-to-br from-[#0f1d32] to-[#0a1628] p-6 sm:p-8 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-400" />
                  <span>Interactive Map Capabilities</span>
                </h3>
                <ul className="space-y-4 text-sm text-[#7a9ec4]">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 font-bold text-xs">
                      1
                    </span>
                    <div>
                      <strong className="text-white block">Multi-Altitude Sub-Polygon Parsing:</strong>
                      Separate altitude bands (e.g. Krakatau SFC/FL200 and SFC/FL500) rendered with independent opacity and movement labels.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs">
                      2
                    </span>
                    <div>
                      <strong className="text-white block">Forecast Dispersion Horizons:</strong>
                      Toggle Observed clouds alongside +6 hr, +12 hr, and +18 hr atmospheric dispersion predictions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-bold text-xs">
                      3
                    </span>
                    <div>
                      <strong className="text-white block">GPS Geolocation Proximity:</strong>
                      Locate your current position with a single tap to assess proximity to drifting ash clouds.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Volcanic Ash Map Details */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Aviation Geodata
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                The Volcanic Ash Map
              </h2>
              <p className="mt-4 text-base text-[#7a9ec4]">
                AshWatch renders complex meteorological data onto OpenStreetMap with precise
                aeronautical flight level altitude tags, coordinates, and wind movement indicators.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 mb-4">
                  <Flame className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Volcano Locations</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Interactive volcano markers across Sumatra, Java, Bali, Nusa Tenggara, and Maluku with
                  pulsing radar indicators for actively erupting summits.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Ash Cloud Polygons</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Convex geographic polygon boundaries showing exact geographic spread, with tailored opacities
                  (Observed 50%, +6h 35%, +12h 22%, +18h 14%).
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 mb-4">
                  <Plane className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Flight Levels (FL)</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Clear vertical altitude ceiling designations expressed in hundreds of feet (e.g. FL060 = 6,000 ft,
                  FL500 = 50,000 ft) critical for cruising passenger jets.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                  <Wind className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Wind Movement Vectors</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Real-time dispersion drift velocity and direction (e.g., <code className="text-xs text-amber-400">MOV NW 05KT</code>),
                  allowing users to anticipate ash drift paths.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Forecast Horizons</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Trajectory forecasts calculated by Darwin VAAC atmospheric dispersion models spanning
                  6, 12, and 18 hours into the future.
                </p>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a]/80 bg-[#0f1d32]/40 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Verifiable Raw Bulletins</h3>
                <p className="mt-2 text-sm text-[#7a9ec4] leading-relaxed">
                  Complete unedited text bulletins with Date Time Group (DTG), satellite sources, remarks,
                  and next issuance schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Indonesia Volcano Monitoring Context */}
        <section className="border-t border-[#1a2d4a]/60 bg-[#0f1d32]/20 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Geological Context
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Indonesia Volcano Monitoring
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#7a9ec4]">
                Indonesia sits at the volatile intersection of the Pacific Ring of Fire, home to over 130
                active volcanoes—the highest density of active volcanic centers on Earth. Volcanoes such as
                Krakatau, Merapi, Semeru, Sinabung, Lewotolok, Ibu, and Dukono erupt with significant frequency.
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#7a9ec4]">
                Because Indonesia occupies the primary air corridor connecting Europe and the Middle East to
                Australia, as well as Southeast Asia to Oceania, high-altitude volcanic ash plumes represent an
                acute hazard for international commercial aviation. Prompt dissemination and intuitive visualization
                of ash clouds are essential for situational awareness.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Darwin VAAC */}
        <section className="border-t border-[#1a2d4a]/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  Data Authority
                </span>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Darwin VAAC
                </h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-[#7a9ec4]">
                  <p>
                    The Darwin Volcanic Ash Advisory Centre is one of nine worldwide specialized facilities
                    established under the auspices of the International Civil Aviation Organization (ICAO) and
                    the World Meteorological Organization (WMO).
                  </p>
                  <p>
                    Staffed 24/7 by meteorologists at the Australian Bureau of Meteorology in Darwin, the centre
                    monitors satellite feeds (Himawari-9, FY-4), pilot reports (PIREPs), ground observatories (PVMG /
                    MAGMA Indonesia), and atmospheric wind patterns to formulate Volcanic Ash Advisories (VAA) and
                    VAG graphics.
                  </p>
                  <p className="text-xs italic text-[#5a7396]">
                    Note: AshWatch is an independent third-party consumer of publicly available Darwin VAAC products
                    and is not an official government service.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-white mb-4">Darwin VAAC Specifications</h3>
                <dl className="divide-y divide-[#1a2d4a] text-sm">
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#5a7396]">Operating Agency:</dt>
                    <dd className="font-semibold text-white">Bureau of Meteorology (BoM), Australia</dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#5a7396]">Region Monitored:</dt>
                    <dd className="font-semibold text-white">Indonesia, PNG, Australia</dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#5a7396]">Primary Satellite:</dt>
                    <dd className="font-semibold text-white">Himawari-9 (JMA Geostationary)</dd>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <dt className="text-[#5a7396]">Standard Bulletin Format:</dt>
                    <dd className="font-semibold text-white">ICAO VAA Alphanumeric Text</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Section: How AshWatch Works */}
        <section className="border-t border-[#1a2d4a]/60 bg-[#0f1d32]/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Architecture & Data Flow
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                How AshWatch Works
              </h2>
              <p className="mt-4 text-base text-[#7a9ec4]">
                From raw Australian government meteorological feeds to responsive client-side maps in milliseconds.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="relative rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 mb-4 font-bold text-lg">
                  1
                </div>
                <h3 className="text-base font-bold text-white">1. Data Ingestion</h3>
                <p className="mt-2 text-xs text-[#5a7396] leading-relaxed">
                  Automated background requests retrieve recent 7-day HTML bulletins directly from BoM Darwin servers.
                </p>
              </div>

              <div className="relative rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 mb-4 font-bold text-lg">
                  2
                </div>
                <h3 className="text-base font-bold text-white">2. Parser & Normalization</h3>
                <p className="mt-2 text-xs text-[#5a7396] leading-relaxed">
                  Pre-blocks are extracted; continuation lines are stitched; DDMM/DDDMM coordinates and flight levels are parsed.
                </p>
              </div>

              <div className="relative rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400 mb-4 font-bold text-lg">
                  3
                </div>
                <h3 className="text-base font-bold text-white">3. Deduplication & Caching</h3>
                <p className="mt-2 text-xs text-[#5a7396] leading-relaxed">
                  Advisories are filtered by `AREA: INDONESIA` and latest DTG per volcano, served with edge caching.
                </p>
              </div>

              <div className="relative rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 font-bold text-lg">
                  4
                </div>
                <h3 className="text-base font-bold text-white">4. Interactive Map</h3>
                <p className="mt-2 text-xs text-[#5a7396] leading-relaxed">
                  Polygons and markers are rendered onto OpenStreetMap with customized flight level tooltips and GPS sync.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Who Is AshWatch For? */}
        <section className="border-t border-[#1a2d4a]/60 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Audience & Users
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Who Is AshWatch For?
              </h2>
              <p className="mt-4 text-base text-[#7a9ec4]">
                AshWatch serves a diverse international audience seeking accessible, reliable volcanic plume visualization:
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Aviation & Flight Sim Enthusiasts</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Cross-reference real-world flight routings, diversion scenarios, and flight sim weather injections.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Geologists & Volcanology Researchers</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Track historical and active eruption frequency, plume altitudes, and regional dispersal patterns.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Developers & Open Data Engineers</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Access standardized JSON REST endpoints and open-source parser algorithms for aviation weather.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Travelers & Island Visitors</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Check whether airport operations in Bali, Java, Flores, or Maluku might be impacted by ash clouds.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Emergency Awareness Communities</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Gain visual geographic comprehension of volcanic unrest beyond plain-text bulletin feeds.
                </p>
              </div>

              <div className="rounded-xl border border-[#1a2d4a]/80 bg-[#0f1d32]/30 p-5">
                <h3 className="font-bold text-white">Weather & Satellite Observers</h3>
                <p className="mt-1.5 text-xs text-[#5a7396] leading-relaxed">
                  Compare Himawari-9 satellite infrared imagery with officially designated advisory polygons.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: FAQ Accordion */}
        <section className="border-t border-[#1a2d4a]/60 bg-[#0f1d32]/40 py-16 sm:py-20" id="faq">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                Knowledge Base
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-base text-[#5a7396]">
                Authoritative technical answers about volcanic ash, Darwin VAAC advisories, and AshWatch operations.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {FAQ_ITEMS.map((faq, index) => (
                <details
                  key={index}
                  className="group rounded-2xl border border-[#1a2d4a] bg-[#0f1d32]/60 p-6 transition-colors hover:border-[#243b5c] open:border-orange-500/40 open:bg-[#0f1d32]"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-white group-open:text-orange-400">
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1a2d4a] text-[#5a7396] transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <div className="mt-4 text-sm leading-relaxed text-[#7a9ec4] border-t border-[#1a2d4a]/80 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
