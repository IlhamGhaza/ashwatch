/**
 * Single source of truth for AshWatch configuration.
 * All canonical URLs, Open Graph, Twitter Cards, Sitemap, and JSON-LD
 * reference this configuration.
 */

const rawSiteUrl = 
  process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ashwatch.vercel.app');

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export const SITE_CONFIG = {
  name: 'AshWatch',
  shortName: 'AshWatch',
  title: 'AshWatch — Real-Time Volcanic Ash Map for Indonesia',
  description:
    'AshWatch is an interactive volcanic ash map for Indonesia, helping users explore volcanic ash advisories, volcano locations, flight levels, and ash dispersion data.',
  siteUrl: SITE_URL,
  author: 'Ilham Ghazali',
  authorUrl: 'https://github.com/IlhamGhaza',
  links: {
    github: 'https://github.com/IlhamGhaza/ashwatch',
    authorGithub: 'https://github.com/IlhamGhaza',
    bomDataSource: 'https://www.bom.gov.au/products/Volc_ash_recent.shtml',
  },
  themeColor: '#0F172A',
  locale: 'en_US',
  keywords: [
    'volcanic ash',
    'volcanic ash map',
    'volcanic ash Indonesia',
    'Indonesia volcanoes',
    'volcanic ash advisory',
    'volcanic ash cloud',
    'aviation volcanic ash',
    'Darwin VAAC',
    'volcano monitoring',
    'volcanic ash forecast',
    'flight level ash',
    'Krakatau',
    'Semeru',
    'Lewotolok',
    'Dukono',
    'Ibu',
  ],
};
