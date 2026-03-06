/**
 * GET /api/search - Global search across all content types
 * Week 13: Search & Discovery
 */
import { NextRequest, NextResponse } from 'next/server';
import { ApiClient } from '@/lib/api-client';
import type { SearchContentType, SearchResponse, SearchResult } from '@desi-connect-usa/shared/src/types';
import {
  ALL_CONTENT_TYPES,
  DEFAULT_SEARCH_LIMIT,
  normalizeBusinessResult,
  normalizeJobResult,
  normalizeNewsResult,
  normalizeEventResult,
  normalizeDealResult,
  normalizeConsultancyResult,
  enhanceResults,
  sortByRelevance,
  computeFacets,
  paginateResults,
  sanitizeQuery,
  isValidQuery,
} from '@/lib/search';

const api = new ApiClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const rawQuery = searchParams.get('q') || '';
  const query = sanitizeQuery(rawQuery);

  if (!isValidQuery(query)) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const typesParam = searchParams.get('types');
  const requestedTypes: SearchContentType[] = typesParam
    ? (typesParam.split(',').filter((t) => ALL_CONTENT_TYPES.includes(t as SearchContentType)) as SearchContentType[])
    : ALL_CONTENT_TYPES;

  const city = searchParams.get('city') || undefined;
  const state = searchParams.get('state') || undefined;
  const category = searchParams.get('category') || undefined;
  const pageStr = searchParams.get('page');
  const limitStr = searchParams.get('limit');
  const page = pageStr ? parseInt(pageStr, 10) || 1 : 1;
  const limit = limitStr ? parseInt(limitStr, 10) || DEFAULT_SEARCH_LIMIT : DEFAULT_SEARCH_LIMIT;

  try {
    // Fetch from all requested content types in parallel
    const fetchers: Array<Promise<SearchResult[]>> = [];

    if (requestedTypes.includes('business')) {
      fetchers.push(
        api.getBusinesses({ search: query, city, state, limit: 50 })
          .then((res) => res.data.map(normalizeBusinessResult))
          .catch(() => [])
      );
    }

    if (requestedTypes.includes('job')) {
      fetchers.push(
        api.getJobs({ search: query, city, state, limit: 50 })
          .then((res) => res.data.map(normalizeJobResult))
          .catch(() => [])
      );
    }

    if (requestedTypes.includes('news')) {
      fetchers.push(
        api.getNews({ search: query, category, limit: 50 })
          .then((res) => res.data.map(normalizeNewsResult))
          .catch(() => [])
      );
    }

    if (requestedTypes.includes('event')) {
      fetchers.push(
        api.getEvents({ search: query, city, state, limit: 50 })
          .then((res) => res.data.map(normalizeEventResult))
          .catch(() => [])
      );
    }

    if (requestedTypes.includes('deal')) {
      fetchers.push(
        api.getDeals({ search: query, city, state, limit: 50 })
          .then((res) => res.data.map(normalizeDealResult))
          .catch(() => [])
      );
    }

    if (requestedTypes.includes('consultancy')) {
      fetchers.push(
        api.getConsultancies({ search: query, city, state, limit: 50 })
          .then((res) => res.data.map(normalizeConsultancyResult))
          .catch(() => [])
      );
    }

    const resultArrays = await Promise.all(fetchers);
    const allResults = resultArrays.flat();

    // Score & sort by relevance
    const enhanced = enhanceResults(allResults, query);
    const sorted = sortByRelevance(enhanced);

    // Apply category filter on results if provided
    const filtered = category
      ? sorted.filter((r) => r.category?.toLowerCase() === category.toLowerCase())
      : sorted;

    // Compute facets from all results (before pagination)
    const facets = computeFacets(filtered);

    // Paginate
    const { items, total, totalPages } = paginateResults(filtered, page, limit);

    const took_ms = Date.now() - startTime;

    const response: SearchResponse = {
      results: items,
      facets,
      query,
      total,
      page,
      limit,
      total_pages: totalPages,
      took_ms,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed. Please try again.' },
      { status: 500 }
    );
  }
}
