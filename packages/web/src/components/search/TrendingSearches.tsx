'use client';

import type { TrendingSearch } from '@desi-connect/shared/src/types';

interface TrendingSearchesProps {
  trending: TrendingSearch[];
  onSelect: (query: string) => void;
}

function getTrendIcon(trend: TrendingSearch['trend']): string {
  switch (trend) {
    case 'up':
      return '🔥';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
}

export default function TrendingSearches({ trending, onSelect }: TrendingSearchesProps) {
  if (trending.length === 0) return null;

  return (
    <div data-testid="trending-searches">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Trending Searches</h3>
      <div className="flex flex-wrap gap-2">
        {trending.map((item) => (
          <button
            key={item.query}
            onClick={() => onSelect(item.query)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            data-testid={`trending-${item.query}`}
          >
            <span>{getTrendIcon(item.trend)}</span>
            <span>{item.query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
