import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd, getBreadcrumbJsonLd } from './json-ld';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const allItems = [{ name: 'Home', url: '/' }, ...items];

  return (
    <>
      <JsonLd data={getBreadcrumbJsonLd(allItems)} />
      <nav aria-label="Breadcrumbs" className="mb-6 flex items-center text-xs text-slate-400">
        <ol className="flex flex-wrap items-center gap-1.5">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                {isLast ? (
                  <span className="font-semibold text-slate-200" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="flex items-center gap-1 transition hover:text-slate-200"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
