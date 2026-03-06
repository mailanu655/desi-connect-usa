/** @jest-environment node */

import { NextRequest } from 'next/server';

const mockGetUserSubmissions = jest.fn();

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getUserSubmissions: (...args: unknown[]) => mockGetUserSubmissions(...args),
  },
}));

import { GET } from '@/app/api/users/submissions/route';

describe('User Submissions API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserSubmissions.mockReset();
  });

  describe('GET', () => {
    it('should return submissions with default parameters', async () => {
      const mockSubmissions = {
        data: [
          {
            submission_id: '1',
            title: 'Business 1',
            content_type: 'business',
            status: 'approved',
            submitted_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockGetUserSubmissions.mockResolvedValue(mockSubmissions);

      const request = new NextRequest('http://localhost:3000/api/users/submissions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSubmissions);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should pass through content_type filter', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?content_type=business'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: 'business',
        status: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should pass through status filter', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?status=pending'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: 'pending',
        page: undefined,
        limit: undefined,
      });
    });

    it('should parse page parameter as integer', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?page=2'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: undefined,
        page: 2,
        limit: undefined,
      });
    });

    it('should parse limit parameter as integer', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?limit=20'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: undefined,
        page: undefined,
        limit: 20,
      });
    });

    it('should handle multiple filters together', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?content_type=event&status=approved&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: 'event',
        status: 'approved',
        page: 1,
        limit: 10,
      });
    });

    it('should return 500 error on API failure', async () => {
      mockGetUserSubmissions.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/users/submissions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user submissions');
    });

    it('should handle empty submissions list', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest('http://localhost:3000/api/users/submissions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
    });

    it('should handle null data response', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: null });

      const request = new NextRequest('http://localhost:3000/api/users/submissions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeNull();
    });

    it('should ignore undefined parameters', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?content_type=business&page=invalid'
      );
      const response = await GET(request);

      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: 'business',
        status: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should handle pagination with valid page numbers', async () => {
      mockGetUserSubmissions.mockResolvedValue({ data: [] });

      const request = new NextRequest(
        'http://localhost:3000/api/users/submissions?page=5&limit=50'
      );
      const response = await GET(request);

      expect(mockGetUserSubmissions).toHaveBeenCalledWith({
        content_type: undefined,
        status: undefined,
        page: 5,
        limit: 50,
      });
    });
  });
});
