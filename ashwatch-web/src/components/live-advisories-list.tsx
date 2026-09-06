'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { VolcanoAdvisory } from '@/lib/types';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import { formatAltitudeCompact, formatMovementHuman } from '@/lib/aviation-format';
import {
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';

interface LiveAdvisoriesListProps {
  initialAdvisories: VolcanoAdvisory[];
  initialUpdatedAt: string;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ${diffMin % 60}m ago`;
}

export function LiveAdvisoriesList({
  initialAdvisories,
  initialUpdatedAt,
}: LiveAdvisoriesListProps) {
  const [advisories, setAdvisories] = useState<VolcanoAdvisory[]>(initialAdvisories);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRawId, setExpandedRawId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setRelativeTime(getRelativeTime(initialUpdatedAt));
  }, [initialUpdatedAt]);

  // Update relative time every 30s
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(updatedAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [mounted, updatedAt]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/advisories?fresh=1&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.advisories && data.advisories.length > 0) {
          setAdvisories(data.advisories);
        }
        setUpdatedAt(data.updatedAt || new Date().toISOString());
        setRelativeTime(getRelativeTime(data.updatedAt || new Date().toISOString()));
      }
    } catch (err) {
      console.warn('Advisories refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-poll every 3 minutes
  useEffect(() => {
    const interval = setInterval(handleRefresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const filteredAdvisories = useMemo(() => {
    if (!searchQuery.trim()) return advisories;
    const q = searchQuery.toLowerCase();
    return advisories.filter(
      (a) =>
        a.volcanoName.toLowerCase().includes(q) ||
        a.area.toLowerCase().includes(q) ||
        a.advisoryNumber.toLowerCase().includes(q) ||
        a.primaryFlightLevel.toLowerCase().includes(q)
    );
  }, [advisories, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Live Status & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-[#111827]/80 p-3.5 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95A7]" />
          <input
            type="text"
            placeholder="Search by volcano name or flight level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0B0F17] py-2 pl-9 pr-4 text-xs text-white placeholder-[#8B95A7] focus:border-[#FF6B1A] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-bold text-emerald-400">LIVE</span>
            <span className="text-[#8B95A7]" suppressHydrationWarning>
              Synced {mounted ? relativeTime : 'just now'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-[#151C28] px-3 text-xs font-semibold text-[#F5F7FA] hover:bg-white/10 transition disabled:opacity-50"
            title="Refresh Darwin VAAC telemetry"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-[#FF6B1A]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Advisories Count */}
      <div className="flex items-center justify-between text-xs text-[#8B95A7]">
        <span>
          Showing <strong className="text-white">{filteredAdvisories.length}</strong> of{' '}
          <strong className="text-white">{advisories.length}</strong> bulletins
        </span>
        <span suppressHydrationWarning>Feed Synced: {formatWibDateTime(updatedAt)}</span>
      </div>

      {/* Advisories Grid (Human-readable format per tugas.md) */}
      <div className="space-y-4">
        {filteredAdvisories.map((adv) => {
          const isRawExpanded = expandedRawId === adv.id;

          return (
            <div
              key={adv.id}
              className="surface-card rounded-2xl border border-white/10 p-5 sm:p-6 transition hover:border-white/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Advisory Information Header */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-xl font-black text-white">{adv.volcanoName}</h2>
                    <span className="text-xs text-[#8B95A7]">
                      Ash advisory · {formatWibDateTime(adv.dtg)}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-[#8B95A7]">
                      #{adv.advisoryNumber}
                    </span>
                  </div>

                  {/* Human readable parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 max-w-xl">
                    <div className="rounded-lg bg-[#0B0F17]/60 p-2.5 border border-white/5">
                      <span className="text-[10px] text-[#8B95A7] block">Ash:</span>
                      <strong className="text-white">
                        {formatAltitudeCompact(adv.primaryFlightLevel)}
                      </strong>
                    </div>

                    <div className="rounded-lg bg-[#0B0F17]/60 p-2.5 border border-white/5">
                      <span className="text-[10px] text-[#8B95A7] block">Movement:</span>
                      <strong className="text-amber-300">
                        {formatMovementHuman(adv.primaryMovement)}
                      </strong>
                    </div>
                  </div>

                  {/* Expandable Technical Raw Bulletin (Hidden by default per tugas.md) */}
                  <div className="pt-2">
                    <button
                      onClick={() => setExpandedRawId(isRawExpanded ? null : adv.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#8B95A7] hover:text-white transition"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isRawExpanded ? 'Hide Raw Advisory' : 'View Raw Advisory'}</span>
                      {isRawExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    {isRawExpanded && (
                      <div className="mt-2 rounded-xl bg-[#0B0F17] p-3 border border-white/10 font-mono text-[11px] text-slate-300 space-y-1 animate-in fade-in">
                        <p><span className="text-[#8B95A7]">DTG:</span> {adv.dtgRaw}</p>
                        <p><span className="text-[#8B95A7]">VAAC:</span> DARWIN</p>
                        <p><span className="text-[#8B95A7]">VOLCANO:</span> {adv.volcanoName}</p>
                        <p><span className="text-[#8B95A7]">AREA:</span> {adv.area}</p>
                        <p><span className="text-[#8B95A7]">INFO SOURCE:</span> {adv.infoSource || 'HIMAWARI-9'}</p>
                        {adv.eruptionDetails && (
                          <p><span className="text-[#8B95A7]">ERUPTION DETAILS:</span> {adv.eruptionDetails}</p>
                        )}
                        {adv.remarks && (
                          <p><span className="text-[#8B95A7]">RMK:</span> {adv.remarks}</p>
                        )}
                        <p><span className="text-[#8B95A7]">NEXT ADVISORY:</span> {adv.nextAdvisory || 'AS REQUIRED'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/advisories/${adv.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FF6B1A] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF8A3D] transition shadow-md"
                  >
                    <span>View Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <Link
                    href={`/map?lat=${adv.position?.latitude || -6}&lng=${adv.position?.longitude || 106}&label=${encodeURIComponent(
                      adv.volcanoName
                    )}`}
                    className="text-xs text-[#8B95A7] hover:text-white transition"
                  >
                    View on Map
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAdvisories.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111827]/40 p-10 text-center">
            <p className="text-xs font-semibold text-[#F5F7FA]">
              No advisories matched &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-[11px] text-[#8B95A7]">
              Try searching with a volcano name (e.g., Semeru, Ibu, Krakatau).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
