/** @jest-environment node */

/**
 * Tests for Trending Searches API Route
 * Week 13: Search & Discovery
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/trending/route';

describe('Trending Searches API Route', () => {
  describe('GET', () => {
    it('should return trending searches', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('trending');
      expect(data).toHaveProperty('period');
      expect(Array.isArray(data.trending)).toBe(true);
    });

    it('should return trending items with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.trending.length).toBeGreaterThan(0);
      const item = data.trending[0];
      expect(item).toHaveProperty('query');
      expect(item).toHaveProperty('search_count');
      expect(item).toHaveProperty('trend');
      expect(['up', 'down', 'stable']).toContain(item.trend);
    });

    it('should default to weekly period', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('weekly');
    });

    it('should support daily period parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending?period=daily'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('daily');
    });

    it('should fallback to weekly for unknown period values', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending?period=hourly'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.period).toBe('weekly');
    });

    it('should default to 8 items when no limit specified', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.trending.length).toBeLessThanOrEqual(8);
    });

    it('should respect limit parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending?limit=3'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.trending.length).toBe(3);
    });

    it('should handle limit=1', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending?limit=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.trending.length).toBe(1);
    });

    it('should handle invalid limit gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending?limit=abc'
      );
      const response = await GET(request);
      const data = await response.json();

      // NaN || 8 → defaults to 8
      expect(response.status).toBe(200);
      expect(data.trending.length).toBeLessThanOrEqual(8);
    });

    it('should return search counts as numbers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      for (const item of data.trending) {
        expect(typeof item.search_count).toBe('number');
        expect(item.search_count).toBeGreaterThan(0);
      }
    });

    it('should return queries as non-empty strings', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search/trending'
      );
      const response = await GET(request);
      const data = await response.json();

      for (const item of data.trending) {
        expect(typeof item.query).toBe('string');
        expect(item.query.length).toBeGreaterThan(0);
      }
    });
  });
});
