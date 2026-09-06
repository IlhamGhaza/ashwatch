'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { VolcanoAdvisory } from '@/lib/types';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime, formatUtcDateTime } from '@/lib/parser/date-utils';
import {
  Clock,
  Plane,
  Wind,
  ArrowRight,
  Radio,
  RefreshCw,
  Search,
  Layers,
  MapPin,
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
  const [hasNewData, setHasNewData] = useState(false);

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
          const newIds = data.advisories.map((a: VolcanoAdvisory) => a.id).join(',');
          const oldIds = advisories.map((a) => a.id).join(',');
          if (newIds !== oldIds) {
            setHasNewData(true);
            setTimeout(() => setHasNewData(false), 2000);
          }
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
  }, [advisories]);

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
      {/* Live Status & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by volcano, flight level, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-red-500/50 focus:outline-none"
          />
        </div>

        {/* Status Indicators & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-400">LIVE</span>
            <span className="text-xs text-slate-400" suppressHydrationWarning>
              Synced {mounted ? relativeTime : 'just now'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
            title="Refresh Darwin VAAC telemetry"
            aria-label="Refresh advisories list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Advisories Count */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredAdvisories.length}</strong> of{' '}
          <strong className="text-white">{advisories.length}</strong> bulletins
        </span>
        <span suppressHydrationWarning>Last Source Sync: {formatWibDateTime(updatedAt)}</span>
      </div>

      {/* Advisories Grid / List */}
      <div className="space-y-4">
        {filteredAdvisories.map((adv) => {
          const color = getVolcanoColor(adv.volcanoName);

          return (
            <div
              key={adv.id}
              className={`group relative overflow-hidden rounded-2xl border bg-slate-900/50 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:bg-slate-900/80 ${
                hasNewData
                  ? 'border-emerald-500/50 advisory-card-glow'
                  : 'border-slate-800 hover:border-red-500/40 hover:-translate-y-0.5'
              }`}
            >
              <div
                className="absolute top-0 bottom-0 left-0 w-1.5"
                style={{ backgroundColor: color }}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-2 sm:pl-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="text-xl font-black text-white group-hover:text-red-400 transition-colors">
                      {adv.volcanoName}
                    </h2>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                      Advisory #{adv.advisoryNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      {adv.area}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        {formatWibDateTime(adv.dtg)} ({formatUtcDateTime(adv.dtg)})
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Plane className="h-3.5 w-3.5 text-red-400" />
                      <span className="font-bold text-red-400">{adv.primaryFlightLevel}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Wind className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-semibold text-amber-300">{adv.primaryMovement}</span>
                    </span>
                    {adv.polygons && adv.polygons.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Layers className="h-3.5 w-3.5 text-blue-400" />
                          <span>{adv.polygons.length} layer{adv.polygons.length > 1 ? 's' : ''}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {adv.eruptionDetails && (
                    <p className="mt-2 text-xs font-mono text-slate-300 bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 max-w-3xl leading-relaxed">
                      {adv.eruptionDetails}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/advisories/${adv.id}`}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 hover:border-red-600 transition shadow-lg group/btn"
                  >
                    <span>Inspect Bulletin</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAdvisories.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">
            <p className="text-sm font-semibold text-slate-300">
              No advisories matched &ldquo;{searchQuery}&rdquo;
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try searching with a volcano name or flight level code (e.g., FL100).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
