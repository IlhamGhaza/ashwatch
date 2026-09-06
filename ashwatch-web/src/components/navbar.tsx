'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Flame, Map, BookOpen, HelpCircle, Info, Menu, X, ShieldAlert } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Live Map', badge: 'Interactive' },
  { href: '/volcanoes', label: 'Volcanoes' },
  { href: '/advisories', label: 'Advisories' },
  { href: '/data-sources', label: 'Data Sources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          aria-label="AshWatch Home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-amber-600 shadow-md shadow-red-500/20">
            <Image
              src="/logo_vercel.png"
              alt="AshWatch Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback icon if logo image fails
                e.currentTarget.style.display = 'none';
              }}
            />
            <Flame className="absolute h-5 w-5 text-white drop-shadow" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-red-400">
                Ash<span className="text-red-500">Watch</span>
              </span>
              <span className="relative flex h-2 w-2" title="Live telemetry active">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Indonesia VAAC
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors rounded-lg ${
                  isActive
                    ? 'text-white bg-slate-800/80 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:from-red-500 hover:to-orange-500 hover:shadow-red-600/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <Map className="h-4 w-4" />
            <span>Launch Map</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium ${
                    isActive
                      ? 'bg-red-500/10 text-red-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-3">
              <Link
                href="/map"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-red-600/30"
              >
                <Map className="h-4 w-4" />
                <span>Launch Interactive Map</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
