/**
 * Search & Discovery Types for Desi Connect USA
 * Week 13: Global search across all content types
 */

/** Content types that can be searched */
export type SearchContentType =
  | 'business'
  | 'job'
  | 'event'
  | 'deal'
  | 'news'
  | 'consultancy'
  | 'forum';

/** Sort options for search results */
export type SearchSortBy = 'relevance' | 'date' | 'rating' | 'name';
export type SearchSortOrder = 'asc' | 'desc';

/** Parameters for search queries */
export interface SearchParams {
  query: string;
  content_types?: SearchContentType[];
  city?: string;
  state?: string;
  category?: string;
  sort_by?: SearchSortBy;
  sort_order?: SearchSortOrder;
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
}

/** A single unified search result */
export interface SearchResult {
  id: string;
  type: SearchContentType;
  title: string;
  description: string;
  url: string;
  image_url?: string;
  city?: string;
  state?: string;
  category?: string;
  date?: string;
  rating?: number;
  metadata: Record<string, string | number | boolean | undefined>;
}

/** Facet count for filtering */
export interface SearchFacet {
  value: string;
  label: string;
  count: number;
}

/** Facets grouped by dimension */
export interface SearchFacets {
  content_types: SearchFacet[];
  cities: SearchFacet[];
  states: SearchFacet[];
  categories: SearchFacet[];
}

/** Full search response */
export interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacets;
  query: string;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  took_ms: number;
}

/** Search suggestion (autocomplete) */
export interface SearchSuggestion {
  text: string;
  type: SearchContentType | 'query';
  highlight?: string;
  url?: string;
}

/** Search suggestions response */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  query: string;
}

/** Recent search entry stored locally */
export interface RecentSearch {
  query: string;
  content_types?: SearchContentType[];
  timestamp: string;
  result_count: number;
}

/** Trending search term */
export interface TrendingSearch {
  query: string;
  search_count: number;
  trend: 'up' | 'down' | 'stable';
}

/** Trending searches response */
export interface TrendingSearchesResponse {
  trending: TrendingSearch[];
  period: 'daily' | 'weekly';
}

/** Content type display configuration */
export interface SearchContentTypeConfig {
  type: SearchContentType;
  label: string;
  plural: string;
  icon: string;
  color: string;
}

/** Search highlight match */
export interface SearchHighlight {
  field: string;
  snippet: string;
}

/** Enhanced search result with highlights */
export interface SearchResultWithHighlights extends SearchResult {
  highlights: SearchHighlight[];
  score: number;
}
