'use client';

import type { RecentSearch } from '@desi-connect/shared/src/types';

interface RecentSearchesProps {
  searches: RecentSearch[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
}

export default function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div data-testid="recent-searches">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent Searches</h3>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-orange-600"
          data-testid="clear-recent"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-1">
        {searches.map((search) => (
          <li
            key={search.query}
            className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
          >
            <button
              onClick={() => onSelect(search.query)}
              className="flex items-center gap-2 text-sm text-gray-700"
              data-testid={`recent-${search.query}`}
            >
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{search.query}</span>
            </button>
            <button
              onClick={() => onRemove(search.query)}
              className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
              data-testid={`remove-recent-${search.query}`}
              aria-label={`Remove ${search.query}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
