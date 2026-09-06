'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VolcanoAdvisory } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const DynamicAshMap = dynamic(() => import('./ash-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B0F17] text-[#8B95A7]">
      <Loader2 className="h-8 w-8 animate-spin text-[#FF6B1A] mb-3" />
      <p className="text-sm font-semibold text-[#F5F7FA]">Loading Indonesian volcanic ash map...</p>
      <p className="text-xs text-[#8B95A7] mt-1">Rendering OpenStreetMap & Darwin VAAC polygons</p>
    </div>
  ),
});

interface MapWrapperProps {
  advisories: VolcanoAdvisory[];
  initialUpdatedAt?: string;
}

function MapWrapperInner({
  advisories: initialAdvisories,
  initialUpdatedAt,
}: MapWrapperProps) {
  const [advisories, setAdvisories] = useState<VolcanoAdvisory[]>(initialAdvisories);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(initialUpdatedAt || '');

  const searchParams = useSearchParams();
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const labelParam = searchParams.get('label');

  const initialLat = latParam ? parseFloat(latParam) : null;
  const initialLng = lngParam ? parseFloat(lngParam) : null;
  const initialLabel = labelParam || null;

  // Sync state if initial advisories change
  useEffect(() => {
    if (initialAdvisories && initialAdvisories.length > 0) {
      setAdvisories(initialAdvisories);
    }
  }, [initialAdvisories]);

  // Real-time client-side refresh function
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/advisories?fresh=1&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.deduplicated && data.deduplicated.length > 0) {
          setAdvisories(data.deduplicated);
        }
        setLastRefreshedAt(data.updatedAt || new Date().toISOString());
      }
    } catch (err) {
      console.warn('Real-time advisories update failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Background auto-polling every 3 minutes for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <DynamicAshMap
      advisories={advisories}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      lastRefreshedAt={lastRefreshedAt}
      initialLat={initialLat}
      initialLng={initialLng}
      initialLabel={initialLabel}
    />
  );
}

export function MapWrapper(props: MapWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#0B0F17] text-[#8B95A7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B1A] mb-3" />
          <p className="text-sm font-semibold text-[#F5F7FA]">Loading Indonesian volcanic ash map...</p>
        </div>
      }
    >
      <MapWrapperInner {...props} />
    </Suspense>
  );
}
