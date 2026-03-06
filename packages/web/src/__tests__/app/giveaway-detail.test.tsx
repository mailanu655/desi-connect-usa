/**
 * Giveaway Detail Page Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GiveawayDetailPage from '@/app/giveaways/[id]/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'camp-1' })),
}));

// Mock next/image
jest.mock('next/image', () => {
  return (props: any) => <img {...props} />;
});

// Mock child components
jest.mock('@/components/giveaway/GiveawayEntryForm', () => {
  return (props: any) => (
    <div data-testid="giveaway-entry-form">Entry Form Mock</div>
  );
});

jest.mock('@/components/giveaway/ReferralWidget', () => {
  return (props: any) => (
    <div data-testid="referral-widget">Referral Widget Mock</div>
  );
});

// Mock giveaway-utils
jest.mock('@/lib/giveaway/giveaway-utils', () => ({
  getCampaignTimeStatus: jest.fn(() => ({
    isActive: true,
    hasEnded: false,
    isUpcoming: false,
    daysRemaining: 10,
    percentComplete: 50,
  })),
  formatCountdown: jest.fn(() => '10 days left'),
  formatPrizeValue: jest.fn((val: number) => `$${val}`),
  formatEntryCount: jest.fn((val: number) => `${val}`),
  generateReferralCode: jest.fn(() => 'REF-GUEST-123'),
  getEntryMethodBreakdown: jest.fn(() => []),
}));

const mockCampaign = {
  campaign_id: 'camp-1',
  title: 'Win a Prize',
  description: 'Enter to win amazing prizes!',
  prize_description: '$500 Gift Card',
  prize_value: 500,
  sponsor_name: 'Test Corp',
  start_date: '2025-01-01',
  end_date: '2030-12-31',
  status: 'active',
  total_entries: 250,
  total_participants: 100,
  winner_count: 3,
  max_entries_per_user: 5,
  city: 'Dallas',
  state: 'TX',
  rules: 'Must be 18+ to enter',
};

describe('GiveawayDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as any;
    render(<GiveawayDetailPage />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders campaign title after loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Win a Prize')).toBeDefined();
    });
  });

  it('renders sponsor name', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Corp/)).toBeDefined();
    });
  });

  it('renders prize description', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      const prize = screen.getByTestId('prize-description');
      expect(prize.textContent).toBe('$500 Gift Card');
    });
  });

  it('renders campaign description', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      const desc = screen.getByTestId('campaign-description');
      expect(desc.textContent).toBe('Enter to win amazing prizes!');
    });
  });

  it('renders countdown text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      const countdown = screen.getByTestId('countdown-text');
      expect(countdown.textContent).toBe('10 days left');
    });
  });

  it('renders total entries stat', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      const entries = screen.getByTestId('total-entries');
      expect(entries.textContent).toBe('250');
    });
  });

  it('renders campaign rules when present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Rules & Terms')).toBeDefined();
      expect(screen.getByText('Must be 18+ to enter')).toBeDefined();
    });
  });

  it('renders GiveawayEntryForm component', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('giveaway-entry-form')).toBeDefined();
    });
  });

  it('renders ReferralWidget component', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('referral-widget')).toBeDefined();
    });
  });

  it('renders location when city and state present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Dallas, TX')).toBeDefined();
    });
  });

  it('renders campaign dates', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Campaign Dates')).toBeDefined();
    });
  });

  it('renders error state on fetch failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch giveaway')).toBeDefined();
    });
  });

  it('renders "Back to Giveaways" link on error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Giveaways')).toBeDefined();
    });
  });

  it('fetches campaign with the correct URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCampaign }),
    });
    global.fetch = fetchMock as any;

    render(<GiveawayDetailPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('/giveaways/camp-1');
    });
  });

  it('is exported as default', () => {
    expect(GiveawayDetailPage).toBeDefined();
    expect(typeof GiveawayDetailPage).toBe('function');
  });
});
