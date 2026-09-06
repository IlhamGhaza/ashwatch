import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Map, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-xl mb-6">
        <Image
          src="/logo_vercel.png"
          alt="AshWatch Logo"
          width={64}
          height={64}
          className="h-full w-full object-cover"
        />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-[#FF6B1A]">
        404 Error
      </span>
      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm text-[#8B95A7] leading-relaxed">
        The requested page or volcano sector could not be located. It may have been moved,
        renamed, or the advisory bulletin has expired.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-[#151C28] px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition border border-white/10"
        >
          <Home className="h-4 w-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/map"
          className="flex items-center gap-2 rounded-xl bg-[#FF6B1A] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#FF6B1A]/20 hover:bg-[#FF8A3D] transition"
        >
          <Map className="h-4 w-4" />
          <span>Open Live Map</span>
        </Link>
      </div>
    </div>
  );
}
