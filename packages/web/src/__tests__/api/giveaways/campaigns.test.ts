/**
 * @jest-environment node
 */

/**
 * Giveaway Campaigns API Route Tests
 * GET: List campaigns with filters
 * POST: Create new giveaway campaign
 */

import { GET, POST } from '@/app/api/giveaways/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getGiveaways: jest.fn(),
    createGiveaway: jest.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// ─── GET /api/giveaways ─────────────────────────────────────────────
describe('GET /api/giveaways', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns campaigns successfully', async () => {
    const mockCampaigns = [
      { campaign_id: 'c1', title: 'Win a Prize' },
    ];
    (mockApiClient as any).getGiveaways.mockResolvedValue({
      data: mockCampaigns,
      pagination: { page: 1, totalPages: 1, total: 1, limit: 12 },
    });

    const req = createRequest('http://localhost:3000/api/giveaways');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockCampaigns);
  });

  it('passes status filter to API', async () => {
    (mockApiClient as any).getGiveaways.mockResolvedValue({ data: [] });

    const req = createRequest('http://localhost:3000/api/giveaways?status=active');
    await GET(req);

    expect((mockApiClient as any).getGiveaways).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' })
    );
  });

  it('passes city and state filters', async () => {
    (mockApiClient as any).getGiveaways.mockResolvedValue({ data: [] });

    const req = createRequest('http://localhost:3000/api/giveaways?city=Dallas&state=TX');
    await GET(req);

    expect((mockApiClient as any).getGiveaways).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Dallas', state: 'TX' })
    );
  });

  it('passes pagination params', async () => {
    (mockApiClient as any).getGiveaways.mockResolvedValue({ data: [] });

    const req = createRequest('http://localhost:3000/api/giveaways?page=2&limit=6');
    await GET(req);

    expect((mockApiClient as any).getGiveaways).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 6 })
    );
  });

  it('handles API errors', async () => {
    (mockApiClient as any).getGiveaways.mockRejectedValue(new Error('Network error'));

    const req = createRequest('http://localhost:3000/api/giveaways');
    const res = await GET(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── POST /api/giveaways ────────────────────────────────────────────
describe('POST /api/giveaways', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCampaign = {
    title: 'Win Big',
    description: 'Enter to win amazing prizes',
    prize_description: '$500 Gift Card',
    sponsor_name: 'Test Corp',
    start_date: '2025-04-01',
    end_date: '2025-05-01',
  };

  it('creates a campaign successfully', async () => {
    (mockApiClient as any).createGiveaway.mockResolvedValue({
      data: { campaign_id: 'c1', ...validCampaign },
    });

    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCampaign),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('rejects missing title', async () => {
    const { title, ...noTitle } = validCampaign;
    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noTitle),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects missing description', async () => {
    const { description, ...noDesc } = validCampaign;
    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noDesc),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects missing prize_description', async () => {
    const { prize_description, ...noPrize } = validCampaign;
    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noPrize),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects missing sponsor_name', async () => {
    const { sponsor_name, ...noSponsor } = validCampaign;
    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noSponsor),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects when end_date is before start_date', async () => {
    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validCampaign,
        start_date: '2025-06-01',
        end_date: '2025-04-01',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('handles API errors during creation', async () => {
    (mockApiClient as any).createGiveaway.mockRejectedValue(new Error('DB error'));

    const req = createRequest('http://localhost:3000/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCampaign),
    });
    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
