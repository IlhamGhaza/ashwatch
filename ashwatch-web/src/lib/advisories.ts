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
          'AshWatch/1.0 (+https://ashwatch.vercel.app; research & monitoring)',
        Accept: 'text/html,application/xhtml+xml',
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
