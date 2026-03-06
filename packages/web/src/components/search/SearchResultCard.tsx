'use client';

import Link from 'next/link';
import type { SearchResult } from '@desi-connect-usa/shared/src/types';
import { getContentTypeIcon, getContentTypeColor, getContentTypeLabel } from '@/lib/search';

interface SearchResultCardProps {
  result: SearchResult;
  query?: string;
}

/** Highlight matching terms in text */
function highlightText(text: string, query?: string): React.ReactNode {
  if (!query || !text) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;

  // Build a regex matching any term (case-insensitive)
  const escapedTerms = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    const isMatch = terms.some((t) => part.toLowerCase() === t);
    return isMatch ? (
      <mark key={idx} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    );
  });
}

export default function SearchResultCard({ result, query }: SearchResultCardProps) {
  const icon = getContentTypeIcon(result.type);
  const color = getContentTypeColor(result.type);
  const label = getContentTypeLabel(result.type);

  const truncatedDescription =
    result.description.length > 200
      ? `${result.description.slice(0, 200)}...`
      : result.description;

  const locationParts = [result.city, result.state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : null;

  return (
    <Link
      href={result.url}
      className="group block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-md"
      data-testid={`search-result-${result.id}`}
    >
      <div className="flex gap-4">
        {/* Image or Icon */}
        {result.image_url ? (
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={result.image_url}
              alt={result.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-3xl">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Type Badge & Category */}
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-${color}-100 text-${color}-700`}
              data-testid="result-type-badge"
            >
              {icon} {label}
            </span>
            {result.category && (
              <span className="text-xs text-gray-500">{result.category}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-orange-600">
            {highlightText(result.title, query)}
          </h3>

          {/* Description */}
          <p className="mb-2 text-sm text-gray-600 line-clamp-2">
            {highlightText(truncatedDescription, query)}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {location && (
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {location}
              </span>
            )}
            {result.rating !== undefined && result.rating > 0 && (
              <span className="inline-flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {result.rating.toFixed(1)}
              </span>
            )}
            {result.date && (
              <span>
                {new Date(result.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
