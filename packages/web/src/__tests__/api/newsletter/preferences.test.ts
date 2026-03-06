/**
 * @jest-environment node
 */

/**
 * Newsletter Preferences API Route Tests
 * Tests POST /api/newsletter/preferences endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newsletter/preferences/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a NextRequest with JSON body
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/newsletter/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/newsletter/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── Validation Tests ─────────────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 when email is missing', async () => {
      const request = createRequest({ digest_types: ['community'] });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required to update preferences.');
    });

    it('returns 400 when email is empty', async () => {
      const request = createRequest({ email: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required to update preferences.');
    });

    it('returns 400 when email is not a string', async () => {
      const request = createRequest({ email: 123 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email is required to update preferences.');
    });

    it('returns 400 when digest_types is not an array', async () => {
      const request = createRequest({
        email: 'test@example.com',
        digest_types: 'community',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('digest_types must be an array.');
    });

    it('returns 400 for invalid digest type', async () => {
      const request = createRequest({
        email: 'test@example.com',
        digest_types: ['community', 'invalid'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid digest type: invalid');
    });

    it('returns 400 for invalid frequency', async () => {
      const request = createRequest({
        email: 'test@example.com',
        frequency: 'biweekly',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid frequency: biweekly');
    });
  });

  // ── Successful Update Tests ──────────────────────────────────────

  describe('Successful Preference Update', () => {
    const mockUpdated = {
      subscription_id: 'sub_123',
      email: 'test@example.com',
      digest_types: ['jobs', 'events'],
      frequency: 'daily',
      status: 'active',
    };

    it('updates digest_types successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        digest_types: ['jobs', 'events'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.digest_types).toEqual(['jobs', 'events']);
    });

    it('updates frequency successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUpdated, frequency: 'daily' }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'daily',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.frequency).toBe('daily');
    });

    it('updates WhatsApp preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockUpdated,
          whatsapp_opted_in: true,
          whatsapp_number: '+1234567890',
        }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        whatsapp_opted_in: true,
        whatsapp_number: '+1234567890',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('updates city and state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUpdated, city: 'Dallas', state: 'TX' }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        city: 'Dallas',
        state: 'TX',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('only includes provided fields in update payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'daily',
      });
      await POST(request);

      const [, options] = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody.frequency).toBe('daily');
      expect(sentBody.updated_at).toBeDefined();
      expect(sentBody.digest_types).toBeUndefined();
      expect(sentBody.whatsapp_opted_in).toBeUndefined();
      expect(sentBody.city).toBeUndefined();
    });

    it('always includes updated_at timestamp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'never',
      });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.updated_at).toBeDefined();
      // Should be a valid ISO string
      expect(new Date(sentBody.updated_at).toISOString()).toBe(sentBody.updated_at);
    });

    it('calls Teable PATCH endpoint with correct email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      } as Response);

      const request = createRequest({
        email: 'Test@Example.COM',
        frequency: 'daily',
      });
      await POST(request);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('email=test%40example.com');
      expect(options.method).toBe('PATCH');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);
    });

    it('updates multiple fields at once', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        digest_types: ['community', 'immigration'],
        frequency: 'daily',
        whatsapp_opted_in: true,
        whatsapp_number: '+1987654321',
        city: 'Austin',
        state: 'TX',
      });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.digest_types).toEqual(['community', 'immigration']);
      expect(sentBody.frequency).toBe('daily');
      expect(sentBody.whatsapp_opted_in).toBe(true);
      expect(sentBody.whatsapp_number).toBe('+1987654321');
      expect(sentBody.city).toBe('Austin');
      expect(sentBody.state).toBe('TX');
    });

    it('allows updating with empty digest_types array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockUpdated, digest_types: [] }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        digest_types: [],
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
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

      const request = createRequest({
        email: 'unknown@example.com',
        frequency: 'daily',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('No subscription found for this email.');
    });

    it('returns Teable error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Update failed' }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'daily',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Update failed');
    });

    it('returns generic error when Teable returns no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'daily',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.message).toBe('Failed to update preferences.');
    });

    it('returns 500 on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const request = createRequest({
        email: 'test@example.com',
        frequency: 'daily',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});
