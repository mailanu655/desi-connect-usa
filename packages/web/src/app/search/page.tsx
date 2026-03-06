'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type {
  SearchContentType,
  SearchResponse,
  SearchFacets,
  TrendingSearch,
  RecentSearch,
} from '@desi-connect/shared/src/types';
import {
  DEFAULT_SEARCH_LIMIT,
  formatResultCount,
  formatSearchTime,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  sanitizeQuery,
  isValidQuery,
} from '@/lib/search';
import SearchResultCard from '@/components/search/SearchResultCard';
import SearchFilters from '@/components/search/SearchFilters';
import TrendingSearches from '@/components/search/TrendingSearches';
import RecentSearches from '@/components/search/RecentSearches';
import Pagination from '@/components/ui/Pagination';

const RECENT_SEARCHES_KEY = 'desi_connect_recent_searches';

function loadRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: RecentSearch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // Ignore storage errors
  }
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL
  const initialQuery = searchParams.get('q') || '';
  const initialTypes = searchParams.get('types')?.split(',').filter(Boolean) as SearchContentType[] || [];
  const initialCity = searchParams.get('city') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [selectedTypes, setSelectedTypes] = useState<SearchContentType[]>(initialTypes);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);

  // Results state
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trending & recent
  const [trending, setTrending] = useState<TrendingSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Fetch trending searches
  useEffect(() => {
    fetch('/api/search/trending')
      .then((res) => res.json())
      .then((data) => setTrending(data.trending || []))
      .catch(() => {});
  }, []);

  // Update URL when search params change
  const updateUrl = useCallback(
    (q: string, types: SearchContentType[], city: string, category: string, p: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (types.length > 0) params.set('types', types.join(','));
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      if (p > 1) params.set('page', String(p));
      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : '/search', { scroll: false });
    },
    [router]
  );

  // Execute search
  const executeSearch = useCallback(
    async (q: string, types: SearchContentType[], city: string, category: string, p: number) => {
      const sanitized = sanitizeQuery(q);
      if (!isValidQuery(sanitized)) {
        setResults(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('q', sanitized);
        if (types.length > 0) params.set('types', types.join(','));
        if (city) params.set('city', city);
        if (category) params.set('category', category);
        params.set('page', String(p));
        params.set('limit', String(DEFAULT_SEARCH_LIMIT));

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data: SearchResponse = await response.json();
        setResults(data);

        // Add to recent searches
        const newRecent = addRecentSearch(recentSearches, {
          query: sanitized,
          timestamp: new Date().toISOString(),
          result_count: data.total,
        });
        setRecentSearches(newRecent);
        saveRecentSearches(newRecent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [recentSearches]
  );

  // Trigger search when params change
  useEffect(() => {
    if (query) {
      executeSearch(query, selectedTypes, selectedCity, selectedCategory, page);
      updateUrl(query, selectedTypes, selectedCity, selectedCategory, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedTypes, selectedCity, selectedCategory, page]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeQuery(inputValue);
    if (isValidQuery(sanitized)) {
      setQuery(sanitized);
      setPage(1);
    }
  };

  const handleQuickSearch = (q: string) => {
    setInputValue(q);
    setQuery(q);
    setPage(1);
  };

  const handleTypesChange = (types: SearchContentType[]) => {
    setSelectedTypes(types);
    setPage(1);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveRecent = (q: string) => {
    const updated = removeRecentSearch(recentSearches, q);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  };

  const handleClearRecent = () => {
    setRecentSearches(clearRecentSearches());
    saveRecentSearches([]);
  };

  const hasQuery = isValidQuery(query);
  const showEmptyState = !hasQuery && !loading;
  const showResults = hasQuery && results && !loading;
  const showNoResults = hasQuery && results && results.total === 0 && !loading;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Search Desi Connect USA
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3" data-testid="search-form">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search businesses, jobs, events, deals, news..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 text-sm placeholder-gray-500 transition-colors focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                data-testid="search-input"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.305 5.305a7.5 7.5 0 0010.898 10.898z"
                />
              </svg>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              data-testid="search-button"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Empty State — show trending and recent searches */}
        {showEmptyState && (
          <div className="space-y-8" data-testid="search-empty-state">
            <RecentSearches
              searches={recentSearches}
              onSelect={handleQuickSearch}
              onRemove={handleRemoveRecent}
              onClear={handleClearRecent}
            />
            <TrendingSearches trending={trending} onSelect={handleQuickSearch} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20" data-testid="search-loading">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-orange-600" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700"
            data-testid="search-error"
          >
            {error}
          </div>
        )}

        {/* Results Layout */}
        {showResults && !showNoResults && (
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <SearchFilters
                selectedTypes={selectedTypes}
                onTypesChange={handleTypesChange}
                facets={results.facets}
                selectedCity={selectedCity}
                onCityChange={handleCityChange}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </aside>

            {/* Results Column */}
            <div className="min-w-0 flex-1">
              {/* Results header */}
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600" data-testid="results-count">
                  {formatResultCount(results.total)} for &ldquo;{results.query}&rdquo;
                  <span className="ml-1 text-gray-400">
                    ({formatSearchTime(results.took_ms)})
                  </span>
                </p>
              </div>

              {/* Active filters (mobile) */}
              {selectedTypes.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 lg:hidden" data-testid="active-filters-mobile">
                  {selectedTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
                    >
                      {type}
                      <button
                        onClick={() =>
                          handleTypesChange(selectedTypes.filter((t) => t !== type))
                        }
                        className="ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Result list */}
              <div className="space-y-3" data-testid="search-results">
                {results.results.map((result) => (
                  <SearchResultCard
                    key={`${result.type}-${result.id}`}
                    result={result}
                    query={results.query}
                  />
                ))}
              </div>

              {/* Pagination */}
              {results.total_pages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={page}
                    totalPages={results.total_pages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {showNoResults && (
          <div className="py-16 text-center" data-testid="search-no-results">
            <div className="mx-auto mb-4 text-5xl">🔍</div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              No results found for &ldquo;{results.query}&rdquo;
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Try different keywords or check your spelling.
            </p>
            <TrendingSearches trending={trending} onSelect={handleQuickSearch} />
          </div>
        )}
      </div>
    </main>
  );
}
