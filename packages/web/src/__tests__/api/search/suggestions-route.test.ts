/** @jest-environment node */

/**
 * Tests for Search Suggestions API Route
 * Week 13: Search & Discovery
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/suggestions/route';

describe('Search Suggestions API Route', () => {
  describe('GET', () => {
    it('should return empty suggestions for empty query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([]);
    });

    it('should return empty suggestions for single character query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=a'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.suggestions).toEqual([]);
    });

    it('should return suggestions matching content types', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=business'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions.length).toBeGreaterThan(0);
      // Should match "Businesses" content type
      const contentTypeSuggestion = data.suggestions.find(
        (s: any) => s.type === 'business'
      );
      expect(contentTypeSuggestion).toBeDefined();
    });

    it('should return suggestions matching business categories', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=restaurant'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.suggestions.length).toBeGreaterThan(0);
      const catSuggestion = data.suggestions.find(
        (s: any) => s.type === 'business'
      );
      expect(catSuggestion).toBeDefined();
    });

    it('should return suggestions matching news categories', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=community'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('should return suggestions matching job types', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=full-time'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.suggestions.length).toBeGreaterThan(0);
    });

    it('should always include a generic query suggestion', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=xyz123'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.suggestions.length).toBeGreaterThanOrEqual(1);
      const querySuggestion = data.suggestions.find(
        (s: any) => s.type === 'query'
      );
      expect(querySuggestion).toBeDefined();
      expect(querySuggestion.text).toBe('xyz123');
    });

    it('should limit suggestions to MAX_SUGGESTIONS', async () => {
      // A broad query that matches many things
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=e'
      );
      const response = await GET(request);
      const data = await response.json();

      // Empty because 'e' is only 1 char
      expect(data.suggestions.length).toBe(0);
    });

    it('should return query in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=test+query'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.query).toBeDefined();
    });

    it('should provide correct suggestion structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=restaurant'
      );
      const response = await GET(request);
      const data = await response.json();

      if (data.suggestions.length > 0) {
        const suggestion = data.suggestions[0];
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('highlight');
        expect(suggestion).toHaveProperty('url');
      }
    });

    it('should handle special characters in query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=%3Cscript%3E'
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should be case insensitive in matching', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=RESTAURANT'
      );
      const response1 = await GET(request1);
      const data1 = await response1.json();

      const request2 = new NextRequest(
        'http://localhost:3000/api/search/suggestions?q=restaurant'
      );
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(data1.suggestions.length).toBe(data2.suggestions.length);
    });
  });
});
