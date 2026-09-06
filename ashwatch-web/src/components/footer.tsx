import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ShieldAlert } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      suppressHydrationWarning
      className="border-t border-white/10 bg-[#0B0F17] text-[#8B95A7]"
      aria-label="Footer"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Subtitle */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#111827] shadow-md shadow-[#FF6B1A]/10">
                <Image
                  src="/logo_vercel.png"
                  alt="AshWatch Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-base font-black text-white tracking-wider group-hover:text-[#FF6B1A] transition-colors">
                ASHWATCH
              </span>
            </Link>
            <p className="mt-2.5 max-w-sm text-xs leading-relaxed text-[#8B95A7]">
              Volcanic ash spread map and location awareness tool for Indonesia.
              Ingested from public Darwin VAAC bulletins with BMKG and PVMBG context.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Data sources: Darwin VAAC · BMKG · PVMBG</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Navigation</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-white transition">
                  Interactive Map
                </Link>
              </li>
              <li>
                <Link href="/volcanoes" className="hover:text-white transition">
                  Active Ash Areas
                </Link>
              </li>
              <li>
                <Link href="/advisories" className="hover:text-white transition">
                  Recent Advisories
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Information</h3>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About AshWatch
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/data-sources" className="hover:text-white transition">
                  Data Sources
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/IlhamGhaza/ashwatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Compact Disclaimer (Required by tugas.md) */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#8B95A7]">
          <p className="max-w-xl">
            AshWatch visualizes public volcanic ash advisories from Darwin VAAC.
            It is not an official safety or evacuation service.
          </p>

          <p className="text-[11px] shrink-0">
            © {currentYear} AshWatch. Created by{' '}
            <a
              href="https://github.com/IlhamGhaza"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#FF6B1A] transition underline underline-offset-2"
            >
              Ilham Ghazali
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
