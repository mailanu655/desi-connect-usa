export const dynamic = 'force-dynamic';
/**
 * GET /api/search/suggestions - Autocomplete search suggestions
 * Week 13: Search & Discovery
 */
import { NextRequest, NextResponse } from 'next/server';
import type { SearchSuggestionsResponse, SearchSuggestion } from '@desi-connect/shared/src/types';
import {
  SEARCH_CONTENT_TYPES,
  MAX_SUGGESTIONS,
  sanitizeQuery,
  isValidQuery,
} from '@/lib/search';
import { BUSINESS_CATEGORIES, NEWS_CATEGORIES, JOB_TYPES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') || '';
  const query = sanitizeQuery(rawQuery);

  if (!isValidQuery(query)) {
    return NextResponse.json({
      suggestions: [],
      query: rawQuery,
    } satisfies SearchSuggestionsResponse);
  }

  const lowerQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  // Match content types
  for (const config of SEARCH_CONTENT_TYPES) {
    if (
      config.label.toLowerCase().includes(lowerQuery) ||
      config.plural.toLowerCase().includes(lowerQuery)
    ) {
      suggestions.push({
        text: `Search ${config.plural}`,
        type: config.type,
        highlight: config.label,
        url: `/search?types=${config.type}&q=${encodeURIComponent(query)}`,
      });
    }
  }

  // Match business categories
  for (const cat of BUSINESS_CATEGORIES) {
    if (cat.label.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: cat.label,
        type: 'business',
        highlight: cat.label,
        url: `/businesses?category=${cat.value}`,
      });
    }
  }

  // Match news categories
  for (const cat of NEWS_CATEGORIES) {
    if (cat.label.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: `${cat.label} News`,
        type: 'news',
        highlight: cat.label,
        url: `/news?category=${cat.value}`,
      });
    }
  }

  // Match job types
  for (const jt of JOB_TYPES) {
    if (jt.label.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        text: `${jt.label} Jobs`,
        type: 'job',
        highlight: jt.label,
        url: `/jobs?type=${jt.value}`,
      });
    }
  }

  // Generic query suggestion
  suggestions.push({
    text: query,
    type: 'query',
    highlight: query,
    url: `/search?q=${encodeURIComponent(query)}`,
  });

  const response: SearchSuggestionsResponse = {
    suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    query,
  };

  return NextResponse.json(response);
}
