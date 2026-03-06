/**
 * Search & Discovery Utilities for Desi Connect USA
 * Week 13: Global search, suggestions, recent searches, result normalization
 */

import type {
  SearchContentType,
  SearchContentTypeConfig,
  SearchResult,
  SearchParams,
  SearchSuggestion,
  RecentSearch,
  SearchFacet,
  SearchFacets,
  SearchHighlight,
  SearchResultWithHighlights,
} from '@desi-connect-usa/shared/src/types';
import type {
  Business,
  NewsArticle,
  Job,
  DesiEvent,
  Deal,
  Consultancy,
} from '@/lib/api-client';

// ─── Content Type Configuration ──────────────────────────────

export const SEARCH_CONTENT_TYPES: SearchContentTypeConfig[] = [
  { type: 'business', label: 'Business', plural: 'Businesses', icon: '🏪', color: 'orange' },
  { type: 'job', label: 'Job', plural: 'Jobs', icon: '💼', color: 'blue' },
  { type: 'event', label: 'Event', plural: 'Events', icon: '📅', color: 'purple' },
  { type: 'deal', label: 'Deal', plural: 'Deals', icon: '🏷️', color: 'green' },
  { type: 'news', label: 'News', plural: 'News', icon: '📰', color: 'red' },
  { type: 'consultancy', label: 'Consultancy', plural: 'Consultancies', icon: '👔', color: 'teal' },
  { type: 'forum', label: 'Discussion', plural: 'Discussions', icon: '💬', color: 'indigo' },
];

export const ALL_CONTENT_TYPES: SearchContentType[] = SEARCH_CONTENT_TYPES.map((c) => c.type);

export const MAX_RECENT_SEARCHES = 10;
export const MAX_SUGGESTIONS = 8;
export const DEFAULT_SEARCH_LIMIT = 20;
export const MIN_QUERY_LENGTH = 2;
export const DEBOUNCE_MS = 300;

// ─── Content Type Helpers ────────────────────────────────────

export function getContentTypeConfig(type: SearchContentType): SearchContentTypeConfig | undefined {
  return SEARCH_CONTENT_TYPES.find((c) => c.type === type);
}

export function getContentTypeLabel(type: SearchContentType): string {
  return getContentTypeConfig(type)?.label ?? type;
}

export function getContentTypePluralLabel(type: SearchContentType): string {
  return getContentTypeConfig(type)?.plural ?? type;
}

export function getContentTypeIcon(type: SearchContentType): string {
  return getContentTypeConfig(type)?.icon ?? '🔍';
}

export function getContentTypeColor(type: SearchContentType): string {
  return getContentTypeConfig(type)?.color ?? 'gray';
}

// ─── Query Utilities ─────────────────────────────────────────

/** Sanitize a search query: trim whitespace, collapse multiple spaces */
export function sanitizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

/** Check if query meets minimum length requirement */
export function isValidQuery(query: string): boolean {
  return sanitizeQuery(query).length >= MIN_QUERY_LENGTH;
}

/** Extract individual search terms from a query */
export function extractSearchTerms(query: string): string[] {
  const sanitized = sanitizeQuery(query).toLowerCase();
  if (!sanitized) return [];
  return sanitized.split(' ').filter((term) => term.length > 0);
}

/** Build a URL-safe search query string from SearchParams */
export function buildSearchQueryString(params: SearchParams): string {
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.set('q', params.query);
  if (params.content_types && params.content_types.length > 0) {
    urlParams.set('types', params.content_types.join(','));
  }
  if (params.city) urlParams.set('city', params.city);
  if (params.state) urlParams.set('state', params.state);
  if (params.category) urlParams.set('category', params.category);
  if (params.sort_by) urlParams.set('sort', params.sort_by);
  if (params.sort_order) urlParams.set('order', params.sort_order);
  if (params.page && params.page > 1) urlParams.set('page', String(params.page));
  if (params.limit) urlParams.set('limit', String(params.limit));
  if (params.date_from) urlParams.set('from', params.date_from);
  if (params.date_to) urlParams.set('to', params.date_to);

  return urlParams.toString();
}

/** Parse URL search params back into SearchParams */
export function parseSearchQueryString(searchParams: URLSearchParams): SearchParams {
  const types = searchParams.get('types');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  return {
    query: searchParams.get('q') || '',
    content_types: types
      ? (types.split(',').filter((t) => ALL_CONTENT_TYPES.includes(t as SearchContentType)) as SearchContentType[])
      : undefined,
    city: searchParams.get('city') || undefined,
    state: searchParams.get('state') || undefined,
    category: searchParams.get('category') || undefined,
    sort_by: (searchParams.get('sort') as SearchParams['sort_by']) || undefined,
    sort_order: (searchParams.get('order') as SearchParams['sort_order']) || undefined,
    page: page ? parseInt(page, 10) || 1 : undefined,
    limit: limit ? parseInt(limit, 10) || DEFAULT_SEARCH_LIMIT : undefined,
    date_from: searchParams.get('from') || undefined,
    date_to: searchParams.get('to') || undefined,
  };
}

// ─── Result Normalization ────────────────────────────────────

/** Convert a Business into a unified SearchResult */
export function normalizeBusinessResult(business: Business): SearchResult {
  return {
    id: business.business_id,
    type: 'business',
    title: business.name,
    description: business.description || `${business.category} in ${business.city}, ${business.state}`,
    url: `/businesses/${business.business_id}`,
    image_url: business.image_url,
    city: business.city,
    state: business.state,
    category: business.category,
    date: business.created_at,
    rating: business.rating,
    metadata: {
      phone: business.phone,
      review_count: business.review_count,
      status: business.status,
    },
  };
}

/** Convert a Job into a unified SearchResult */
export function normalizeJobResult(job: Job): SearchResult {
  return {
    id: job.job_id,
    type: 'job',
    title: `${job.title} at ${job.company}`,
    description: job.description,
    url: `/jobs?id=${job.job_id}`,
    city: job.city,
    state: job.state,
    category: job.job_type,
    date: job.posted_date,
    metadata: {
      company: job.company,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      h1b_sponsor: job.h1b_sponsor,
      opt_friendly: job.opt_friendly,
      experience_level: job.experience_level,
    },
  };
}

/** Convert a NewsArticle into a unified SearchResult */
export function normalizeNewsResult(article: NewsArticle): SearchResult {
  return {
    id: article.news_id,
    type: 'news',
    title: article.title,
    description: article.summary,
    url: `/news/${article.news_id}`,
    image_url: article.image_url,
    city: article.city,
    state: article.state,
    category: article.category,
    date: article.published_date,
    metadata: {
      source_name: article.source_name,
      view_count: article.view_count,
      status: article.status,
    },
  };
}

/** Convert a DesiEvent into a unified SearchResult */
export function normalizeEventResult(event: DesiEvent): SearchResult {
  return {
    id: event.event_id,
    type: 'event',
    title: event.title,
    description: event.description,
    url: `/events/${event.event_id}`,
    image_url: event.image_url,
    city: event.city,
    state: event.state,
    category: event.category,
    date: event.start_date,
    metadata: {
      is_virtual: event.is_virtual,
      is_free: event.is_free,
      organizer: event.organizer,
      venue_name: event.venue_name,
      rsvp_count: event.rsvp_count,
    },
  };
}

/** Convert a Deal into a unified SearchResult */
export function normalizeDealResult(deal: Deal): SearchResult {
  return {
    id: deal.deal_id,
    type: 'deal',
    title: deal.title,
    description: deal.description,
    url: `/deals/${deal.deal_id}`,
    image_url: deal.image_url,
    city: deal.city,
    state: deal.state,
    category: deal.deal_type,
    date: deal.expiry_date,
    metadata: {
      business_name: deal.business_name,
      discount_value: deal.discount_value,
      coupon_code: deal.coupon_code,
      status: deal.status,
    },
  };
}

/** Convert a Consultancy into a unified SearchResult */
export function normalizeConsultancyResult(consultancy: Consultancy): SearchResult {
  return {
    id: consultancy.consultancy_id,
    type: 'consultancy',
    title: consultancy.name,
    description: consultancy.description || `${consultancy.specialization} consultancy in ${consultancy.city}, ${consultancy.state}`,
    url: `/consultancies/${consultancy.consultancy_id}`,
    city: consultancy.city,
    state: consultancy.state,
    category: consultancy.specialization,
    rating: consultancy.rating,
    metadata: {
      phone: consultancy.phone,
      email: consultancy.email,
      website: consultancy.website,
    },
  };
}

// ─── Text Matching & Highlighting ────────────────────────────

/** Simple text match — checks if query terms appear in a target string */
export function textMatch(target: string, query: string): boolean {
  if (!target || !query) return false;
  const terms = extractSearchTerms(query);
  const lowerTarget = target.toLowerCase();
  return terms.some((term) => lowerTarget.includes(term));
}

/** Calculate a simple relevance score (0-100) */
export function calculateRelevanceScore(result: SearchResult, query: string): number {
  if (!query) return 0;
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return 0;

  let score = 0;
  const titleLower = result.title.toLowerCase();
  const descLower = result.description.toLowerCase();

  for (const term of terms) {
    // Title matches are worth more
    if (titleLower.includes(term)) score += 30;
    // Exact title match gets a bonus
    if (titleLower === term) score += 20;
    // Description matches
    if (descLower.includes(term)) score += 10;
    // Category match
    if (result.category?.toLowerCase().includes(term)) score += 15;
    // City/state match
    if (result.city?.toLowerCase().includes(term)) score += 5;
    if (result.state?.toLowerCase().includes(term)) score += 5;
  }

  // Normalize to 0-100
  return Math.min(100, score);
}

/** Generate highlighted snippets for a result */
export function generateHighlights(result: SearchResult, query: string): SearchHighlight[] {
  if (!query) return [];
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const highlights: SearchHighlight[] = [];
  const fields: Array<{ field: string; value: string }> = [
    { field: 'title', value: result.title },
    { field: 'description', value: result.description },
  ];

  if (result.category) {
    fields.push({ field: 'category', value: result.category });
  }

  for (const { field, value } of fields) {
    const lowerValue = value.toLowerCase();
    for (const term of terms) {
      const idx = lowerValue.indexOf(term);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(value.length, idx + term.length + 40);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < value.length ? '...' : '';
        highlights.push({
          field,
          snippet: `${prefix}${value.slice(start, end)}${suffix}`,
        });
        break; // one highlight per field
      }
    }
  }

  return highlights;
}

/** Enhance search results with highlights and scores */
export function enhanceResults(results: SearchResult[], query: string): SearchResultWithHighlights[] {
  return results.map((result) => ({
    ...result,
    highlights: generateHighlights(result, query),
    score: calculateRelevanceScore(result, query),
  }));
}

/** Sort enhanced results by score descending */
export function sortByRelevance(results: SearchResultWithHighlights[]): SearchResultWithHighlights[] {
  return [...results].sort((a, b) => b.score - a.score);
}

// ─── Facet Computation ───────────────────────────────────────

/** Compute facets from a set of search results */
export function computeFacets(results: SearchResult[]): SearchFacets {
  const typeCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const stateCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  for (const result of results) {
    typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
    if (result.city) cityCounts[result.city] = (cityCounts[result.city] || 0) + 1;
    if (result.state) stateCounts[result.state] = (stateCounts[result.state] || 0) + 1;
    if (result.category) categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
  }

  const toFacets = (counts: Record<string, number>, labelFn?: (v: string) => string): SearchFacet[] =>
    Object.entries(counts)
      .map(([value, count]) => ({ value, label: labelFn ? labelFn(value) : value, count }))
      .sort((a, b) => b.count - a.count);

  return {
    content_types: toFacets(typeCounts, (v) => getContentTypePluralLabel(v as SearchContentType)),
    cities: toFacets(cityCounts),
    states: toFacets(stateCounts),
    categories: toFacets(categoryCounts),
  };
}

// ─── Recent Searches ─────────────────────────────────────────

/** Add a search to recent searches list, deduplicating and capping at MAX */
export function addRecentSearch(
  recents: RecentSearch[],
  search: RecentSearch
): RecentSearch[] {
  // Remove duplicate query if exists
  const filtered = recents.filter(
    (r) => r.query.toLowerCase() !== search.query.toLowerCase()
  );
  // Add to front
  const updated = [search, ...filtered];
  // Cap at max
  return updated.slice(0, MAX_RECENT_SEARCHES);
}

/** Remove a recent search by query text */
export function removeRecentSearch(
  recents: RecentSearch[],
  query: string
): RecentSearch[] {
  return recents.filter((r) => r.query.toLowerCase() !== query.toLowerCase());
}

/** Clear all recent searches */
export function clearRecentSearches(): RecentSearch[] {
  return [];
}

// ─── Suggestion Generation ───────────────────────────────────

/** Generate search suggestions from content type configs and categories */
export function generateSuggestions(
  query: string,
  contentTypes: SearchContentTypeConfig[],
  categories: string[]
): SearchSuggestion[] {
  if (!isValidQuery(query)) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  // Suggest content types that match
  for (const config of contentTypes) {
    if (config.label.toLowerCase().includes(lowerQuery) || config.plural.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: `Search ${config.plural}`,
        type: config.type,
        highlight: config.label,
      });
    }
  }

  // Suggest categories that match
  for (const cat of categories) {
    if (cat.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: cat,
        type: 'query',
        highlight: cat,
      });
    }
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}

// ─── URL Helpers ─────────────────────────────────────────────

/** Build search page URL with params */
export function buildSearchUrl(params: SearchParams): string {
  const qs = buildSearchQueryString(params);
  return qs ? `/search?${qs}` : '/search';
}

/** Get the display URL for a search result */
export function getResultUrl(result: SearchResult): string {
  return result.url;
}

/** Format result count for display (e.g., "1,234 results") */
export function formatResultCount(count: number): string {
  if (count === 0) return 'No results';
  if (count === 1) return '1 result';
  return `${count.toLocaleString('en-US')} results`;
}

/** Format search time for display */
export function formatSearchTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Paginate results in-memory */
export function paginateResults<T>(items: T[], page: number, limit: number): { items: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    items: items.slice(start, end),
    total,
    totalPages,
  };
}
