'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/footer';

export default function FooterConditional() {
  const pathname = usePathname();

  // Hide footer on map page for full-bleed experience
  if (pathname === '/map') return null;

  return <Footer />;
}
