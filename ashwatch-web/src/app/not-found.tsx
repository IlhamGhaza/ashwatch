import React from 'react';
import Link from 'next/link';
import { Flame, Map, Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6">
        <Flame className="h-8 w-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-red-500">
        404 Error
      </span>
      <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">
        Airspace Sector Not Found
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm text-slate-400 leading-relaxed">
        The requested page or volcano sector could not be located. It may have been moved,
        renamed, or the advisory bulletin has expired.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/map"
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition"
        >
          <Map className="h-4 w-4" />
          <span>Launch Live Map</span>
        </Link>
      </div>
    </div>
  );
}
