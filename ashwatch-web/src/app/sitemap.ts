import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';
import { getDarwinAdvisories } from '@/lib/advisories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/map`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/volcanoes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/advisories`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/data-sources`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic Volcano & Advisory routes from live Darwin VAAC feed
  let volcanoRoutes: MetadataRoute.Sitemap = [];
  let advisoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const data = await getDarwinAdvisories();
    volcanoRoutes = data.deduplicated.map((v) => ({
      url: `${SITE_URL}/volcanoes/${v.volcanoName.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    }));
    advisoryRoutes = data.deduplicated.map((adv) => ({
      url: `${SITE_URL}/advisories/${adv.id}`,
      lastModified: new Date(adv.dtg),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch {
    // Graceful fallback if data fetch fails
  }

  return [...staticRoutes, ...volcanoRoutes, ...advisoryRoutes];
}
