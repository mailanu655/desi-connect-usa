/**
 * @jest-environment node
 */

/**
 * Newsletter Subscription Lookup API Route Tests
 * Tests GET /api/newsletter/subscription endpoint
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/newsletter/subscription/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a GET request with query params
function createRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/newsletter/subscription');
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return new NextRequest(url.toString(), { method: 'GET' });
}

describe('GET /api/newsletter/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── Validation Tests ─────────────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 when email param is missing', async () => {
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email query parameter is required.');
    });

    it('returns 400 when email param is empty', async () => {
      const request = createRequest({ email: '' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email query parameter is required.');
    });
  });

  // ── Successful Lookup Tests ──────────────────────────────────────

  describe('Successful Lookup', () => {
    const mockSubscription = {
      subscription_id: 'sub_123',
      email: 'test@example.com',
      name: 'Test User',
      digest_types: ['community', 'jobs'],
      frequency: 'weekly',
      status: 'active',
    };

    it('returns subscription data for valid email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription_id).toBe('sub_123');
      expect(data.email).toBe('test@example.com');
      expect(data.digest_types).toEqual(['community', 'jobs']);
    });

    it('normalizes email to lowercase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response);

      const request = createRequest({ email: 'Test@Example.COM' });
      await GET(request);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('email=test%40example.com');
    });

    it('trims email whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response);

      const request = createRequest({ email: '  test@example.com  ' });
      await GET(request);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('email=test%40example.com');
    });

    it('sends correct headers to Teable API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription,
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await GET(request);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('GET');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);
    });
  });

  // ── Error Handling Tests ─────────────────────────────────────────

  describe('Error Handling', () => {
    it('returns 404 when subscription not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const request = createRequest({ email: 'unknown@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('No subscription found for this email.');
    });

    it('returns Teable error message on non-404 failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Database error' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Database error');
    });

    it('returns generic error when Teable returns no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Failed to look up subscription.');
    });

    it('handles Teable json parse failure gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('Not JSON');
        },
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.message).toBe('Failed to look up subscription.');
    });

    it('returns 500 on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const request = createRequest({ email: 'test@example.com' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});
