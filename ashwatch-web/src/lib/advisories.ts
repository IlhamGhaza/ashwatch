import { VolcanoAdvisory } from './types';
import { extractPreContent } from './parser/html-extractor';
import { vaaParser } from './parser/vaa-parser';
import { MULTIPLE_ADVISORIES_FIXTURE } from './fixtures';

const BOM_URL = 'https://www.bom.gov.au/products/Volc_ash_recent.shtml';

export interface AdvisoriesResponse {
  advisories: VolcanoAdvisory[];
  deduplicated: VolcanoAdvisory[];
  updatedAt: string;
  source: 'bom' | 'fallback';
  totalActiveVolcanoes: number;
}

/**
 * Fetch and parse Darwin VAAC volcanic ash advisories.
 * Used by Server Components and API Route handlers with ISR caching.
 */
export async function getDarwinAdvisories(forceFresh = false): Promise<AdvisoriesResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(BOM_URL, {
      signal: controller.signal,
      ...(forceFresh
        ? { cache: 'no-store' }
        : { next: { revalidate: 300 } }), // Cache 5 minutes
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const preText = extractPreContent(html);
      const advisories = vaaParser.parse(preText, 'INDONESIA');

      if (advisories.length > 0) {
        const deduplicated = vaaParser.deduplicateByVolcano(advisories);
        return {
          advisories,
          deduplicated,
          updatedAt: new Date().toISOString(),
          source: 'bom',
          totalActiveVolcanoes: deduplicated.length,
        };
      }
    } else {
      console.warn(`BoM returned status ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    console.warn('Failed to fetch live BoM data, using high-fidelity fallback:', error);
  }

  // Graceful fallback to verified fixtures if BoM is unreachable
  const fallbackAdvisories = vaaParser.parse(MULTIPLE_ADVISORIES_FIXTURE, 'INDONESIA');
  const deduplicated = vaaParser.deduplicateByVolcano(fallbackAdvisories);

  return {
    advisories: fallbackAdvisories,
    deduplicated,
    updatedAt: new Date().toISOString(),
    source: 'fallback',
    totalActiveVolcanoes: deduplicated.length,
  };
}
