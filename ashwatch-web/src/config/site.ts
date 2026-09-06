/**
 * Single source of truth for AshWatch configuration and SEO metadata.
 * Compliant with tugas-seo.md specifications.
 */

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://ashwatch-id.vercel.app');

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export const SITE_CONFIG = {
  name: 'AshWatch',
  shortName: 'AshWatch',
  tagline: 'Check Volcanic Ash Near You',
  title: 'Volcanic Ash Map Indonesia | AshWatch',
  subtitle: 'Volcanic Ash Map',
  description:
    'Volcanic ash map for Indonesia. Explore current ash spread, forecasts, active volcanoes, and check whether your location is affected.',
  siteUrl: SITE_URL,
  author: 'Ilham Ghazali',
  authorUrl: 'https://github.com/IlhamGhaza',
  links: {
    github: 'https://github.com/IlhamGhaza/ashwatch',
    authorGithub: 'https://github.com/IlhamGhaza',
    bomDataSource: 'https://www.bom.gov.au/products/Volc_ash_recent.shtml',
  },
  themeColor: '#0B0F17',
  locale: 'en_US',
  keywords: [
    // Primary keywords
    'volcanic ash map Indonesia',
    'volcanic ash Indonesia',
    'peta abu vulkanik Indonesia',
    'sebaran abu vulkanik Indonesia',
    'peta sebaran abu vulkanik',
    'volcanic ash near me',
    'abu vulkanik Indonesia',
    'sebaran abu gunung api',
    'volcanic ash map',
    'volcanic ash alert Indonesia',
    // Secondary keywords
    'Indonesia volcano ash',
    'volcanic ash spread',
    'volcanic ash forecast',
    'volcanic ash cloud Indonesia',
    'peta abu gunung api',
    'cek sebaran abu vulkanik',
    'cek abu vulkanik',
    'kondisi abu vulkanik Indonesia',
    'gunung api aktif Indonesia',
    'volcanic ash forecast Indonesia',
    // Long-tail keywords
    'apakah daerah saya terkena abu vulkanik',
    'cek apakah lokasi terkena abu vulkanik',
    'peta sebaran abu vulkanik Indonesia hari ini',
    'volcanic ash map Indonesia today',
    'volcanic ash near my location',
    'Darwin VAAC',
    'Krakatau',
    'Semeru',
    'Lewotolok',
    'Dukono',
    'Ibu',
  ],
};
