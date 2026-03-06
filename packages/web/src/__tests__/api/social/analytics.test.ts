/**
 * @jest-environment node
 */

/**
 * Social Media Analytics API Route Tests
 * GET: Retrieve analytics data with filters
 */

import { GET } from '@/app/api/social/analytics/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getSocialAnalytics: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('GET /api/social/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics data successfully', async () => {
    const mockData = {
      total_posts: 50,
      total_engagement: 1200,
      avg_engagement_rate: 4.5,
    };
    (mockApiClient as any).getSocialAnalytics.mockResolvedValue({ data: mockData });

    const req = createRequest('http://localhost:3000/api/social/analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockData);
  });

  it('passes period filter to API', async () => {
    (mockApiClient as any).getSocialAnalytics.mockResolvedValue({ data: {} });

    const req = createRequest('http://localhost:3000/api/social/analytics?period=30d');
    await GET(req);

    expect((mockApiClient as any).getSocialAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ period: '30d' })
    );
  });

  it('passes platform filter to API', async () => {
    (mockApiClient as any).getSocialAnalytics.mockResolvedValue({ data: {} });

    const req = createRequest('http://localhost:3000/api/social/analytics?platform=instagram');
    await GET(req);

    expect((mockApiClient as any).getSocialAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'instagram' })
    );
  });

  it('handles API errors', async () => {
    (mockApiClient as any).getSocialAnalytics.mockRejectedValue(new Error('Service error'));

    const req = createRequest('http://localhost:3000/api/social/analytics');
    const res = await GET(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
