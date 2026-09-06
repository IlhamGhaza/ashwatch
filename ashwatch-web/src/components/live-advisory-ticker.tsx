'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VolcanoAdvisory } from '@/lib/types';
import { getVolcanoColor } from '@/lib/palette';
import { formatWibDateTime } from '@/lib/parser/date-utils';
import {
  Flame,
  ArrowRight,
  RefreshCw,
  Clock,
  Radio,
} from 'lucide-react';

interface LiveAdvisoryTickerProps {
  initialAdvisories: VolcanoAdvisory[];
  initialUpdatedAt: string;
  totalActiveVolcanoes: number;
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

export function LiveAdvisoryTicker({
  initialAdvisories,
  initialUpdatedAt,
  totalActiveVolcanoes: initialTotal,
}: LiveAdvisoryTickerProps) {
  const [advisories, setAdvisories] = useState<VolcanoAdvisory[]>(initialAdvisories);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [totalActive, setTotalActive] = useState(initialTotal);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');
  const [hasNewData, setHasNewData] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRelativeTime(getRelativeTime(initialUpdatedAt));
  }, [initialUpdatedAt]);

  // Update relative time every 30 seconds
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
        if (data.deduplicated && data.deduplicated.length > 0) {
          // Check if data actually changed
          const newIds = data.deduplicated.map((a: VolcanoAdvisory) => a.id).join(',');
          const oldIds = advisories.map((a) => a.id).join(',');
          if (newIds !== oldIds) {
            setHasNewData(true);
            setTimeout(() => setHasNewData(false), 2000);
          }
          setAdvisories(data.deduplicated);
          setTotalActive(data.totalActiveVolcanoes);
        }
        setUpdatedAt(data.updatedAt || new Date().toISOString());
        setRelativeTime(getRelativeTime(data.updatedAt || new Date().toISOString()));
      }
    } catch (err) {
      console.warn('Advisory ticker refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [advisories]);

  // Auto-poll every 3 minutes
  useEffect(() => {
    const interval = setInterval(handleRefresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <div className="mt-16">
      {/* Live Status Bar */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-400">LIVE</span>
          </div>
          <span className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-semibold text-slate-300">
            {totalActive} Active Advisories
          </span>
          <span className="h-4 w-px bg-slate-800 hidden sm:block" />
          <span className="text-xs text-slate-400 hidden sm:block">
            Source: Darwin VAAC
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span suppressHydrationWarning>Synced {mounted ? relativeTime : 'just now'}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:opacity-50"
            title="Refresh data now"
            aria-label="Refresh advisory data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Current Active Volcano Plumes
          </h2>
        </div>
        <span className="text-xs text-slate-400" suppressHydrationWarning>
          Updated: {formatWibDateTime(updatedAt)}
        </span>
      </div>

      {/* Advisory Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {advisories.slice(0, 4).map((adv) => {
          const color = getVolcanoColor(adv.volcanoName);
          return (
            <Link
              key={adv.id}
              href={`/advisories/${adv.id}`}
              className={`group relative overflow-hidden rounded-2xl border bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
                hasNewData
                  ? 'border-emerald-500/50 advisory-card-glow'
                  : 'border-slate-800 hover:border-red-500/50 hover:bg-slate-900/90'
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color }}
              />
              {/* Glassmorphism overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {adv.area}
                  </span>
                  <h3 className="mt-1 text-lg font-black text-white group-hover:text-red-400 transition-colors">
                    {adv.volcanoName}
                  </h3>
                </div>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-300">
                  #{adv.advisoryNumber}
                </span>
              </div>

              <div className="relative mt-4 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Flight Level:</span>
                  <span className="font-bold text-red-400">{adv.primaryFlightLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Movement:</span>
                  <span className="font-semibold text-amber-300">{adv.primaryMovement}</span>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                <span>{adv.polygons.length} polygon layers</span>
                <span className="flex items-center gap-1 text-red-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Details</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Show all link if more than 4 */}
      {advisories.length > 4 && (
        <div className="mt-6 text-center">
          <Link
            href="/advisories"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition hover:bg-slate-900 hover:text-white hover:border-red-500/40"
          >
            <span>View All {advisories.length} Advisories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
