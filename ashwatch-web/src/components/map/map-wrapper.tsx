'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VolcanoAdvisory } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const DynamicAshMap = dynamic(() => import('./ash-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0a1628] text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
      <p className="text-sm font-medium text-slate-300">Initializing map system...</p>
      <p className="text-xs text-slate-500 mt-1">Loading airspace sectors & Darwin VAAC polygons</p>
    </div>
  ),
});

interface MapWrapperProps {
  advisories: VolcanoAdvisory[];
  updatedAt: string;
  source: 'bom' | 'fallback';
  totalActive: number;
}

export function MapWrapper({ advisories: initialAdvisories, updatedAt: initialUpdatedAt, source: initialSource, totalActive: initialTotalActive }: MapWrapperProps) {
  const [advisories, setAdvisories] = useState<VolcanoAdvisory[]>(initialAdvisories);
  const [isLoading, setIsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [source, setSource] = useState<'bom' | 'fallback'>(initialSource);
  const [totalActive, setTotalActive] = useState(initialTotalActive);
  const hasInitialRefreshed = useRef(false);

  // Sync state if initial advisories change (e.g. ISR revalidation)
  useEffect(() => {
    if (initialAdvisories && initialAdvisories.length > 0) {
      setAdvisories(initialAdvisories);
      setUpdatedAt(initialUpdatedAt);
      setSource(initialSource);
      setTotalActive(initialTotalActive);
    }
  }, [initialAdvisories, initialUpdatedAt, initialSource, initialTotalActive]);

  // Real-time client-side refresh function
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/advisories?fresh=1&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.deduplicated && data.deduplicated.length > 0) {
          setAdvisories(data.deduplicated);
          setUpdatedAt(data.updatedAt);
          setSource(data.source);
          setTotalActive(data.totalActiveVolcanoes);
        }
      }
    } catch (err) {
      console.warn('Real-time advisories update failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fire initial refresh on mount to catch stale SSR data
  useEffect(() => {
    if (!hasInitialRefreshed.current) {
      hasInitialRefreshed.current = true;
      // Small delay to not block initial render
      const timer = setTimeout(() => handleRefresh(), 1500);
      return () => clearTimeout(timer);
    }
  }, [handleRefresh]);

  // Background auto-polling every 2 minutes for live real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <DynamicAshMap
      advisories={advisories}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      updatedAt={updatedAt}
      source={source}
      totalActive={totalActive}
    />
  );
}
