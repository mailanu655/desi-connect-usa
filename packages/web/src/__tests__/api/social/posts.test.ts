/**
 * @jest-environment node
 */

/**
 * Social Media Posts API Route Tests
 * GET: List posts with filters
 * POST: Create new social media post
 */

import { GET, POST } from '@/app/api/social/posts/route';
import { NextRequest } from 'next/server';

// Mock the api-client module
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getSocialPosts: jest.fn(),
    createSocialPost: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// ─── GET /api/social/posts ──────────────────────────────────────────
describe('GET /api/social/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns posts successfully', async () => {
    const mockPosts = [
      { post_id: 'p1', title: 'Test Post', caption: 'Hello' },
    ];
    (mockApiClient as any).getSocialPosts.mockResolvedValue({ data: mockPosts });

    const req = createRequest('http://localhost:3000/api/social/posts');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockPosts);
  });

  it('passes filter params to API client', async () => {
    (mockApiClient as any).getSocialPosts.mockResolvedValue({ data: [] });

    const req = createRequest(
      'http://localhost:3000/api/social/posts?status=published&platform=instagram&category=food_feature'
    );
    await GET(req);

    expect((mockApiClient as any).getSocialPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        platform: 'instagram',
        category: 'food_feature',
      })
    );
  });

  it('handles API errors', async () => {
    (mockApiClient as any).getSocialPosts.mockRejectedValue(new Error('API down'));

    const req = createRequest('http://localhost:3000/api/social/posts');
    const res = await GET(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── POST /api/social/posts ─────────────────────────────────────────
describe('POST /api/social/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validPost = {
    title: 'New Post',
    caption: 'Check this out!',
    platforms: ['instagram', 'facebook'],
    scheduled_date: '2025-04-01T10:00:00Z',
    category: 'food_feature',
  };

  it('creates a post successfully', async () => {
    (mockApiClient as any).createSocialPost.mockResolvedValue({
      data: { post_id: 'p1', ...validPost },
    });

    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPost),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('rejects when title is missing', async () => {
    const { title, ...noTitle } = validPost;
    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noTitle),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('rejects when caption is missing', async () => {
    const { caption, ...noCaption } = validPost;
    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noCaption),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects when platforms is empty array', async () => {
    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPost, platforms: [] }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects when scheduled_date is missing', async () => {
    const { scheduled_date, ...noDate } = validPost;
    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noDate),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('handles API errors during creation', async () => {
    (mockApiClient as any).createSocialPost.mockRejectedValue(new Error('DB Error'));

    const req = createRequest('http://localhost:3000/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPost),
    });
    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
