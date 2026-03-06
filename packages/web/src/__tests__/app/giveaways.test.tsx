/**
 * Giveaways Listing Page Tests
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GiveawaysPage from '@/app/giveaways/page';

// Mock child components
jest.mock('@/components/cards/GiveawayCard', () => {
  return ({ campaign }: any) => (
    <div data-testid={`giveaway-card-${campaign.campaign_id}`}>{campaign.title}</div>
  );
});

jest.mock('@/components/ui/CitySelector', () => {
  return ({ value, onSelect }: any) => (
    <select
      data-testid="city-selector"
      value={value}
      onChange={(e: any) => onSelect(e.target.value)}
    >
      <option value="">All Cities</option>
      <option value="Dallas">Dallas</option>
      <option value="Houston">Houston</option>
    </select>
  );
});

jest.mock('@/components/ui/Pagination', () => {
  return ({ page, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <span>Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} data-testid="next-page">Next</button>
    </div>
  );
});

jest.mock('@/lib/constants', () => ({
  DEFAULT_PAGE_SIZE: 12,
}));

const mockCampaigns = [
  { campaign_id: 'c1', title: 'Win a Prize' },
  { campaign_id: 'c2', title: 'Free Dinner' },
];

describe('GiveawaysPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress scrollTo
    window.scrollTo = jest.fn() as any;
  });

  it('renders the page heading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);
    expect(screen.getByText('Giveaways')).toBeDefined();
  });

  it('renders loading skeletons initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<GiveawaysPage />);
    // 6 skeleton cards rendered during loading
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
  });

  it('renders giveaway cards after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockCampaigns, pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByTestId('giveaway-card-c1')).toBeDefined();
      expect(screen.getByTestId('giveaway-card-c2')).toBeDefined();
    });
  });

  it('shows results count after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockCampaigns, pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByText('Found 2 giveaways')).toBeDefined();
    });
  });

  it('shows empty state when no campaigns found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByText('No giveaways found')).toBeDefined();
    });
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByText('Error loading giveaways')).toBeDefined();
    });
  });

  it('shows error state on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });

  it('renders status filter dropdown', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);
    expect(screen.getByTestId('status-filter')).toBeDefined();
  });

  it('renders city selector', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);
    expect(screen.getByTestId('city-selector')).toBeDefined();
  });

  it('re-fetches when status filter changes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: { totalPages: 1 } }),
    });
    global.fetch = fetchMock as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId('status-filter'), {
      target: { value: 'active' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const lastUrl = fetchMock.mock.calls[1][0];
      expect(lastUrl).toContain('status=active');
    });
  });

  it('renders pagination when totalPages > 1', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockCampaigns, pagination: { totalPages: 3 } }),
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeDefined();
    });
  });

  it('does not render pagination when totalPages is 1', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: mockCampaigns, pagination: { totalPages: 1 } }),
    }) as any;

    render(<GiveawaysPage />);

    await waitFor(() => {
      expect(screen.getByTestId('giveaway-card-c1')).toBeDefined();
    });

    expect(screen.queryByTestId('pagination')).toBeNull();
  });

  it('is exported as default', () => {
    expect(GiveawaysPage).toBeDefined();
    expect(typeof GiveawaysPage).toBe('function');
  });
});
