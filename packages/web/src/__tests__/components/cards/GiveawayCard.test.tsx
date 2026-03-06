/**
 * GiveawayCard Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import GiveawayCard from '@/components/cards/GiveawayCard';
import type { GiveawayCampaign } from '@desi-connect/shared';

// Mock next/link and next/image
jest.mock('next/link', () => {
  return ({ href, children }: { href: string; children: React.ReactNode }) => (
    <div data-href={href}>{children}</div>
  );
});

jest.mock('next/image', () => {
  return (props: any) => <img {...props} />;
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
}));

function makeCampaign(overrides: Partial<GiveawayCampaign> = {}): GiveawayCampaign {
  return {
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
    city: 'Dallas',
    state: 'TX',
    ...overrides,
  } as GiveawayCampaign;
}

describe('GiveawayCard', () => {
  it('renders the campaign title', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('Win a Prize')).toBeDefined();
  });

  it('renders the sponsor name', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('Test Corp')).toBeDefined();
  });

  it('renders the prize description', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('$500 Gift Card')).toBeDefined();
  });

  it('renders the prize value', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('$500')).toBeDefined();
  });

  it('renders the description', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('Enter to win amazing prizes!')).toBeDefined();
  });

  it('renders status badge', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    const badge = screen.getByTestId('campaign-status');
    expect(badge.textContent).toBe('active');
  });

  it('renders countdown', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    const countdown = screen.getByTestId('countdown');
    expect(countdown.textContent).toBe('10 days left');
  });

  it('renders entry count', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    const entryCount = screen.getByTestId('entry-count');
    expect(entryCount.textContent).toContain('250');
  });

  it('renders location', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByText('Dallas, TX')).toBeDefined();
  });

  it('does not render location when city/state missing', () => {
    render(<GiveawayCard campaign={makeCampaign({ city: undefined, state: undefined } as any)} />);
    expect(screen.queryByText(/Dallas/)).toBeNull();
  });

  it('links to the correct giveaway detail page', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    const link = screen.getByTestId('giveaway-card').closest('[data-href]');
    expect(link?.getAttribute('data-href')).toBe('/giveaways/camp-1');
  });

  it('renders progress bar for active campaigns', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByTestId('progress-bar')).toBeDefined();
  });

  it('renders the campaign image', () => {
    render(<GiveawayCard campaign={makeCampaign({ image_url: '/test-image.jpg' } as any)} />);
    const img = screen.getByAltText('Win a Prize');
    expect(img.getAttribute('src')).toBe('/test-image.jpg');
  });

  it('uses placeholder when no image_url', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    const img = screen.getByAltText('Win a Prize');
    expect(img.getAttribute('src')).toContain('placeholder');
  });

  it('renders data-testid attribute', () => {
    render(<GiveawayCard campaign={makeCampaign()} />);
    expect(screen.getByTestId('giveaway-card')).toBeDefined();
  });
});
