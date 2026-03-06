/**
 * @jest-environment node
 */

/**
 * Giveaway Entry API Route Tests
 * POST: Submit an entry to a giveaway campaign
 */

import { POST } from '@/app/api/giveaways/enter/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    enterGiveaway: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

function createRequest(body: Record<string, any>): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/giveaways/enter'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/giveaways/enter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an entry successfully', async () => {
    (mockApiClient as any).enterGiveaway.mockResolvedValue({
      data: { entry_id: 'e1', campaign_id: 'c1', entry_method: 'email_signup' },
    });

    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'email_signup',
      email: 'test@example.com',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('rejects missing campaign_id', async () => {
    const req = createRequest({
      entry_method: 'email_signup',
      email: 'test@example.com',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('campaign_id');
  });

  it('rejects missing entry_method', async () => {
    const req = createRequest({
      campaign_id: 'c1',
      email: 'test@example.com',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('entry_method');
  });

  it('rejects email_signup without email', async () => {
    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'email_signup',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.toLowerCase()).toContain('email');
  });

  it('rejects invalid email format', async () => {
    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'email_signup',
      email: 'not-an-email',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.toLowerCase()).toContain('email');
  });

  it('accepts valid email format', async () => {
    (mockApiClient as any).enterGiveaway.mockResolvedValue({
      data: { entry_id: 'e1' },
    });

    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'email_signup',
      email: 'user@domain.co.uk',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('allows non-email methods without email', async () => {
    (mockApiClient as any).enterGiveaway.mockResolvedValue({
      data: { entry_id: 'e2' },
    });

    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'social_share',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('handles API errors during entry', async () => {
    (mockApiClient as any).enterGiveaway.mockRejectedValue(new Error('Campaign full'));

    const req = createRequest({
      campaign_id: 'c1',
      entry_method: 'social_share',
    });
    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
