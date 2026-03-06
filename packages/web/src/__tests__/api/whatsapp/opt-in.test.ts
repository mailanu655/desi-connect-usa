/**
 * @jest-environment node
 */

/**
 * WhatsApp Opt-In API Route Tests
 * Tests POST /api/whatsapp/opt-in endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/whatsapp/opt-in/route';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a NextRequest with JSON body
function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/whatsapp/opt-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/whatsapp/opt-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  // ── Validation Tests ─────────────────────────────────────────────

  describe('Input Validation', () => {
    it('returns 400 when phone_number is missing', async () => {
      const request = createRequest({ name: 'Test User' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Phone number is required.');
    });

    it('returns 400 when phone_number is empty string', async () => {
      const request = createRequest({ phone_number: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Phone number is required.');
    });

    it('returns 400 when phone_number is not a string', async () => {
      const request = createRequest({ phone_number: 1234567890 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Phone number is required.');
    });

    it('returns 400 for phone number with fewer than 10 digits', async () => {
      const request = createRequest({ phone_number: '12345' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid phone number with country code.');
    });

    it('returns 400 for phone number with more than 15 digits', async () => {
      const request = createRequest({ phone_number: '1234567890123456' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid phone number with country code.');
    });

    it('returns 400 for phone number with letters', async () => {
      const request = createRequest({ phone_number: 'abcdefghij' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('Please enter a valid phone number with country code.');
    });
  });

  // ── Phone Number Format Handling Tests ───────────────────────────

  describe('Phone Number Format Handling', () => {
    it('accepts 10-digit number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_123' }),
      } as Response);

      const request = createRequest({ phone_number: '1234567890' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts 15-digit number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_15' }),
      } as Response);

      const request = createRequest({ phone_number: '123456789012345' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts number with + prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_plus' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts number with dashes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_dash' }),
      } as Response);

      const request = createRequest({ phone_number: '123-456-7890' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts number with parentheses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_parens' }),
      } as Response);

      const request = createRequest({ phone_number: '(123) 456-7890' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts number with spaces', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_space' }),
      } as Response);

      const request = createRequest({ phone_number: '+1 234 567 8901' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts Indian format phone number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_in' }),
      } as Response);

      const request = createRequest({ phone_number: '+91 98765 43210' });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  // ── Successful Opt-In Tests ──────────────────────────────────────

  describe('Successful Opt-In', () => {
    it('creates opt-in with phone_number only', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_123' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.opt_in_id).toBe('opt_123');
      expect(data.message).toBe('Successfully opted in to WhatsApp updates!');
    });

    it('creates opt-in with name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_named' }),
      } as Response);

      const request = createRequest({
        phone_number: '+11234567890',
        name: 'Rajesh Kumar',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.opt_in_id).toBe('opt_named');
    });

    it('sends correct payload to Teable API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_payload' }),
      } as Response);

      const request = createRequest({
        phone_number: '  +1 (234) 567-8901  ',
        name: '  Test User  ',
      });
      await POST(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/whatsapp/opt-ins');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);

      const sentBody = JSON.parse(options.body);
      expect(sentBody.phone_number).toBe('+1 (234) 567-8901');
      expect(sentBody.name).toBe('Test User');
      expect(sentBody.status).toBe('active');
      expect(sentBody.source).toBe('website');
      expect(sentBody.opted_in_at).toBeDefined();
    });

    it('uses opt_in_id from response when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ opt_in_id: 'specific_opt_id' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.opt_in_id).toBe('specific_opt_id');
    });

    it('falls back to id when opt_in_id missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'fallback_id' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.opt_in_id).toBe('fallback_id');
    });

    it('omits name from payload when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_noname' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.name).toBeUndefined();
    });

    it('sets opted_in_at as ISO timestamp', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'opt_time' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      await POST(request);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(new Date(sentBody.opted_in_at).toISOString()).toBe(sentBody.opted_in_at);
    });
  });

  // ── Error Handling Tests ─────────────────────────────────────────

  describe('Error Handling', () => {
    it('returns Teable error message on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Phone number already registered.' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toBe('Phone number already registered.');
    });

    it('returns Teable error.error as fallback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: 'Validation error on server' }),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.message).toBe('Validation error on server');
    });

    it('returns generic error when Teable returns no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Failed to opt in. Please try again.');
    });

    it('handles Teable json parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('Bad Gateway');
        },
      } as Response);

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.message).toBe('Failed to opt in. Please try again.');
    });

    it('returns 500 on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const request = createRequest({ phone_number: '+11234567890' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });

    it('returns 500 when request body is invalid JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/whatsapp/opt-in',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'not valid json',
        },
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    });
  });
});
