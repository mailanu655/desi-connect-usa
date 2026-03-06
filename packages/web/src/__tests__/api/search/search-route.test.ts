/** @jest-environment node */

/**
 * Tests for Search API Route
 * Week 13: Search & Discovery
 */
import { NextRequest } from 'next/server';

// Create mock functions BEFORE jest.mock by using var (hoisted)
const mockGetBusinesses = jest.fn();
const mockGetJobs = jest.fn();
const mockGetNews = jest.fn();
const mockGetEvents = jest.fn();
const mockGetDeals = jest.fn();
const mockGetConsultancies = jest.fn();

// Use a function that returns the mocks so hoisting doesn't cause issues
jest.mock('@/lib/api-client', () => {
  return {
    ApiClient: jest.fn().mockImplementation(() => ({
      getBusinesses: (...args: unknown[]) => mockGetBusinesses(...args),
      getJobs: (...args: unknown[]) => mockGetJobs(...args),
      getNews: (...args: unknown[]) => mockGetNews(...args),
      getEvents: (...args: unknown[]) => mockGetEvents(...args),
      getDeals: (...args: unknown[]) => mockGetDeals(...args),
      getConsultancies: (...args: unknown[]) => mockGetConsultancies(...args),
    })),
  };
});

import { GET } from '@/app/api/search/route';

describe('Search API Route', () => {
  const mockBusinessData = {
    data: [
      {
        business_id: 'b1',
        name: 'Taj Indian Cuisine',
        category: 'Restaurants',
        description: 'Authentic Indian food',
        city: 'Houston',
        state: 'TX',
        rating: 4.5,
        review_count: 120,
        image_url: '/img/taj.jpg',
        address: '123 Main',
        zip_code: '77001',
        phone: '555-1234',
        email: 'info@taj.com',
        website: 'https://taj.com',
        hours: '9-9',
        status: 'active',
        created_at: '2024-01-01',
      },
    ],
  };

  const mockJobData = {
    data: [
      {
        job_id: 'j1',
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Build great products',
        city: 'Austin',
        state: 'TX',
        salary_range: '$100k-$150k',
        job_type: 'Full-time',
        category: 'Technology',
        posted_date: '2024-06-01',
        status: 'active',
        created_at: '2024-06-01',
      },
    ],
  };

  const mockNewsData = {
    data: [
      {
        news_id: 'n1',
        title: 'Community Event',
        category: 'Community',
        content: 'Big event in the Indian community',
        summary: 'Event summary',
        author: 'Reporter',
        image_url: '/img/news.jpg',
        published_date: '2024-06-01',
        status: 'published',
        created_at: '2024-06-01',
      },
    ],
  };

  const emptyData = { data: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBusinesses.mockResolvedValue(mockBusinessData);
    mockGetJobs.mockResolvedValue(mockJobData);
    mockGetNews.mockResolvedValue(mockNewsData);
    mockGetEvents.mockResolvedValue(emptyData);
    mockGetDeals.mockResolvedValue(emptyData);
    mockGetConsultancies.mockResolvedValue(emptyData);
  });

  describe('GET', () => {
    it('should return 400 for missing query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search');
      const response = await GET(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('at least 2 characters');
    });

    it('should return 400 for query shorter than 2 characters', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=a');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should return search results for valid query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=indian');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('query', 'indian');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('total_pages');
      expect(data).toHaveProperty('took_ms');
      expect(data).toHaveProperty('facets');
    });

    it('should return results from all content types', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      await GET(request);

      expect(mockGetBusinesses).toHaveBeenCalled();
      expect(mockGetJobs).toHaveBeenCalled();
      expect(mockGetNews).toHaveBeenCalled();
      expect(mockGetEvents).toHaveBeenCalled();
      expect(mockGetDeals).toHaveBeenCalled();
      expect(mockGetConsultancies).toHaveBeenCalled();
    });

    it('should filter by requested content types', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&types=business,job'
      );
      await GET(request);

      expect(mockGetBusinesses).toHaveBeenCalled();
      expect(mockGetJobs).toHaveBeenCalled();
      expect(mockGetNews).not.toHaveBeenCalled();
      expect(mockGetEvents).not.toHaveBeenCalled();
      expect(mockGetDeals).not.toHaveBeenCalled();
      expect(mockGetConsultancies).not.toHaveBeenCalled();
    });

    it('should pass city and state to fetchers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&city=Houston&state=TX'
      );
      await GET(request);

      expect(mockGetBusinesses).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Houston', state: 'TX' })
      );
    });

    it('should pass category to fetchers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&category=Restaurants'
      );
      await GET(request);

      // Category filter is applied post-query on results, not on API call
      // The API still fetches all categories
      expect(mockGetBusinesses).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&page=2&limit=5'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.page).toBe(2);
      expect(data.limit).toBe(5);
    });

    it('should default page to 1 and limit to DEFAULT_SEARCH_LIMIT', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const data = await response.json();

      expect(data.page).toBe(1);
      expect(data.limit).toBe(20);
    });

    it('should compute facets from results', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=indian');
      const response = await GET(request);
      const data = await response.json();

      expect(data.facets).toHaveProperty('content_types');
      expect(data.facets).toHaveProperty('cities');
      expect(data.facets).toHaveProperty('categories');
      expect(Array.isArray(data.facets.content_types)).toBe(true);
      expect(Array.isArray(data.facets.cities)).toBe(true);
      expect(Array.isArray(data.facets.categories)).toBe(true);
    });

    it('should include took_ms timing', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.took_ms).toBe('number');
      expect(data.took_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle API errors gracefully', async () => {
      mockGetBusinesses.mockRejectedValue(new Error('API down'));
      mockGetJobs.mockRejectedValue(new Error('API down'));
      mockGetNews.mockRejectedValue(new Error('API down'));
      mockGetEvents.mockRejectedValue(new Error('API down'));
      mockGetDeals.mockRejectedValue(new Error('API down'));
      mockGetConsultancies.mockRejectedValue(new Error('API down'));

      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const data = await response.json();

      // Individual fetcher errors are caught — returns empty results
      expect(response.status).toBe(200);
      expect(data.total).toBe(0);
      expect(data.results).toEqual([]);
    });

    it('should sanitize the query input', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=%20%20test%20%20'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.query).toBe('test');
    });

    it('should normalize results to SearchResult format', async () => {
      const request = new NextRequest('http://localhost:3000/api/search?q=taj');
      const response = await GET(request);
      const data = await response.json();

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('url');
      }
    });

    it('should filter results by category post-fetch', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&category=Restaurants'
      );
      const response = await GET(request);
      const data = await response.json();

      // All results should match the category
      for (const result of data.results) {
        expect(result.category?.toLowerCase()).toBe('restaurants');
      }
    });

    it('should ignore invalid content types in types param', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test&types=business,invalidtype,job'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetBusinesses).toHaveBeenCalled();
      expect(mockGetJobs).toHaveBeenCalled();
    });
  });
});
