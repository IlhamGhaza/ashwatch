'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Flame, Map, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Live Map', badge: 'Live' },
  { href: '/volcanoes', label: 'Volcanoes' },
  { href: '/advisories', label: 'Advisories' },
  { href: '/data-sources', label: 'Data Sources' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide navbar on map page for full-bleed experience
  if (pathname === '/map') return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a2d4a]/60 bg-[#0a1628]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          aria-label="AshWatch Home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 shadow-md shadow-orange-600/20">
            <Image
              src="/logo_vercel.png"
              alt="AshWatch Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Flame className="absolute h-5 w-5 text-white drop-shadow" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white group-hover:text-orange-400">
              Ash<span className="text-orange-500">Watch</span>
            </span>
            <span className="text-[10px] font-medium tracking-wider text-[#5a7396] uppercase">
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
                    ? 'text-white bg-[#152540] font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-[#152540]/50'
                }`}
              >
                {link.label}
                {link.badge && (
                  <span className="ml-1.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/25">
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
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500 hover:shadow-orange-600/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <Map className="h-4 w-4" />
            <span>Launch Map</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2d4a] text-slate-400 hover:bg-[#152540] hover:text-white md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-b border-[#1a2d4a] bg-[#0a1628] px-4 pt-2 pb-6 md:hidden">
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
                      ? 'bg-orange-500/10 text-orange-400 font-semibold'
                      : 'text-slate-400 hover:bg-[#152540] hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs text-orange-400">
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-orange-600/25"
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
