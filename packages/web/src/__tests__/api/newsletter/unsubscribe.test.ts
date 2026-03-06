/**
 * @jest-environment node
 */

/**
 * Newsletter Unsubscribe API Route Tests
 * Tests POST /api/newsletter/unsubscribe endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newsletter/unsubscribe/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a NextRequest with JSON body
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/newsletter/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── Validation Tests ─────────────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 when email is missing', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email address is required.');
    });

    it('returns 400 when email is empty string', async () => {
      const request = createRequest({ email: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email address is required.');
    });

    it('returns 400 when email is not a string', async () => {
      const request = createRequest({ email: 42 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email address is required.');
    });
  });

  // ── Successful Unsubscribe Tests ─────────────────────────────────

  describe('Successful Unsubscribe', () => {
    it('unsubscribes successfully and returns success response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unsubscribed' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Successfully unsubscribed.');
    });

    it('normalizes email to lowercase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unsubscribed' }),
      } as Response);

      const request = createRequest({ email: 'Test@Example.COM' });
      await POST(request);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('email=test%40example.com');
    });

    it('trims email whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unsubscribed' }),
      } as Response);

      const request = createRequest({ email: '  test@example.com  ' });
      await POST(request);

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain('email=test%40example.com');
    });

    it('sends PATCH request with unsubscribed status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unsubscribed' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('PATCH');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);

      const sentBody = JSON.parse(options.body);
      expect(sentBody.status).toBe('unsubscribed');
      expect(sentBody.updated_at).toBeDefined();
    });

    it('includes updated_at as ISO timestamp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unsubscribed' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(new Date(sentBody.updated_at).toISOString()).toBe(sentBody.updated_at);
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
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('No subscription found for this email.');
    });

    it('returns Teable error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server crashed' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Server crashed');
    });

    it('returns generic error when Teable returns no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.message).toBe('Failed to unsubscribe.');
    });

    it('handles Teable json parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('Not JSON');
        },
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.message).toBe('Failed to unsubscribe.');
    });

    it('returns 500 on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Timeout'));

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });

    it('returns 500 when request body is invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/newsletter/unsubscribe',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{invalid',
        },
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});
