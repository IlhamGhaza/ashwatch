'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { VolcanoAdvisory } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const DynamicAshMap = dynamic(() => import('./ash-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
      <p className="text-sm font-medium">Loading interactive Indonesian volcanic ash map...</p>
      <p className="text-xs text-slate-500 mt-1">Rendering airspace sectors & Darwin VAAC polygons</p>
    </div>
  ),
});

interface MapWrapperProps {
  advisories: VolcanoAdvisory[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicAshMap {...props} />;
}
