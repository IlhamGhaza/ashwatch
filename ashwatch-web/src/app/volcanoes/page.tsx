import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getDarwinAdvisories } from '@/lib/advisories';
import { formatAltitudeCompact, formatMovementHuman } from '@/lib/aviation-format';
import { getMagmaVolcanoStatus, getAllMonitoredVolcanoes } from '@/lib/magma-status';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Flame, ArrowRight, ChevronRight, Map, ShieldAlert, Mountain } from 'lucide-react';

import { SITE_CONFIG, SITE_URL } from '@/config/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Wilayah Abu Aktif & Gunung Api Indonesia | AshWatch',
  description:
    'Pantau gunung api aktif dan sebaran abu vulkanik di Indonesia dengan status MAGMA ESDM, ketinggian plume, dan arah pergerakan.',
  alternates: {
    canonical: `${SITE_URL}/volcanoes`,
  },
  openGraph: {
    title: 'Wilayah Abu Aktif & Gunung Api Indonesia | AshWatch',
    description:
      'Pantau gunung api aktif dan sebaran abu vulkanik di Indonesia dengan status MAGMA ESDM, ketinggian plume, dan arah pergerakan.',
    url: `${SITE_URL}/volcanoes`,
    siteName: 'AshWatch',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Wilayah Abu Aktif & Gunung Api Indonesia — AshWatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wilayah Abu Aktif & Gunung Api Indonesia | AshWatch',
    description:
      'Pantau gunung api aktif dan sebaran abu vulkanik di Indonesia dengan status MAGMA ESDM, ketinggian plume, dan arah pergerakan.',
    images: [`${SITE_URL}/opengraph-image`],
  },
};

export default async function VolcanoesPage() {
  const data = await getDarwinAdvisories();
  const volcanoes = data.deduplicated;
  const monitored = getAllMonitoredVolcanoes();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Wilayah Abu Aktif', url: '/volcanoes' }]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-1">
            <span className="h-2 w-2 rounded-full bg-[#FF6B1A] animate-pulse"></span>
            <span>Telemetri Abu Terkini</span>
          </div>
          {/* Page title strictly according to tugas.md */}
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Active Ash Areas
          </h1>
          {/* Subtitle strictly according to tugas.md */}
          <p className="mt-2 text-xs sm:text-sm text-[#8B95A7]">
            Gunung api aktif yang terdeteksi menghasilkan sebaran abu vulkanik menurut buletin Darwin VAAC & PVMBG.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="rounded-xl border border-white/10 bg-[#111827] px-3.5 py-2 text-xs font-semibold text-[#8B95A7]">
            <span className="font-bold text-white mr-1">{volcanoes.length}</span> Sebaran Aktif
          </div>
          <Link
            href="/map"
            className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF8A3D] transition shadow-md"
          >
            <Map className="h-3.5 w-3.5" />
            <span>Lihat Semua di Peta</span>
          </Link>
        </div>
      </div>

      {/* Compact Cards Grid (Strictly per tugas.md) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {volcanoes.map((v) => {
          const slug = v.volcanoName.toLowerCase();
          const magmaStatus = getMagmaVolcanoStatus(v.volcanoName);

          return (
            <div
              key={v.id}
              className="surface-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-wide">
                      {v.volcanoName}
                    </h2>
                    <span className="text-xs text-[#8B95A7]">{v.area}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: magmaStatus.badgeBg,
                        color: magmaStatus.badgeText,
                        border: `1px solid ${magmaStatus.badgeBorder}`,
                      }}
                    >
                      {magmaStatus.levelName}
                    </span>
                    <span className="rounded-full bg-[#FF6B1A]/15 px-2 py-0.5 text-[10px] font-bold text-[#FF8A3D] border border-[#FF6B1A]/30">
                      Abu terdeteksi
                    </span>
                  </div>
                </div>

                {/* Status Keterangan Ringkas MAGMA ESDM */}
                <div
                  className="mt-3 rounded-xl p-2.5 border text-xs"
                  style={{ backgroundColor: magmaStatus.badgeBg, borderColor: magmaStatus.badgeBorder }}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span style={{ color: magmaStatus.badgeText }}>MAGMA ESDM</span>
                    <span className="text-slate-300 font-semibold">{magmaStatus.levelRoman}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                    {magmaStatus.description}
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8B95A7]">Ketinggian Abu:</span>
                    <span className="font-bold text-white">
                      {formatAltitudeCompact(v.primaryFlightLevel)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#8B95A7]">Arah Pergerakan:</span>
                    <span className="text-amber-300 font-semibold">
                      {formatMovementHuman(v.primaryMovement)}
                    </span>
                  </div>
                </div>

                {v.eruptionDetails && (
                  <p className="mt-3 text-xs font-mono text-slate-300 bg-[#0B0F17]/70 border border-white/5 rounded-lg p-2.5 line-clamp-2">
                    {v.eruptionDetails}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <Link
                  href={`/volcanoes/${slug}`}
                  className="text-xs text-[#8B95A7] hover:text-white transition"
                >
                  Detail Gunung
                </Link>

                <Link
                  href={`/map?lat=${v.position?.latitude || -6}&lng=${v.position?.longitude || 106}&label=${encodeURIComponent(
                    v.volcanoName
                  )}`}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition group"
                >
                  <span>Lihat di Peta</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory of All 40 Monitored Volcanoes Across 4 Levels */}
      <div className="mt-14 pt-10 border-t border-white/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8B95A7] mb-1">
              <Mountain className="h-3.5 w-3.5 text-[#FF6B1A]" />
              <span>Status Pemantauan PVMBG / Badan Geologi</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">
              Semua Gunung Api Terpantau (4 Level)
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#8B95A7]">
              Daftar 40 gunung api di Indonesia berdasarkan tingkat aktivitas resmi MAGMA ESDM (Level IV Awas, Level III Siaga, Level II Waspada, dan Level I Normal).
            </p>
          </div>

          {/* Level Summary Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-bold text-[#F87171]">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
              <span>IV Awas ({monitored.filter((m) => m.level === 4).length})</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-[#FF6B1A]/30 bg-[#FF6B1A]/10 px-3 py-1.5 text-xs font-bold text-[#FF8A3D]">
              <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
              <span>III Siaga ({monitored.filter((m) => m.level === 3).length})</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-xs font-bold text-[#FBBF24]">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              <span>II Waspada ({monitored.filter((m) => m.level === 2).length})</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1.5 text-xs font-bold text-[#34D399]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span>I Normal ({monitored.filter((m) => m.level === 1).length})</span>
            </span>
          </div>
        </div>

        {/* 4 Levels Grid */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {monitored.map((volc) => {
            const hasAsh = volcanoes.some(
              (a) =>
                a.volcanoName.toUpperCase() === volc.volcanoName.toUpperCase() ||
                a.volcanoName.toUpperCase().includes(volc.volcanoName.toUpperCase()) ||
                volc.volcanoName.toUpperCase().includes(a.volcanoName.toUpperCase())
            );

            return (
              <div
                key={volc.volcanoSlug}
                className="surface-interactive rounded-2xl p-4 border border-white/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-white truncate">
                        {volc.volcanoName}
                      </h3>
                      <p className="text-[11px] text-[#8B95A7] truncate">{volc.area}</p>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: volc.badgeBg,
                        color: volc.badgeText,
                        border: `1px solid ${volc.badgeBorder}`,
                      }}
                    >
                      {volc.levelName}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[#8B95A7]">
                    <span>{volc.island}</span>
                    <span>·</span>
                    <span>{volc.elevation}</span>
                    {hasAsh && (
                      <span className="ml-auto rounded bg-[#FF6B1A]/20 px-1.5 py-0.5 text-[9px] font-black text-[#FF8A3D] border border-[#FF6B1A]/40">
                        ABU AKTIF
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {volc.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href={`/volcanoes/${volc.volcanoSlug}`}
                    className="text-[11px] font-semibold text-[#8B95A7] hover:text-white transition"
                  >
                    Profil
                  </Link>

                  <Link
                    href={`/map?lat=${volc.position.latitude}&lng=${volc.position.longitude}&label=${encodeURIComponent(
                      volc.volcanoName
                    )}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#FF6B1A] hover:text-[#FF8A3D] transition group"
                  >
                    <span>Peta</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

