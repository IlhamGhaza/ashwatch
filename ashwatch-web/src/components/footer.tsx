import React from 'react';
import Link from 'next/link';
import { Flame, ShieldAlert, ExternalLink, Radio, Heart } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400" aria-label="Footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-amber-600">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-black text-white">
                Ash<span className="text-red-500">Watch</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              Real-time visualization and monitoring of volcanic ash advisories (VAA) for Indonesia,
              ingested directly from the Darwin Volcanic Ash Advisory Centre (VAAC).
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Direct feed from BoM Darwin VAAC</span>
            </div>
          </div>

          {/* Core Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link href="/map" className="transition hover:text-white flex items-center gap-1.5">
                  <span>Interactive Map</span>
                  <span className="rounded bg-red-500/20 px-1 text-[10px] text-red-400 font-semibold">Live</span>
                </Link>
              </li>
              <li>
                <Link href="/volcanoes" className="transition hover:text-white">
                  Volcano Directory
                </Link>
              </li>
              <li>
                <Link href="/advisories" className="transition hover:text-white">
                  Recent Advisories
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & SEO Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/data-sources" className="transition hover:text-white">
                  Data Sources & BoM
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition hover:text-white">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition hover:text-white">
                  About AshWatch
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="transition hover:text-white">
                  XML Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* External & Attribution */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Official Data</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://www.bom.gov.au/products/Volc_ash_recent.shtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  <span>BoM Darwin VAAC</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://magma.esdm.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  <span>MAGMA Indonesia</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/IlhamGhaza/ashwatch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/IlhamGhaza"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  <span>Creator (@IlhamGhaza)</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety & Compliance Disclaimer - Section 23 of tugas.md */}
        <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-xs leading-relaxed text-amber-200/90">
              <strong className="font-semibold text-amber-300">Safety & Official Authority Disclaimer: </strong>
              AshWatch is an independent visualization and research tool. It is not an official government agency
              or aviation meteorology authority. Information provided by AshWatch is derived from public Darwin VAAC
              bulletins and should not be used as the sole source for flight planning, aviation safety, emergency evacuation,
              or life-critical decisions. Always consult official NOTAMs, ASHTAMs, and local civil aviation authorities.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>
            © {currentYear} AshWatch. Created by{' '}
            <a
              href="https://github.com/IlhamGhaza"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-200 hover:text-red-400 underline decoration-slate-700 underline-offset-2 transition"
            >
              Ilham Ghaza
            </a>
            . Distributed under MIT License.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-300">About & Creator</Link>
            <span>•</span>
            <Link href="/faq" className="hover:text-slate-300">Aviation FAQs</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
