/**
 * @jest-environment node
 */

/**
 * Newsletter Subscribe API Route Tests
 * Tests POST /api/newsletter/subscribe endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newsletter/subscribe/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a NextRequest with JSON body
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── Validation Tests ─────────────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 when email is missing', async () => {
      const request = createRequest({ name: 'Test User' });
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
      const request = createRequest({ email: 12345 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Email address is required.');
    });

    it('returns 400 for invalid email format', async () => {
      const request = createRequest({ email: 'not-an-email' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address.');
    });

    it('returns 400 for email without domain', async () => {
      const request = createRequest({ email: 'user@' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address.');
    });

    it('returns 400 for email without TLD', async () => {
      const request = createRequest({ email: 'user@domain' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid email address.');
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
        digest_types: ['community', 'invalid_type'],
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Invalid digest type: invalid_type');
    });

    it('returns 400 for invalid frequency', async () => {
      const request = createRequest({
        email: 'test@example.com',
        frequency: 'monthly',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Invalid frequency: monthly');
    });

    it('returns 400 when whatsapp opted in but no number provided', async () => {
      const request = createRequest({
        email: 'test@example.com',
        whatsapp_opted_in: true,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('WhatsApp phone number is required when opting in.');
    });

    it('returns 400 when whatsapp opted in with empty number', async () => {
      const request = createRequest({
        email: 'test@example.com',
        whatsapp_opted_in: true,
        whatsapp_number: '',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('WhatsApp phone number is required when opting in.');
    });
  });

  // ── Successful Subscription Tests ────────────────────────────────

  describe('Successful Subscription', () => {
    it('creates subscription with minimal fields (email only)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_123' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBeUndefined(); // response uses subscription_id
      expect(data.subscription_id).toBe('sub_123');
      expect(data.status).toBe('active');
      expect(data.message).toBe('Successfully subscribed!');
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_456' }),
      } as Response);

      const request = createRequest({ email: '  Test@Example.COM  ' });
      await POST(request);

      const fetchCall = mockFetch.mock.calls[0];
      const sentBody = JSON.parse(fetchCall[1].body);
      expect(sentBody.email).toBe('test@example.com');
    });

    it('sends correct payload to Teable API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_789' }),
      } as Response);

      const request = createRequest({
        email: 'user@domain.com',
        name: 'Test User',
        city: 'Houston',
        state: 'TX',
        digest_types: ['community', 'jobs'],
        frequency: 'daily',
        whatsapp_opted_in: true,
        whatsapp_number: '+1234567890',
      });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/newsletter/subscriptions');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);

      const sentBody = JSON.parse(options.body);
      expect(sentBody.email).toBe('user@domain.com');
      expect(sentBody.name).toBe('Test User');
      expect(sentBody.city).toBe('Houston');
      expect(sentBody.state).toBe('TX');
      expect(sentBody.digest_types).toEqual(['community', 'jobs']);
      expect(sentBody.frequency).toBe('daily');
      expect(sentBody.whatsapp_opted_in).toBe(true);
      expect(sentBody.whatsapp_number).toBe('+1234567890');
      expect(sentBody.status).toBe('active');
      expect(sentBody.subscribed_at).toBeDefined();
    });

    it('uses default digest_types when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_def' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.digest_types).toEqual(['community']);
    });

    it('uses default frequency when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_def' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.frequency).toBe('weekly');
    });

    it('uses subscription_id from response when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription_id: 'sub_specific' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.subscription_id).toBe('sub_specific');
    });

    it('falls back to id from response when subscription_id missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'fallback_id' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.subscription_id).toBe('fallback_id');
    });

    it('accepts all valid digest types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_all' }),
      } as Response);

      const allTypes = ['community', 'immigration', 'deals', 'jobs', 'events'];
      const request = createRequest({
        email: 'test@example.com',
        digest_types: allTypes,
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts all valid frequencies', async () => {
      for (const freq of ['daily', 'weekly', 'never']) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: `sub_${freq}` }),
        } as Response);

        const request = createRequest({
          email: 'test@example.com',
          frequency: freq,
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
      }
    });

    it('trims name whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_trim' }),
      } as Response);

      const request = createRequest({
        email: 'test@example.com',
        name: '  Test User  ',
      });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.name).toBe('Test User');
    });

    it('sets whatsapp_opted_in to false by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub_wa' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.whatsapp_opted_in).toBe(false);
    });
  });

  // ── Error Handling Tests ─────────────────────────────────────────

  describe('Error Handling', () => {
    it('returns Teable error message when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Email already subscribed.' }),
      } as Response);

      const request = createRequest({ email: 'existing@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('Email already subscribed.');
    });

    it('returns generic error when Teable returns error without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Failed to subscribe. Please try again.');
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
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.message).toBe('Failed to subscribe. Please try again.');
    });

    it('returns 500 when fetch throws network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });

    it('returns 500 when request body is invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/newsletter/subscribe',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not-json',
        },
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });

    it('uses error.error field as fallback message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: 'Validation failed on server' }),
      } as Response);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.message).toBe('Validation failed on server');
    });
  });
});
