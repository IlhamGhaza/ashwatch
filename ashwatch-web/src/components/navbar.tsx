'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Flame, Map, Menu, X, ChevronDown, MapPin } from 'lucide-react';

const NAV_LINKS = [
  { href: '/map', label: 'Map' },
  { href: '/advisories', label: 'Advisories' },
  { href: '/volcanoes', label: 'Volcanoes' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.01]"
          aria-label="AshWatch Home"
        >
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#111827] shadow-md shadow-[#FF6B1A]/10">
            <Image
              src="/logo_vercel.png"
              alt="AshWatch Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#F5F7FA] group-hover:text-[#FF6B1A] transition-colors">
                ASHWATCH
              </span>
              <span className="relative flex h-2 w-2" title="Live monitoring">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-[#8B95A7]">
              Volcanic Ash Map
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Main Navigation">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;

            if (link.href === '/about') {
              return (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setAboutDropdownOpen(true)}
                  onMouseLeave={() => setAboutDropdownOpen(false)}
                >
                  <Link
                    href="/about"
                    className={`flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium transition-colors rounded-lg ${
                      isActive || pathname === '/faq' || pathname === '/data-sources'
                        ? 'text-white bg-[#151C28] font-semibold'
                        : 'text-[#8B95A7] hover:text-white hover:bg-[#151C28]/60'
                    }`}
                  >
                    <span>About</span>
                    <ChevronDown className="h-3 w-3 text-[#8B95A7]" />
                  </Link>

                  {aboutDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#111827] p-1.5 shadow-2xl backdrop-blur-xl">
                      <Link
                        href="/about"
                        className="block rounded-lg px-3 py-2 text-xs text-[#F5F7FA] hover:bg-[#151C28]"
                      >
                        About Project
                      </Link>
                      <Link
                        href="/faq"
                        className="block rounded-lg px-3 py-2 text-xs text-[#F5F7FA] hover:bg-[#151C28]"
                      >
                        FAQ
                      </Link>
                      <Link
                        href="/data-sources"
                        className="block rounded-lg px-3 py-2 text-xs text-[#F5F7FA] hover:bg-[#151C28]"
                      >
                        Data Sources
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors rounded-lg ${
                  isActive
                    ? 'text-white bg-[#151C28] font-semibold'
                    : 'text-[#8B95A7] hover:text-white hover:bg-[#151C28]/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Primary CTA: "Check My Area" */}
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <Link
            href="/map?check=1"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8A3D] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#FF6B1A]/20 transition-all hover:brightness-110 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B1A]/50"
          >
            <MapPin className="h-4 w-4" />
            <span>Check My Area</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-[#8B95A7] hover:bg-[#151C28] hover:text-white md:hidden"
          aria-expanded={isOpen}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-b border-white/10 bg-[#0B0F17] px-4 pt-2 pb-6 md:hidden animate-in fade-in slide-in-from-top-3">
          <div className="flex flex-col space-y-1">
            <Link
              href="/map"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === '/map'
                  ? 'bg-[#FF6B1A]/15 text-[#FF6B1A] font-semibold'
                  : 'text-[#F5F7FA] hover:bg-[#151C28]'
              }`}
            >
              <span>Map</span>
            </Link>

            <Link
              href="/advisories"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname.startsWith('/advisories')
                  ? 'bg-[#FF6B1A]/15 text-[#FF6B1A] font-semibold'
                  : 'text-[#F5F7FA] hover:bg-[#151C28]'
              }`}
            >
              <span>Advisories</span>
            </Link>

            <Link
              href="/volcanoes"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname.startsWith('/volcanoes')
                  ? 'bg-[#FF6B1A]/15 text-[#FF6B1A] font-semibold'
                  : 'text-[#F5F7FA] hover:bg-[#151C28]'
              }`}
            >
              <span>Volcanoes</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                pathname === '/about'
                  ? 'bg-[#FF6B1A]/15 text-[#FF6B1A] font-semibold'
                  : 'text-[#F5F7FA] hover:bg-[#151C28]'
              }`}
            >
              <span>About</span>
            </Link>

            <div className="pt-2 border-t border-white/10">
              <Link
                href="/map?check=1"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8A3D] py-2.5 text-center text-sm font-bold text-white shadow-md shadow-[#FF6B1A]/20"
              >
                <MapPin className="h-4 w-4" />
                <span>Check My Area</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
