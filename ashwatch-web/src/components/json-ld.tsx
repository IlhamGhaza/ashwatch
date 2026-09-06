import React from 'react';
import { SITE_CONFIG, SITE_URL } from '@/config/site';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Standard SoftwareApplication and WebSite Schema for AshWatch
 */
export function getRootJsonLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_CONFIG.name,
      applicationCategory: 'WeatherApplication',
      operatingSystem: 'Web',
      description: SITE_CONFIG.description,
      url: SITE_URL,
      softwareVersion: '1.0.0',
      author: {
        '@type': 'Person',
        name: SITE_CONFIG.author,
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_CONFIG.name,
      url: SITE_URL,
      description: SITE_CONFIG.description,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/volcanoes?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/**
 * FAQPage Schema generator
 */
export function getFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList Schema generator
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}
